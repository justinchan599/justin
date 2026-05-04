'use client'

import { useMemo } from 'react'
import { computeCityStats } from '@/lib/utils-weather'
import { useDashboardStore } from '@/lib/store'
import { CityWeatherData } from '@/types/weather'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { KPICards } from '@/components/dashboard/KPICards'
import { LineChart } from '@/components/dashboard/LineChart'
import { DiffBarChart } from '@/components/dashboard/DiffBarChart'
import { HeatCalendar } from '@/components/dashboard/HeatCalendar'
import { CityRanking } from '@/components/dashboard/CityRanking'
import { InsightBanner } from '@/components/dashboard/InsightBanner'

interface DashboardClientProps {
  /** 服务端预取好的所有城市天气数据，用于首屏直接渲染 */
  initialData: CityWeatherData[]
}

/**
 * 看板客户端交互层
 * 负责用户筛选交互（城市切换、指标切换、时间范围）以及图表渲染
 * 初始数据由服务端组件预取后通过 props 传入，消除首屏白屏等待
 */
export function DashboardClient({ initialData }: DashboardClientProps) {
  // NOTE: 使用 Selector 按需订阅，避免 store 其他字段变化时触发无关的 Re-render
  const selectedCities = useDashboardStore((s) => s.selectedCities)
  const timeRange = useDashboardStore((s) => s.timeRange)
  const metric = useDashboardStore((s) => s.metric)
  const alertThreshold = useDashboardStore((s) => s.alertThreshold)

  // 是否有任意城市在使用 Mock 数据
  const usingMock = initialData.some((d) => d.isMock)

  const filteredData = useMemo(
    () => initialData.filter((d) => selectedCities.includes(d.city.id)),
    [initialData, selectedCities]
  )

  const stats = useMemo(
    () => computeCityStats(filteredData, metric, timeRange, alertThreshold),
    [filteredData, metric, timeRange, alertThreshold]
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <DashboardHeader />

      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        <KPICards stats={stats} />
        <InsightBanner stats={stats} metric={metric} days={timeRange} />
        <LineChart data={filteredData} metric={metric} days={timeRange} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <DiffBarChart stats={stats} metric={metric} days={timeRange} />
          </div>
          <div className="lg:col-span-1">
            <HeatCalendar stats={stats} metric={metric} />
          </div>
          <div className="lg:col-span-1">
            <CityRanking stats={stats} />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 pb-4">
          {usingMock ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block" />
              <span className="text-yellow-600 text-xs">部分城市 API 加载失败，已降级展示模拟数据</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              <span className="text-gray-600 text-xs">数据来源：和风天气预报 + Open-Meteo 历史归档</span>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
