import { CityWeatherData, CityStats, TempDiff, MetricType } from '@/types/weather'

/**
 * 计算每个城市的统计聚合数据（温差、趋势、预警）
 *
 * @param data 过滤后的城市天气原始数据
 * @param metric 当前选中的指标类型：最高温 / 最低温 / 均温
 * @param days 时间范围（最多取前 N 天）
 * @param alertThreshold 触发预警的温差绝对值阈值，默认 5°C
 * @returns 每个城市对应的统计摘要数组
 *
 * NOTE: trend 判断阈值 ±0.5°C 是为了过滤掉数据浮动噪声，低于此值视为持平
 * NOTE: isAlert 使用 Math.abs 是因为偏冷和偏暖都需要预警，不区分方向
 */
export function computeCityStats(
  data: CityWeatherData[],
  metric: MetricType,
  days: number,
  alertThreshold: number = 5
): CityStats[] {
  return data.map(({ city, thisYear, lastYear, isMock }) => {
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

    return { city, avgDiff, maxSingleDiff, trend, diffs, isMock }
  })
}

/**
 * 根据当前指标类型取出对应日气温值
 * @param day 单天气温数据
 * @param metric 指标类型
 */
export function getMetricValue(
  day: { maxTemp: number; minTemp: number; avgTemp: number },
  metric: MetricType
): number {
  return metric === 'max' ? day.maxTemp : metric === 'min' ? day.minTemp : day.avgTemp
}
