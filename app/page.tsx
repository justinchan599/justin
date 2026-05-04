import { getAllCitiesWeatherData } from '@/lib/weather-service'
import { DashboardClient } from '@/components/dashboard/DashboardClient'

// NOTE: 强制动态渲染。这可以确保 Next.js 不会在构建阶段尝试抓取天气数据（因为构建环境没有 API Key），
// 而是等到用户访问时（运行时）再抓取，此时腾讯云配置的环境变量才会生效。
export const dynamic = 'force-dynamic'

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
