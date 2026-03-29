import { create } from 'zustand'
import { DashboardState, MetricType, TimeRange } from '@/types/weather'

interface DashboardStore extends DashboardState {
  setSelectedCities: (ids: string[]) => void
  toggleCity: (id: string) => void
  setTimeRange: (r: TimeRange) => void
  setMetric: (m: MetricType) => void
  setAlertThreshold: (v: number) => void
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  selectedCities: ['beijing', 'shenyang', 'xian', 'hangzhou', 'chengdu', 'wuhan', 'guangzhou', 'nanning'],
  timeRange: 30,
  metric: 'avg',
  alertThreshold: 5,

  setSelectedCities: (ids) => set({ selectedCities: ids }),
  toggleCity: (id) =>
    set((s) => ({
      selectedCities: s.selectedCities.includes(id)
        ? s.selectedCities.filter((c) => c !== id)
        : [...s.selectedCities, id],
    })),
  setTimeRange: (timeRange) => set({ timeRange }),
  setMetric: (metric) => set({ metric }),
  setAlertThreshold: (alertThreshold) => set({ alertThreshold }),
}))
