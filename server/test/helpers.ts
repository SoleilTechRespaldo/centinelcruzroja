/* eslint-disable @typescript-eslint/no-explicit-any */
import app from '../src/index'

export interface ApiResult {
  status: number
  json: any
}

// Ejecuta una petición contra la app Hono en memoria (sin abrir puertos).
export async function apiReq(method: string, path: string, opts: { token?: string; body?: unknown } = {}): Promise<ApiResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`
  const res = await app.request(`/api${path}`, {
    method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  })
  const text = await res.text()
  let json: any = null
  if (text) {
    try {
      json = JSON.parse(text)
    } catch {
      json = text
    }
  }
  return { status: res.status, json }
}

export async function login(usuario: string, password = 'centinela1234'): Promise<string> {
  const { json } = await apiReq('POST', '/auth/login', { body: { usuario, password } })
  return json.token as string
}
