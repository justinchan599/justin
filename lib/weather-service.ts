import { City, CityWeatherData, DayWeather } from '@/types/weather'
import { DEFAULT_CITIES, generateMockData } from '@/lib/mock-data'
import { subYears, addDays, format } from 'date-fns'

const OPEN_METEO_ARCHIVE = 'https://archive-api.open-meteo.com/v1/archive'

// NOTE: 使用懒加载方式生成 MOCK 数据，避免在模块初始化时产生不必要的计算
let _mockDataCache: CityWeatherData[] | null = null
function getMockData(): CityWeatherData[] {
  if (!_mockDataCache) {
    _mockDataCache = generateMockData(30)
  }
  return _mockDataCache
}

/**
 * 调用和风天气 API 获取今年预报数据（7 / 15 / 30 天）
 * @param locationId 和风天气 Location ID
 * @param days 查询天数
 */
async function fetchHeFengForecast(locationId: string, days: number): Promise<DayWeather[]> {
  const HEFENG_HOST = process.env.HEFENG_API_HOST
  const HEFENG_KEY = process.env.HEFENG_API_KEY

  if (!HEFENG_HOST || !HEFENG_KEY) {
    throw new Error(
      'Server configuration error: Missing HEFENG_API_KEY or HEFENG_API_HOST in environment variables.'
    )
  }

  const endpoint = days <= 7 ? '7d' : days <= 15 ? '15d' : '30d'
  const url = `https://${HEFENG_HOST}/v7/weather/${endpoint}?location=${locationId}&key=${HEFENG_KEY}&lang=zh&unit=m`
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`HeFeng ${endpoint} -> HTTP ${res.status}`)
  const data = await res.json()
  if (data.code !== '200' || !data.daily) throw new Error(`HeFeng code=${data.code}`)

  return data.daily.map((d: { fxDate: string; tempMax: string; tempMin: string }) => {
    const max = parseFloat(d.tempMax)
    const min = parseFloat(d.tempMin)
    return {
      date: d.fxDate,
      maxTemp: max,
      minTemp: min,
      avgTemp: parseFloat(((max + min) / 2).toFixed(1)),
    }
  })
}

/**
 * 调用 Open-Meteo 归档 API 获取去年同期历史气温
 * @param lat 纬度
 * @param lon 经度
 * @param startDate 开始日期 YYYY-MM-DD
 * @param endDate 结束日期 YYYY-MM-DD
 */
async function fetchArchive(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
): Promise<DayWeather[]> {
  const url = `${OPEN_METEO_ARCHIVE}?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean&timezone=Asia%2FShanghai`
  const res = await fetch(url, { next: { revalidate: 86400 } })
  if (!res.ok) throw new Error(`Open-Meteo archive -> HTTP ${res.status}`)
  const data = await res.json()
  if (!data.daily?.time) return []

  const { time, temperature_2m_max, temperature_2m_min, temperature_2m_mean } = data.daily
  return time.map((date: string, i: number) => ({
    date,
    maxTemp: parseFloat((temperature_2m_max[i] ?? 0).toFixed(1)),
    minTemp: parseFloat((temperature_2m_min[i] ?? 0).toFixed(1)),
    avgTemp: parseFloat((temperature_2m_mean[i] ?? 0).toFixed(1)),
  }))
}

/**
 * 将 Date 格式化为 YYYY-MM-DD 字符串
 * NOTE: 直接用 date-fns format 而非 toISOString().split('T')[0]，
 * 避免 UTC 时区偏移在 UTC+8 以东环境下导致日期提前一天的 Bug
 */
function fmt(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

/**
 * 获取单个城市的今年预报与去年同期归档数据
 * 若接口失败则使用 MOCK 数据并标记 isMock: true
 * @param city 城市配置对象
 * @param days 查询天数
 */
export async function getCityWeatherData(city: City, days: number = 30): Promise<CityWeatherData> {
  try {
    const thisYear = await fetchHeFengForecast(city.hefengId, days)

    // NOTE: 使用 date-fns subYears 而非 setFullYear(-1)，
    // subYears 会安全处理闰年边界（如 2024-02-29 → 2023-02-28），
    // 防止 JS Date 自动滚动导致去年日期比今年多出一天
    const today = new Date()
    const lyStart = subYears(today, 1)
    const lyEnd = addDays(lyStart, days - 1)

    const lastYear = await fetchArchive(city.lat, city.lon, fmt(lyStart), fmt(lyEnd))
    const len = Math.min(thisYear.length, lastYear.length)

    return {
      city,
      thisYear: thisYear.slice(0, len),
      lastYear: lastYear.slice(0, len),
    }
  } catch (err) {
    console.error(`[weather-service] Failed to fetch data for ${city.name}:`, err)
    const mockCityData = getMockData().find((m) => m.city.id === city.id)
    if (mockCityData) {
      return { ...mockCityData, isMock: true }
    }
    return { city, thisYear: [], lastYear: [], isMock: true }
  }
}

/**
 * 并发获取所有默认城市的天气数据（服务端使用）
 * 使用 allSettled 确保单城市失败不影响整体
 * @param days 查询天数
 */
export async function getAllCitiesWeatherData(days: number = 30): Promise<CityWeatherData[]> {
  const results = await Promise.allSettled(
    DEFAULT_CITIES.map((city) => getCityWeatherData(city, days))
  )

  return results.map((res, index) => {
    if (res.status === 'fulfilled') {
      return res.value
    }
    // NOTE: allSettled 理论上不会 reject（getCityWeatherData 内部已做兜底），此处为双重保险
    console.error(`[weather-service] Unexpected rejection for ${DEFAULT_CITIES[index].name}:`, res.reason)
    const mockCityData = generateMockData(days).find((m) => m.city.id === DEFAULT_CITIES[index].id)
    return mockCityData
      ? { ...mockCityData, isMock: true }
      : { city: DEFAULT_CITIES[index], thisYear: [], lastYear: [], isMock: true }
  })
}
