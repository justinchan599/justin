'use client'

import { CityStats, MetricType } from '@/types/weather'

interface InsightBannerProps {
  stats: CityStats[]
  metric: MetricType
  days: number
}

export function InsightBanner({ stats, metric, days }: InsightBannerProps) {
  if (!stats.length) return null

  const metricLabel = metric === 'max' ? '最高温' : metric === 'min' ? '最低温' : '均温'
  const overallAvg = parseFloat(
    (stats.reduce((s, c) => s + c.avgDiff, 0) / stats.length).toFixed(1)
  )
  const warmCount = stats.filter((s) => s.trend === 'warmer').length
  const coolCount = stats.filter((s) => s.trend === 'cooler').length
  const alertDays = stats.reduce((s, c) => s + c.diffs.filter((d) => d.isAlert).length, 0)
  const warmestCity = [...stats].sort((a, b) => b.avgDiff - a.avgDiff)[0]

  let insight = ''
  if (overallAvg > 2) {
    insight = `过去${days}天整体气温显著偏暖，${metricLabel}平均高出去年同期 +${overallAvg}°C，其中${warmestCity.city.name}升温最为明显（+${warmestCity.avgDiff}°C）。建议关注夏季商品提前备货及降温类促销活动。`
  } else if (overallAvg < -2) {
    insight = `过去${days}天整体气温偏低，${metricLabel}平均低于去年同期 ${overallAvg}°C。建议关注御寒类商品备货，适时推进冬季促销。`
  } else if (warmCount > coolCount) {
    insight = `各城市整体轻微偏暖，${warmCount}个城市均温高于去年，整体${metricLabel}差 ${overallAvg > 0 ? '+' : ''}${overallAvg}°C，气候波动较小，经营环境相对稳定。`
  } else if (coolCount > warmCount) {
    insight = `各城市整体轻微偏冷，${coolCount}个城市均温低于去年，整体${metricLabel}差 ${overallAvg}°C，建议关注区域性气候差异对销售结构的影响。`
  } else {
    insight = `过去${days}天各城市气温与去年同期基本持平，整体${metricLabel}差仅 ${overallAvg > 0 ? '+' : ''}${overallAvg}°C，气候因素对业务影响较小。`
  }

  if (alertDays > 0) {
    insight += ` 共有 ${alertDays} 个城市-日温差超过预警阈值，需重点关注。`
  }

  return (
    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3 items-start">
      <div className="text-blue-400 mt-0.5">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <div className="text-blue-300 text-sm font-semibold mb-1">数据洞察</div>
        <p className="text-gray-300 text-sm leading-relaxed">{insight}</p>
      </div>
    </div>
  )
}
