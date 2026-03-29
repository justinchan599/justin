import { NextRequest, NextResponse } from 'next/server'
import { DayWeather } from '@/types/weather'

const HEFENG_HOST = process.env.HEFENG_API_HOST ?? 'k94ky4m335.re.qweatherapi.com'
const HEFENG_KEY  = process.env.HEFENG_API_KEY  ?? '2e9237a68fee4a24b47ba7ae0ffd1dbf'
const OPEN_METEO_ARCHIVE = 'https://archive-api.open-meteo.com/v1/archive'

// 和风天气：今年预报（7 / 15 / 30 天）
async function fetchHeFengForecast(locationId: string, days: number): Promise<DayWeather[]> {
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

// Open-Meteo：去年同期归档
async function fetchArchive(lat: number, lon: number, startDate: string, endDate: string): Promise<DayWeather[]> {
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

function fmt(d: Date): string {
  return d.toISOString().split('T')[0]
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const locationId = searchParams.get('locationId') ?? '101010100'
  const lat  = parseFloat(searchParams.get('lat')  ?? '39.9042')
  const lon  = parseFloat(searchParams.get('lon')  ?? '116.4074')
  const days = parseInt(searchParams.get('days')   ?? '30', 10)

  try {
    // 今年：和风天气预报
    const thisYear = await fetchHeFengForecast(locationId, days)

    // 去年同期：以今天为基准，取去年同段的归档数据
    const today = new Date()
    const lyStart = new Date(today)
    lyStart.setFullYear(lyStart.getFullYear() - 1)
    const lyEnd = new Date(lyStart)
    lyEnd.setDate(lyEnd.getDate() + days - 1)

    const lastYear = await fetchArchive(lat, lon, fmt(lyStart), fmt(lyEnd))

    const len = Math.min(thisYear.length, lastYear.length)
    return NextResponse.json({
      thisYear: thisYear.slice(0, len),
      lastYear: lastYear.slice(0, len),
    })
  } catch (e) {
    console.error('Weather API error:', e)
    return NextResponse.json({ error: String(e) }, { status: 502 })
  }
}
