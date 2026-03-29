'use client'

import { useMemo } from 'react'
import { computeCityStats } from '@/lib/utils-weather'
import { useDashboardStore } from '@/lib/store'
import { useWeatherData } from '@/hooks/useWeatherData'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { KPICards } from '@/components/dashboard/KPICards'
import { LineChart } from '@/components/dashboard/LineChart'
import { DiffBarChart } from '@/components/dashboard/DiffBarChart'
import { HeatCalendar } from '@/components/dashboard/HeatCalendar'
import { CityRanking } from '@/components/dashboard/CityRanking'
import { InsightBanner } from '@/components/dashboard/InsightBanner'

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/5 ${className}`} />
}

export default function DashboardPage() {
  const { selectedCities, timeRange, metric, alertThreshold } = useDashboardStore()
  const { data: allData, loading, usingMock } = useWeatherData()

  const filteredData = useMemo(
    () => allData.filter((d) => selectedCities.includes(d.city.id)),
    [allData, selectedCities]
  )

  const stats = useMemo(
    () => computeCityStats(filteredData, metric, timeRange, alertThreshold),
    [filteredData, metric, timeRange, alertThreshold]
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <DashboardHeader />

      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {loading ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
            </div>
            <Skeleton className="h-14" />
            <Skeleton className="h-96" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Skeleton className="h-72" />
              <Skeleton className="h-72" />
              <Skeleton className="h-72" />
            </div>
          </>
        ) : (
          <>
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
          </>
        )}

        <div className="flex items-center justify-center gap-2 pb-4">
          {usingMock ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block" />
              <span className="text-yellow-600 text-xs">API 加载失败，当前展示模拟数据</span>
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
