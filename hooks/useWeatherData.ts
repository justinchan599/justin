import { useState, useEffect } from 'react'
import { CityWeatherData } from '@/types/weather'
import { DEFAULT_CITIES, generateMockData } from '@/lib/mock-data'

const MOCK_DATA = generateMockData(30)

export function useWeatherData() {
  const [data, setData] = useState<CityWeatherData[]>([])
  const [loading, setLoading] = useState(true)
  const [usingMock, setUsingMock] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all(
      DEFAULT_CITIES.map((city) =>
        fetch(`/api/weather?locationId=${city.hefengId}&lat=${city.lat}&lon=${city.lon}&days=30`)
          .then((r) => r.json())
          .then((d) => ({
            city,
            thisYear: d.thisYear ?? [],
            lastYear: d.lastYear ?? [],
          }))
      )
    )
      .then((results) => {
        setData(results)
        setUsingMock(false)
      })
      .catch(() => {
        setData(MOCK_DATA)
        setUsingMock(true)
      })
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, usingMock }
}
