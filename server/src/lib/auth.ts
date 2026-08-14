import { sign, verify } from 'hono/jwt'
import type { MiddlewareHandler } from 'hono'
import { env } from '../env'

export type Role = 'admin' | 'coordinator' | 'operator' | 'consulta'
export interface AuthUser {
  id: string
  email: string
  role: Role
  displayName: string
}

// Tipado de las variables del contexto Hono (c.set/c.get('user')).
export type HonoEnv = { Variables: { user: AuthUser } }

const EXPIRES_IN = 60 * 60 * 8 // 8 horas

export function signToken(u: AuthUser): Promise<string> {
  return sign(
    { sub: u.id, email: u.email, role: u.role, name: u.displayName, exp: Math.floor(Date.now() / 1000) + EXPIRES_IN },
    env.AUTH_SECRET,
    'HS256',
  )
}

// Exige un token válido; deja el usuario en c.get('user').
export const authMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const header = c.req.header('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return c.json({ error: 'no_autenticado' }, 401)
  try {
    const p = await verify(token, env.AUTH_SECRET, 'HS256')
    c.set('user', { id: String(p.sub), email: String(p.email), role: p.role as Role, displayName: String(p.name) })
  } catch {
    return c.json({ error: 'token_invalido_o_expirado' }, 401)
  }
  await next()
}

// Exige uno de los roles indicados (autorización por rol, en el backend).
export function requireRole(...roles: Role[]): MiddlewareHandler<HonoEnv> {
  return async (c, next) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'no_autenticado' }, 401)
    if (!roles.includes(user.role)) return c.json({ error: 'sin_permiso', necesita: roles }, 403)
    await next()
  }
}
