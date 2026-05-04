export interface City {
  id: string
  name: string
  lat: number
  lon: number
  hefengId: string   // 和风天气 Location ID
  group: '北温区' | '中温区' | '南温区'
  pinned?: boolean
}

export interface DayWeather {
  date: string // YYYY-MM-DD
  maxTemp: number
  minTemp: number
  avgTemp: number
}

export interface CityWeatherData {
  city: City
  thisYear: DayWeather[]
  lastYear: DayWeather[]
  isMock?: boolean
}

export interface TempDiff {
  date: string
  maxDiff: number
  minDiff: number
  avgDiff: number
  isAlert: boolean // |avgDiff| >= alertThreshold
}

export interface CityStats {
  city: City
  avgDiff: number      // 均温差平均值
  maxSingleDiff: number
  trend: 'warmer' | 'cooler' | 'normal'
  diffs: TempDiff[]
  isMock?: boolean
}

export type MetricType = 'max' | 'min' | 'avg'
export type TimeRange = 7 | 15 | 30

export interface DashboardState {
  selectedCities: string[]
  timeRange: TimeRange
  metric: MetricType
  alertThreshold: number
}
