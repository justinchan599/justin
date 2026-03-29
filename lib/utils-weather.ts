import { CityWeatherData, CityStats, TempDiff, MetricType } from '@/types/weather'

export function computeCityStats(
  data: CityWeatherData[],
  metric: MetricType,
  days: number,
  alertThreshold: number = 5
): CityStats[] {
  return data.map(({ city, thisYear, lastYear }) => {
    const sliced = {
      thisYear: thisYear.slice(0, days),
      lastYear: lastYear.slice(0, days),
    }

    const diffs: TempDiff[] = sliced.thisYear.map((d, i) => {
      const ly = sliced.lastYear[i]
      const maxDiff = parseFloat((d.maxTemp - ly.maxTemp).toFixed(1))
      const minDiff = parseFloat((d.minTemp - ly.minTemp).toFixed(1))
      const avgDiff = parseFloat((d.avgTemp - ly.avgTemp).toFixed(1))
      return {
        date: d.date,
        maxDiff,
        minDiff,
        avgDiff,
        isAlert: Math.abs(avgDiff) >= alertThreshold,
      }
    })

    const getDiff = (d: TempDiff) =>
      metric === 'max' ? d.maxDiff : metric === 'min' ? d.minDiff : d.avgDiff

    const avgDiff =
      parseFloat((diffs.reduce((s, d) => s + getDiff(d), 0) / diffs.length).toFixed(1))

    const maxSingleDiff = Math.max(...diffs.map((d) => Math.abs(getDiff(d))))

    const trend = avgDiff > 0.5 ? 'warmer' : avgDiff < -0.5 ? 'cooler' : 'normal'

    return { city, avgDiff, maxSingleDiff, trend, diffs }
  })
}

export function getMetricValue(
  day: { maxTemp: number; minTemp: number; avgTemp: number },
  metric: MetricType
): number {
  return metric === 'max' ? day.maxTemp : metric === 'min' ? day.minTemp : day.avgTemp
}
