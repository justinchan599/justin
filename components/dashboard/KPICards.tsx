'use client'

import { CityStats } from '@/types/weather'

interface KPICardsProps {
  stats: CityStats[]
}

export function KPICards({ stats }: KPICardsProps) {
  if (!stats.length) return null

  const overallAvg = parseFloat(
    (stats.reduce((s, c) => s + c.avgDiff, 0) / stats.length).toFixed(1)
  )
  const warmestCity = [...stats].sort((a, b) => b.avgDiff - a.avgDiff)[0]
  const coolestCity = [...stats].sort((a, b) => a.avgDiff - b.avgDiff)[0]
  const alertCount = stats.reduce(
    (s, c) => s + c.diffs.filter((d) => d.isAlert).length,
    0
  )

  const cards = [
    {
      label: '综合均温差',
      value: `${overallAvg > 0 ? '+' : ''}${overallAvg}°C`,
      sub: overallAvg > 0 ? '整体偏暖' : overallAvg < 0 ? '整体偏冷' : '与去年持平',
      color: overallAvg > 0.5 ? 'from-orange-500/20 to-red-500/10 border-orange-500/30' :
             overallAvg < -0.5 ? 'from-blue-500/20 to-cyan-500/10 border-blue-500/30' :
             'from-gray-500/20 to-gray-500/10 border-gray-500/30',
      icon: overallAvg > 0.5 ? '🔥' : overallAvg < -0.5 ? '❄️' : '➖',
      valueColor: overallAvg > 0.5 ? 'text-orange-400' : overallAvg < -0.5 ? 'text-blue-400' : 'text-gray-300',
    },
    {
      label: '最偏暖城市',
      value: warmestCity.city.name,
      isMock: warmestCity.isMock,
      sub: `均温高 +${warmestCity.avgDiff}°C`,
      color: 'from-orange-500/20 to-amber-500/10 border-orange-500/30',
      icon: '🌡️',
      valueColor: 'text-orange-400',
    },
    {
      label: '最偏冷城市',
      value: coolestCity.city.name,
      isMock: coolestCity.isMock,
      sub: `均温低 ${coolestCity.avgDiff}°C`,
      color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30',
      icon: '🧊',
      valueColor: 'text-cyan-400',
    },
    {
      label: '预警日次数',
      value: alertCount.toString(),
      sub: '温差≥5°C 的天数',
      color: alertCount > 0
        ? 'from-red-500/20 to-rose-500/10 border-red-500/30'
        : 'from-green-500/20 to-emerald-500/10 border-green-500/30',
      icon: alertCount > 0 ? '⚠️' : '✅',
      valueColor: alertCount > 0 ? 'text-red-400' : 'text-green-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-gradient-to-br ${card.color} border rounded-2xl p-5 backdrop-blur-sm`}
        >
          <div className="flex items-start justify-between mb-3">
            <span className="text-gray-400 text-sm">{card.label}</span>
            <span className="text-xl">{card.icon}</span>
          </div>
          <div className={`text-3xl font-bold ${card.valueColor} mb-1 flex items-center gap-2`}>
            {card.value}
            {card.isMock && <span title="真实数据加载失败，当前为模拟数据" className="text-yellow-500 text-sm cursor-help">⚠️</span>}
          </div>
          <div className="text-gray-500 text-xs">{card.sub}</div>
        </div>
      ))}
    </div>
  )
}
