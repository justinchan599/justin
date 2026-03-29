'use client'

import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { CityStats, MetricType } from '@/types/weather'

interface HeatCalendarProps {
  stats: CityStats[]
  metric: MetricType
}

export function HeatCalendar({ stats, metric }: HeatCalendarProps) {
  const option = useMemo(() => {
    if (!stats.length) return {}

    // Show all selected cities as rows, last 30 days
    const allDiffs = stats.map((stat) => {
      const diffs = stat.diffs.slice(0, 30)
      return {
        city: stat.city.name,
        data: diffs.map((d) => ({
          date: d.date,
          value: metric === 'max' ? d.maxDiff : metric === 'min' ? d.minDiff : d.avgDiff,
          isAlert: d.isAlert,
        })),
      }
    })

    const dates = allDiffs[0]?.data.map((d) => {
      const date = new Date(d.date)
      return `${date.getMonth() + 1}/${date.getDate()}`
    }) ?? []

    // Build heatmap data: [cityIndex, dateIndex, value]
    const heatData: [number, number, number][] = []
    allDiffs.forEach((city, ci) => {
      city.data.forEach((d, di) => {
        heatData.push([di, ci, parseFloat(d.value.toFixed(1))])
      })
    })

    const maxAbs = Math.max(5, ...heatData.map((d) => Math.abs(d[2])))

    return {
      backgroundColor: 'transparent',
      tooltip: {
        formatter: (params: any) => {
          const city = allDiffs[params.value[1]]?.city
          const date = allDiffs[0]?.data[params.value[0]]?.date
          const val = params.value[2]
          return `<div style="color:#e2e8f0">
            <div style="color:#94a3b8">${date}</div>
            <div>${city}: <b style="color:${val > 0 ? '#f97316' : '#60a5fa'}">${val > 0 ? '+' : ''}${val}°C</b></div>
          </div>`
        },
        backgroundColor: 'rgba(15,23,42,0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
      },
      grid: { left: 60, right: 16, top: 16, bottom: 40 },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: { color: '#64748b', fontSize: 9, rotate: 30 },
        axisLine: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'category',
        data: allDiffs.map((d) => d.city),
        axisLabel: { color: '#94a3b8', fontSize: 12 },
        axisLine: { show: false },
        splitLine: { show: false },
      },
      visualMap: {
        min: -maxAbs,
        max: maxAbs,
        calculable: false,
        show: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        itemWidth: 10,
        itemHeight: 100,
        textStyle: { color: '#64748b', fontSize: 10 },
        inRange: {
          color: ['#1d4ed8', '#3b82f6', '#93c5fd', '#f1f5f9', '#fdba74', '#f97316', '#dc2626'],
        },
      },
      series: [
        {
          type: 'heatmap',
          data: heatData,
          label: {
            show: dates.length <= 15,
            color: '#fff',
            fontSize: 9,
            formatter: (p: any) => (p.value[2] > 0 ? `+${p.value[2]}` : `${p.value[2]}`),
          },
          emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } },
        },
      ],
    }
  }, [stats, metric])

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 h-full">
      <div className="mb-4">
        <h2 className="text-white font-semibold text-base">热力日历</h2>
        <p className="text-gray-500 text-xs mt-0.5">各城市每日温差热力图</p>
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
