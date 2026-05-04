import { NextResponse } from 'next/server'

/**
 * 统一 API 响应格式
 * 遵循 { code, msg, data } 三段式结构，方便客户端统一处理
 */
export interface ApiResponse<T = unknown> {
  code: number
  msg: string
  data: T
}

/**
 * 返回标准成功响应
 * @param data 业务数据
 * @param msg 成功提示（默认 'ok'）
 */
export function ok<T>(data: T, msg = 'ok'): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ code: 0, msg, data })
}

/**
 * 返回标准失败响应
 * @param msg 错误描述（面向开发者，不含敏感信息）
 * @param status HTTP 状态码，默认 500
 */
export function fail(msg: string, status = 500): NextResponse<ApiResponse<null>> {
  return NextResponse.json({ code: status, msg, data: null }, { status })
}
