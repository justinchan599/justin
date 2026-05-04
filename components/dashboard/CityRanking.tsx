'use client'

import { CityStats } from '@/types/weather'

interface CityRankingProps {
  stats: CityStats[]
}

export function CityRanking({ stats }: CityRankingProps) {
  const sorted = [...stats].sort((a, b) => b.avgDiff - a.avgDiff)

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="mb-4">
        <h2 className="text-white font-semibold text-base">城市温差排行</h2>
        <p className="text-gray-500 text-xs mt-0.5">按均温差降序排列</p>
      </div>
      <div className="space-y-3">
        {sorted.map((stat, idx) => {
          const diff = stat.avgDiff
          const isWarm = diff > 0.5
          const isCool = diff < -0.5
          const barWidth = Math.min(100, (Math.abs(diff) / 5) * 100)

          return (
            <div key={stat.city.id} className="flex items-center gap-3">
              <span className="text-gray-600 text-sm w-5 text-right">{idx + 1}</span>
              <span className="text-gray-300 text-sm w-16 flex items-center gap-1">
                {stat.city.name}
                {stat.isMock && <span title="真实数据加载失败，当前为模拟数据" className="text-yellow-500 text-xs cursor-help">⚠️</span>}
              </span>
              <div className="flex-1 relative h-6 flex items-center">
                {/* Center baseline */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
                {/* Bar */}
                <div
                  className={`absolute h-4 rounded-full ${
                    isWarm ? 'bg-orange-500/70 left-1/2' : isCool ? 'bg-blue-500/70 right-1/2' : 'bg-gray-500/50 left-1/2'
                  }`}
                  style={{ width: `${barWidth / 2}%` }}
                />
              </div>
              <div
                className={`text-sm font-bold w-16 text-right ${
                  isWarm ? 'text-orange-400' : isCool ? 'text-blue-400' : 'text-gray-400'
                }`}
              >
                {diff > 0 ? '+' : ''}{diff}°C
              </div>
              <div className="w-14 text-right">
                {stat.trend === 'warmer' && <span className="text-xs text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded-full">偏暖</span>}
                {stat.trend === 'cooler' && <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full">偏冷</span>}
                {stat.trend === 'normal' && <span className="text-xs text-gray-500 bg-gray-500/20 px-2 py-0.5 rounded-full">持平</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
