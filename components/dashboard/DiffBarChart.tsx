'use client'

import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { CityStats, MetricType } from '@/types/weather'

interface DiffBarChartProps {
  stats: CityStats[]
  metric: MetricType
  days: number
}

export function DiffBarChart({ stats, metric, days }: DiffBarChartProps) {
  const option = useMemo(() => {
    if (!stats.length) return {}

    // Use first selected city or combine averages
    const primary = stats[0]
    const diffs = primary.diffs.slice(0, days)
    const dates = diffs.map((d) => {
      const date = new Date(d.date)
      return `${date.getMonth() + 1}/${date.getDate()}`
    })

    const values = diffs.map((d) => {
      const val = metric === 'max' ? d.maxDiff : metric === 'min' ? d.minDiff : d.avgDiff
      return parseFloat(val.toFixed(1))
    })

    const colors = values.map((v, i) => {
      if (diffs[i].isAlert) return v > 0 ? '#ef4444' : '#7c3aed'
      return v > 0 ? '#f97316' : '#3b82f6'
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
          const p = params[0]
          const isAlert = diffs[p.dataIndex]?.isAlert
          return `<div>
            <div style="color:#94a3b8">${p.axisValue}</div>
            <div style="margin-top:4px">${primary.city.name} 温差:
              <b style="color:${p.value > 0 ? '#f97316' : '#60a5fa'}">${p.value > 0 ? '+' : ''}${p.value}°C</b>
              ${isAlert ? ' <span style="color:#ef4444">⚠️ 预警</span>' : ''}
            </div>
          </div>`
        },
      },
      grid: { left: 50, right: 16, top: 24, bottom: 40 },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisLabel: { color: '#64748b', fontSize: 10, rotate: days > 15 ? 30 : 0 },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        name: '温差°C',
        nameTextStyle: { color: '#64748b', fontSize: 11 },
        axisLabel: { color: '#64748b', fontSize: 11, formatter: '{value}°' },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } },
        markLine: {
          silent: true,
          data: [{ yAxis: 0 }],
          lineStyle: { color: 'rgba(255,255,255,0.2)' },
          label: { show: false },
        },
      },
      series: [
        {
          type: 'bar',
          data: values.map((v, i) => ({ value: v, itemStyle: { color: colors[i], borderRadius: v >= 0 ? [4, 4, 0, 0] : [0, 0, 4, 4] } })),
          barMaxWidth: 20,
          markLine: {
            silent: true,
            symbol: 'none',
            data: [{ yAxis: 0 }],
            lineStyle: { color: 'rgba(255,255,255,0.15)', width: 1 },
            label: { show: false },
          },
        },
      ],
    }
  }, [stats, metric, days])

  const primary = stats[0]

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white font-semibold text-base">每日温差分布</h2>
          <p className="text-gray-500 text-xs mt-0.5">
            {primary?.city.name} · 橙=偏暖 蓝=偏冷 红=预警
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />偏暖</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />偏冷</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />预警</span>
        </div>
      </div>
      <ReactECharts
        option={option}
        notMerge={true}
        style={{ height: 240 }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  )
}
