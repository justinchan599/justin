import { create } from 'zustand'
import { DashboardState, MetricType, TimeRange } from '@/types/weather'

/**
 * 看板全局状态与操作方法
 * NOTE: 使用 Zustand 而非 Context 的原因：需要在图表组件中精细订阅单一字段，
 * 避免父组件状态变化触发子组件不必要的重渲染
 */
interface DashboardStore extends DashboardState {
  setSelectedCities: (ids: string[]) => void
  /** 单个城市的切换（选中→取消，取消→选中） */
  toggleCity: (id: string) => void
  setTimeRange: (r: TimeRange) => void
  setMetric: (m: MetricType) => void
  setAlertThreshold: (v: number) => void
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  // NOTE: 默认选中全部城市，alertThreshold 设为 5°C 是业务方建议的合理预警边界
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
