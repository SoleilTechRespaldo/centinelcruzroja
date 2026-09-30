import { sign, verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'
import type { MiddlewareHandler } from 'hono'
import { env } from '../env'

// Nombre y duración de la cookie de sesión (HttpOnly). El token también se acepta
// por header Authorization: Bearer (compatibilidad con scripts/pruebas).
export const SESSION_COOKIE = 'centinela_session'
export const SESSION_MAX_AGE = 60 * 60 * 8 // 8 horas

export type Role = 'admin' | 'coordinator' | 'operator' | 'consulta'
export interface AuthUser {
  id: string
  email: string
  role: Role
  displayName: string
}

// Tipado de las variables del contexto Hono (c.set/c.get('user')).
export type HonoEnv = { Variables: { user: AuthUser } }

export function signToken(u: AuthUser): Promise<string> {
  return sign(
    { sub: u.id, email: u.email, role: u.role, name: u.displayName, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE },
    env.AUTH_SECRET,
    'HS256',
  )
}

// Exige un token válido; deja el usuario en c.get('user'). Lo toma de la cookie
// HttpOnly (preferido) o del header Authorization: Bearer.
export const authMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const header = c.req.header('Authorization') ?? ''
  const token = getCookie(c, SESSION_COOKIE) || (header.startsWith('Bearer ') ? header.slice(7) : '')
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
