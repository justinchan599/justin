'use client'

import { useMemo, useState, useRef, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsInstance } from 'echarts-for-react'
import { CityWeatherData, MetricType } from '@/types/weather'
import { getMetricValue } from '@/lib/utils-weather'

interface LineChartProps {
  data: CityWeatherData[]
  metric: MetricType
  days: number
}

/** 视图模式：绝对温度 or 今昨温差 */
type ViewMode = 'absolute' | 'diff'

const CITY_COLOR_MAP: Record<string, string> = {
  beijing:   '#3b82f6',
  shenyang:  '#8b5cf6',
  xian:      '#f59e0b',
  wuhan:     '#ef4444',
  hangzhou:  '#06b6d4',
  chengdu:   '#10b981',
  guangzhou: '#ec4899',
  nanning:   '#84cc16',
}

function cityColor(cityId: string): string {
  return CITY_COLOR_MAP[cityId] ?? '#94a3b8'
}

export function LineChart({ data, metric, days }: LineChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('absolute')
  // NOTE: hoveredCity 为 null 表示无高亮，所有城市正常显示
  const [hoveredCity, setHoveredCity] = useState<string | null>(null)
  const chartRef = useRef<EChartsInstance | null>(null)

  /**
   * 构建「绝对温度」视图的 ECharts series 配置
   * 每个城市渲染两条线：今年（实线）和去年同期（虚线半透明）
   */
  const absoluteSeries = useMemo(() => {
    return data.flatMap((d) => {
      const color = cityColor(d.city.id)
      const isHighlighted = hoveredCity === null || hoveredCity === d.city.id
      const opacity = isHighlighted ? 1 : 0.08

      return [
        {
          name: `${d.city.name} 今年`,
          type: 'line',
          smooth: true,
          data: d.thisYear.slice(0, days).map((day) => getMetricValue(day, metric)),
          lineStyle: { color, width: isHighlighted ? 2.5 : 1, type: d.isMock ? 'dashed' : 'solid', opacity },
          itemStyle: { color, opacity },
          symbol: 'circle',
          symbolSize: 4,
          showSymbol: false,
          emphasis: { showSymbol: true, symbolSize: 6 },
          zlevel: isHighlighted ? 2 : 1,
        },
        {
          name: `${d.city.name} 去年`,
          type: 'line',
          smooth: true,
          data: d.lastYear.slice(0, days).map((day) => getMetricValue(day, metric)),
          lineStyle: { color, width: 1.5, type: 'dashed', opacity: isHighlighted ? 0.45 : 0.05 },
          itemStyle: { color, opacity: isHighlighted ? 0.45 : 0.05 },
          symbol: 'circle',
          symbolSize: 3,
          showSymbol: false,
          emphasis: { showSymbol: true, symbolSize: 5 },
          zlevel: isHighlighted ? 2 : 1,
        },
      ]
    })
  }, [data, metric, days, hoveredCity])

  /**
   * 构建「温差视图」的 ECharts series 配置
   * 每个城市只渲染一条差值线（今年-去年），基准 0 轴更清晰
   * isMock 城市使用虚线区分
   */
  const diffSeries = useMemo(() => {
    return data.map((d) => {
      const color = cityColor(d.city.id)
      const isHighlighted = hoveredCity === null || hoveredCity === d.city.id
      const opacity = isHighlighted ? 1 : 0.08

      const diffData = d.thisYear.slice(0, days).map((day, i) => {
        const ly = d.lastYear[i]
        if (!ly) return null
        const diff = parseFloat((getMetricValue(day, metric) - getMetricValue(ly, metric)).toFixed(1))
        return diff
      })

      return {
        name: d.city.name,
        type: 'line',
        smooth: true,
        data: diffData,
        lineStyle: { color, width: isHighlighted ? 2.5 : 1, type: d.isMock ? 'dashed' : 'solid', opacity },
        itemStyle: { color, opacity },
        areaStyle: isHighlighted && hoveredCity !== null
          ? { color, opacity: 0.08 }
          : undefined,
        symbol: 'circle',
        symbolSize: 4,
        showSymbol: false,
        emphasis: { showSymbol: true, symbolSize: 6 },
        zlevel: isHighlighted ? 2 : 1,
      }
    })
  }, [data, metric, days, hoveredCity])

  const dates = useMemo(() => {
    const source = data[0]?.thisYear.slice(0, days) ?? []
    return source.map((d) => {
      const date = new Date(d.date)
      return `${date.getMonth() + 1}/${date.getDate()}`
    })
  }, [data, days])

  /**
   * 绝对温度视图的 Tooltip：显示今年/去年温度及差值
   */
  const absoluteTooltipFormatter = useCallback((params: any[]) => {
    const date = params[0]?.axisValue
    let html = `<div style="font-weight:600;margin-bottom:6px;color:#94a3b8">${date}</div>`
    const cityMap: Record<string, { thisYear?: number; lastYear?: number }> = {}
    params.forEach((p) => {
      const parts = p.seriesName.split(' ')
      const yearLabel = parts[parts.length - 1]
      const cityName = parts.slice(0, -1).join(' ')
      if (!cityMap[cityName]) cityMap[cityName] = {}
      if (yearLabel === '今年') cityMap[cityName].thisYear = p.value
      else cityMap[cityName].lastYear = p.value
    })
    Object.entries(cityMap).forEach(([city, vals]) => {
      const diff = vals.thisYear !== undefined && vals.lastYear !== undefined
        ? parseFloat((vals.thisYear - vals.lastYear).toFixed(1)) : null
      const diffStr = diff !== null
        ? `<span style="color:${diff > 0 ? '#f97316' : diff < 0 ? '#60a5fa' : '#94a3b8'}">(${diff > 0 ? '+' : ''}${diff}°)</span>`
        : ''
      html += `<div style="display:flex;justify-content:space-between;gap:12px;margin:2px 0">
        <span style="color:#cbd5e1">${city}</span>
        <span>${vals.thisYear ?? '-'}° / ${vals.lastYear ?? '-'}° ${diffStr}</span>
      </div>`
    })
    return html
  }, [])

  /**
   * 温差视图的 Tooltip：只展示差值和偏暖/偏冷标签
   */
  const diffTooltipFormatter = useCallback((params: any[]) => {
    const date = params[0]?.axisValue
    let html = `<div style="font-weight:600;margin-bottom:6px;color:#94a3b8">${date}</div>`
    params
      .filter((p) => p.value !== null && p.value !== undefined)
      .sort((a, b) => b.value - a.value)
      .forEach((p) => {
        const v = p.value as number
        const label = v > 0 ? `<span style="color:#f97316">偏暖</span>` : v < 0 ? `<span style="color:#60a5fa">偏冷</span>` : `<span style="color:#94a3b8">持平</span>`
        html += `<div style="display:flex;justify-content:space-between;gap:16px;margin:2px 0">
          <span style="color:#cbd5e1">${p.seriesName}</span>
          <span>${v > 0 ? '+' : ''}${v}° ${label}</span>
        </div>`
      })
    return html
  }, [])

  const option = useMemo(() => {
    const isDiff = viewMode === 'diff'
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15,23,42,0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0', fontSize: 12 },
        formatter: isDiff ? diffTooltipFormatter : absoluteTooltipFormatter,
      },
      legend: { show: false },
      grid: { left: 50, right: 20, top: isDiff ? 30 : 20, bottom: 40 },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        name: isDiff ? '温差°C' : '°C',
        nameTextStyle: { color: '#64748b', fontSize: 11 },
        axisLine: { show: false },
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          formatter: isDiff ? (v: number) => `${v > 0 ? '+' : ''}${v}°` : '{value}°',
        },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } },
        // NOTE: 温差视图固定 0 轴基准线，让正负区间一目了然
        ...(isDiff ? {
          markLine: {
            silent: true,
            symbol: 'none',
            data: [{ yAxis: 0 }],
            lineStyle: { color: 'rgba(255,255,255,0.2)', type: 'solid', width: 1 },
            label: { show: false },
          },
        } : {}),
      },
      series: isDiff ? diffSeries : absoluteSeries,
    }
  }, [viewMode, dates, absoluteSeries, diffSeries, absoluteTooltipFormatter, diffTooltipFormatter])

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white font-semibold text-base">气温走势对比</h2>
          <p className="text-gray-500 text-xs mt-0.5">
            {viewMode === 'absolute'
              ? '实线=今年 · 虚线=去年同期 · 悬停图例可高亮'
              : '今年 − 去年同期 · 正值=偏暖 · 负值=偏冷 · 悬停图例可高亮'}
          </p>
        </div>

        {/* 视图切换 Tab */}
        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 rounded-lg p-0.5 text-xs">
            <button
              id="chart-view-absolute"
              onClick={() => setViewMode('absolute')}
              className={`px-3 py-1 rounded-md transition-all ${
                viewMode === 'absolute'
                  ? 'bg-white/15 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              绝对温度
            </button>
            <button
              id="chart-view-diff"
              onClick={() => setViewMode('diff')}
              className={`px-3 py-1 rounded-md transition-all ${
                viewMode === 'diff'
                  ? 'bg-white/15 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              温差对比
            </button>
          </div>

          {/* 城市图例（支持 Hover 高亮） */}
          <div className="flex flex-wrap gap-3">
            {data.map((d) => (
              <div
                key={d.city.id}
                id={`legend-${d.city.id}`}
                className="flex items-center gap-1.5 cursor-pointer select-none"
                onMouseEnter={() => setHoveredCity(d.city.id)}
                onMouseLeave={() => setHoveredCity(null)}
                style={{ opacity: hoveredCity === null || hoveredCity === d.city.id ? 1 : 0.35 }}
              >
                <div
                  className="w-3 h-0.5 transition-all"
                  style={{
                    backgroundColor: cityColor(d.city.id),
                    height: hoveredCity === d.city.id ? '2px' : '1.5px',
                  }}
                />
                <span
                  className="text-xs transition-colors"
                  style={{ color: hoveredCity === d.city.id ? '#e2e8f0' : '#64748b' }}
                >
                  {d.city.name}
                  {d.isMock && <span className="text-yellow-500 ml-0.5">⚠️</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ReactECharts
        ref={(e) => { chartRef.current = e?.getEchartsInstance() ?? null }}
        option={option}
        notMerge={true}
        style={{ height: 320 }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  )
}
