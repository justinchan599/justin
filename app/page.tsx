import { getAllCitiesWeatherData } from '@/lib/weather-service'
import { DashboardClient } from '@/components/dashboard/DashboardClient'

/**
 * 看板首页 — 异步服务端组件 (Async Server Component)
 * 在服务端并发预取所有城市的天气数据，直接传给客户端组件渲染
 * 用户访问时不再出现白屏骨架屏，首屏即为完整内容
 */
export default async function DashboardPage() {
  // NOTE: 服务端直接调用 weather-service，绕过 HTTP 层，无需经过 /api/weather 路由
  // 失败城市自动降级为 Mock 并标记 isMock: true，客户端会展示对应警示标识
  const initialData = await getAllCitiesWeatherData(30)

  return <DashboardClient initialData={initialData} />
}
