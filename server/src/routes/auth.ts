import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, or } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { db, schema } from '../db/client'
import { verifyPassword } from '../lib/password'
import { setCookie, deleteCookie } from 'hono/cookie'
import { signToken, authMiddleware, SESSION_COOKIE, SESSION_MAX_AGE, type HonoEnv, type AuthUser } from '../lib/auth'
import { rateLimit } from '../lib/rateLimit'
import { env } from '../env'

// Login por "usuario": acepta el nombre de usuario (ej. "jerezn") o el correo.
const loginSchema = z.object({ usuario: z.string().trim().min(1), password: z.string().min(1) })

const r = new Hono<HonoEnv>()

// Anti fuerza bruta: 10 intentos por IP cada 15 min (default #11).
const loginLimiter = rateLimit({ windowMs: 15 * 60_000, max: 10, key: 'login' })

r.post('/login', loginLimiter, zValidator('json', loginSchema), async (c) => {
  const { usuario, password } = c.req.valid('json')
  const ident = usuario.toLowerCase()
  const rows = await db
    .select()
    .from(schema.users)
    .where(or(eq(schema.users.username, ident), eq(schema.users.email, ident)))
    .limit(1)
  const user = rows[0]
  if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return c.json({ error: 'credenciales_invalidas' }, 401)
  }
  if (!user.isActive) return c.json({ error: 'usuario_inactivo' }, 403)

  await db
    .update(schema.users)
    .set({ lastLoginAt: Math.floor(Date.now() / 1000) })
    .where(eq(schema.users.id, user.id))
  const authUser: AuthUser = { id: user.id, email: user.email, role: user.role, displayName: user.displayName }
  const token = await signToken(authUser)
  // Cookie de sesión HttpOnly (default #9): el JS no la lee → un XSS no roba la sesión.
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: env.COOKIE_SAMESITE,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
  await db
    .insert(schema.auditLog)
    .values({ id: randomUUID(), userId: user.id, action: 'login', entityType: 'user', entityId: user.id })
    .catch(() => {})
  // Se devuelve el token para compatibilidad (scripts/Bearer); el frontend NO lo guarda.
  return c.json({ token, user: authUser })
})

r.get('/me', authMiddleware, (c) => c.json({ user: c.get('user') }))
// Logout: borra la cookie de sesión.
r.post('/logout', (c) => {
  deleteCookie(c, SESSION_COOKIE, { path: '/' })
  return c.json({ ok: true })
})

export default r
