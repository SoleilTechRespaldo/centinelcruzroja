import type { MiddlewareHandler } from 'hono'

// Rate limiting en memoria (ventana fija por IP + clave). Suficiente para una sola
// instancia; en multi-instancia conviene un store compartido (Redis). Responde 429
// con Retry-After. Mitiga fuerza bruta en login y abuso general (default #11).
type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

export function rateLimit(opts: { windowMs: number; max: number; key?: string }): MiddlewareHandler {
  return async (c, next) => {
    if (process.env.NODE_ENV === 'test') return next() // no interferir con las pruebas
    const now = Date.now()
    const xff = c.req.header('x-forwarded-for')
    const ip = xff ? xff.split(',')[0].trim() : (c.req.header('x-real-ip') ?? 'local')
    const k = `${opts.key ?? 'g'}:${ip}`
    let b = buckets.get(k)
    if (!b || now > b.resetAt) {
      b = { count: 0, resetAt: now + opts.windowMs }
      buckets.set(k, b)
    }
    b.count++
    if (b.count > opts.max) {
      c.header('Retry-After', String(Math.ceil((b.resetAt - now) / 1000)))
      return c.json({ error: 'demasiadas_solicitudes' }, 429)
    }
    // Limpieza perezosa para que el mapa no crezca sin límite.
    if (buckets.size > 5000) for (const [key, v] of buckets) if (now > v.resetAt) buckets.delete(key)
    await next()
  }
}
