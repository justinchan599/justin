import { City, CityWeatherData, DayWeather } from '@/types/weather'
import { addDays, format, subYears } from 'date-fns'

export const DEFAULT_CITIES: City[] = [
  { id: 'beijing',   name: '北京', lat: 39.9042, lon: 116.4074, hefengId: '101010100', group: '北温区', pinned: true },
  { id: 'shenyang',  name: '沈阳', lat: 41.8057, lon: 123.4315, hefengId: '101070101', group: '北温区' },
  { id: 'xian',      name: '西安', lat: 34.3416, lon: 108.9398, hefengId: '101110101', group: '中温区' },
  { id: 'wuhan',     name: '武汉', lat: 30.5928, lon: 114.3055, hefengId: '101200101', group: '中温区' },
  { id: 'hangzhou',  name: '杭州', lat: 30.2741, lon: 120.1551, hefengId: '101210101', group: '中温区' },
  { id: 'chengdu',   name: '成都', lat: 30.5728, lon: 104.0668, hefengId: '101270101', group: '中温区' },
  { id: 'guangzhou', name: '广州', lat: 23.1291, lon: 113.2644, hefengId: '101280101', group: '南温区', pinned: true },
  { id: 'nanning',   name: '南宁', lat: 22.8170, lon: 108.3665, hefengId: '101300101', group: '南温区' },
]

// 城市基础气温（平均）和季节振幅配置
const CITY_TEMP_CONFIG: Record<string, { base: number; amplitude: number }> = {
  beijing:  { base: 12, amplitude: 22 },
  shenyang: { base: 8,  amplitude: 26 },
  xian:     { base: 14, amplitude: 18 },
  wuhan:    { base: 17, amplitude: 16 },
  hangzhou: { base: 18, amplitude: 14 },
  chengdu:  { base: 17, amplitude: 12 },
  guangzhou: { base: 23, amplitude: 10 },
  nanning:  { base: 24, amplitude: 9 },
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function generateDayTemp(
  cityId: string,
  date: Date,
  yearOffset: number = 0,
  seed: number = 0
): DayWeather {
  const config = CITY_TEMP_CONFIG[cityId] ?? { base: 15, amplitude: 15 }
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000)

  // 基于正弦曲线模拟季节性温度，1月最低，7月最高
  const seasonal = -Math.cos((2 * Math.PI * dayOfYear) / 365)
  const avgBase = config.base + config.amplitude * seasonal

  // 年间差异：今年比去年偏暖 1-3°C（模拟全球变暖趋势）
  const yearlyBias = yearOffset === 0 ? seededRandom(seed + 9999) * 3 - 0.5 : 0

  // 日随机扰动
  const noise = (seededRandom(seed + dayOfYear) - 0.5) * 6

  const avg = Math.round((avgBase + yearlyBias + noise) * 10) / 10
  const spread = 6 + seededRandom(seed + dayOfYear + 1) * 4
  const max = Math.round((avg + spread / 2) * 10) / 10
  const min = Math.round((avg - spread / 2) * 10) / 10

  return {
    date: format(date, 'yyyy-MM-dd'),
    maxTemp: max,
    minTemp: min,
    avgTemp: avg,
  }
}

export function generateMockData(days: number = 30): CityWeatherData[] {
  const today = new Date()

  return DEFAULT_CITIES.map((city, cityIdx) => {
    const thisYear: DayWeather[] = []
    const lastYear: DayWeather[] = []

    for (let i = 0; i < days; i++) {
      const date = addDays(today, i)           // 今天起往后 i 天（预报）
      const lastYearDate = subYears(date, 1)   // 去年同日（归档）
      const seed = cityIdx * 1000 + i

      thisYear.push(generateDayTemp(city.id, date, 0, seed))
      lastYear.push(generateDayTemp(city.id, lastYearDate, -1, seed + 500))
    }

    return { city, thisYear, lastYear }
  })
}
