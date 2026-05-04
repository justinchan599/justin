import { NextRequest } from 'next/server'
import { z } from 'zod'
import { DEFAULT_CITIES } from '@/lib/mock-data'
import { getCityWeatherData } from '@/lib/weather-service'
import { ok, fail } from '@/lib/api-response'

const querySchema = z.object({
  locationId: z.string().default('101010100'),
  lat: z.coerce.number().min(-90).max(90).default(39.9042),
  lon: z.coerce.number().min(-180).max(180).default(116.4074),
  days: z.coerce.number().int().min(1).max(365).default(30),
})

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams))

  if (!parsed.success) {
    return fail(`Invalid parameters: ${JSON.stringify(parsed.error.format())}`, 400)
  }

  const { locationId, days } = parsed.data

  // 根据 locationId 匹配对应城市配置，找不到则用参数构造临时城市
  const city =
    DEFAULT_CITIES.find((c) => c.hefengId === locationId) ?? {
      id: 'unknown',
      name: 'Unknown',
      lat: parsed.data.lat,
      lon: parsed.data.lon,
      hefengId: locationId,
      group: '中温区' as const,
    }

  const result = await getCityWeatherData(city, days)

  return ok({
    thisYear: result.thisYear,
    lastYear: result.lastYear,
    isMock: result.isMock ?? false,
  })
}
