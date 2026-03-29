'use client'

import { useDashboardStore } from '@/lib/store'
import { DEFAULT_CITIES } from '@/lib/mock-data'
import { TimeRange, MetricType } from '@/types/weather'
import { Badge } from '@/components/ui/badge'

const TIME_OPTIONS: { label: string; value: TimeRange }[] = [
  { label: '7天', value: 7 },
  { label: '15天', value: 15 },
  { label: '30天', value: 30 },
]

const METRIC_OPTIONS: { label: string; value: MetricType }[] = [
  { label: '均温', value: 'avg' },
  { label: '最高', value: 'max' },
  { label: '最低', value: 'min' },
]

const GROUP_COLORS: Record<string, string> = {
  '北温区': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  '中温区': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  '南温区': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
}

export function DashboardHeader() {
  const { selectedCities, timeRange, metric, toggleCity, setTimeRange, setMetric } =
    useDashboardStore()

  return (
    <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-[1600px] mx-auto px-6 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Logo + Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">气温对比看板</h1>
              <p className="text-gray-400 text-xs">今年 vs 去年同期</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Metric Toggle */}
            <div className="flex bg-white/5 rounded-lg p-1 gap-1">
              {METRIC_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setMetric(opt.value)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    metric === opt.value
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Time Range Toggle */}
            <div className="flex bg-white/5 rounded-lg p-1 gap-1">
              {TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTimeRange(opt.value)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    timeRange === opt.value
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* City Filter */}
        <div className="mt-3 flex flex-wrap gap-2">
          {DEFAULT_CITIES.map((city) => {
            const active = selectedCities.includes(city.id)
            return (
              <button
                key={city.id}
                onClick={() => toggleCity(city.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  active
                    ? `${GROUP_COLORS[city.group]} border`
                    : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/20'
                }`}
              >
                {city.name}
                {city.pinned && active && (
                  <span className="ml-1 text-yellow-400">★</span>
                )}
              </button>
            )
          })}
          <span className="text-gray-600 text-xs self-center ml-1">
            已选 {selectedCities.length}/{DEFAULT_CITIES.length} 城市
          </span>
        </div>
      </div>
    </header>
  )
}
