'use client'

import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { CityWeatherData, MetricType } from '@/types/weather'
import { getMetricValue } from '@/lib/utils-weather'

interface LineChartProps {
  data: CityWeatherData[]
  metric: MetricType
  days: number
}

const CITY_COLOR_MAP: Record<string, string> = {
  beijing:   '#3b82f6', // 蓝
  shenyang:  '#8b5cf6', // 紫
  xian:      '#f59e0b', // 橙
  wuhan:     '#ef4444', // 红
  hangzhou:  '#06b6d4', // 青
  chengdu:   '#10b981', // 绿
  guangzhou: '#ec4899', // 粉
  nanning:   '#84cc16', // 黄绿
}

function cityColor(cityId: string): string {
  return CITY_COLOR_MAP[cityId] ?? '#94a3b8'
}

export function LineChart({ data, metric, days }: LineChartProps) {
  const option = useMemo(() => {
    if (!data.length) return {}

    const slicedData = data.map((d) => ({
      ...d,
      thisYear: d.thisYear.slice(0, days),
      lastYear: d.lastYear.slice(0, days),
    }))

    const dates = slicedData[0].thisYear.map((d) => {
      const date = new Date(d.date)
      return `${date.getMonth() + 1}/${date.getDate()}`
    })

    const metricLabel = metric === 'max' ? '最高温' : metric === 'min' ? '最低温' : '均温'

    const series = slicedData.flatMap((d) => {
      const color = cityColor(d.city.id)
      return [
        {
          name: `${d.city.name} 今年`,
          type: 'line',
          smooth: true,
          data: d.thisYear.map((day) => getMetricValue(day, metric)),
          lineStyle: { color, width: 2 },
          itemStyle: { color },
          symbol: 'circle',
          symbolSize: 4,
          showSymbol: false,
          emphasis: { showSymbol: true, symbolSize: 6 },
        },
        {
          name: `${d.city.name} 去年`,
          type: 'line',
          smooth: true,
          data: d.lastYear.map((day) => getMetricValue(day, metric)),
          lineStyle: { color, width: 1.5, type: 'dashed', opacity: 0.5 },
          itemStyle: { color, opacity: 0.5 },
          symbol: 'circle',
          symbolSize: 3,
          showSymbol: false,
          emphasis: { showSymbol: true, symbolSize: 5 },
        },
      ]
    })

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15,23,42,0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0', fontSize: 12 },
        formatter: (params: any[]) => {
          const date = params[0]?.axisValue
          let html = `<div style="font-weight:600;margin-bottom:6px;color:#94a3b8">${date}</div>`
          // Group by city
          const cityMap: Record<string, { thisYear?: number; lastYear?: number }> = {}
          params.forEach((p) => {
            const [city, year] = p.seriesName.split(' ')
            if (!cityMap[city]) cityMap[city] = {}
            if (year === '今年') cityMap[city].thisYear = p.value
            else cityMap[city].lastYear = p.value
          })
          Object.entries(cityMap).forEach(([city, vals]) => {
            const diff = vals.thisYear !== undefined && vals.lastYear !== undefined
              ? parseFloat((vals.thisYear - vals.lastYear).toFixed(1))
              : null
            const diffStr = diff !== null
              ? `<span style="color:${diff > 0 ? '#f97316' : diff < 0 ? '#60a5fa' : '#94a3b8'}">(${diff > 0 ? '+' : ''}${diff}°)</span>`
              : ''
            html += `<div style="display:flex;justify-content:space-between;gap:12px;margin:2px 0">
              <span style="color:#cbd5e1">${city}</span>
              <span>${vals.thisYear ?? '-'}° / ${vals.lastYear ?? '-'}° ${diffStr}</span>
            </div>`
          })
          return html
        },
      },
      legend: {
        show: false,
      },
      grid: {
        left: 50,
        right: 20,
        top: 20,
        bottom: 40,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        name: `°C`,
        nameTextStyle: { color: '#64748b', fontSize: 11 },
        axisLine: { show: false },
        axisLabel: { color: '#64748b', fontSize: 11, formatter: '{value}°' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } },
      },
      series,
    }
  }, [data, metric, days])

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white font-semibold text-base">气温走势对比</h2>
          <p className="text-gray-500 text-xs mt-0.5">实线=今年 · 虚线=去年同期</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {data.map((d) => (
            <div key={d.city.id} className="flex items-center gap-1.5">
              <div
                className="w-3 h-0.5"
                style={{ backgroundColor: cityColor(d.city.id) }}
              />
              <span className="text-gray-400 text-xs">{d.city.name}</span>
            </div>
          ))}
        </div>
      </div>
      <ReactECharts
        option={option}
        notMerge={true}
        style={{ height: 320 }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  )
}
