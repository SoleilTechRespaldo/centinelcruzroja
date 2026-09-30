import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { db, schema } from '../db/client'
import { verifyPassword } from '../lib/password'
import { signToken, authMiddleware, type HonoEnv, type AuthUser } from '../lib/auth'
import { rateLimit } from '../lib/rateLimit'

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) })

const r = new Hono<HonoEnv>()

// Anti fuerza bruta: 10 intentos por IP cada 15 min (default #11).
const loginLimiter = rateLimit({ windowMs: 15 * 60_000, max: 10, key: 'login' })

r.post('/login', loginLimiter, zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json')
  const rows = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase())).limit(1)
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
  await db
    .insert(schema.auditLog)
    .values({ id: randomUUID(), userId: user.id, action: 'login', entityType: 'user', entityId: user.id })
    .catch(() => {})
  return c.json({ token, user: authUser })
})

r.get('/me', authMiddleware, (c) => c.json({ user: c.get('user') }))
// JWT sin estado: el "logout" lo hace el cliente descartando el token.
r.post('/logout', (c) => c.json({ ok: true }))

export default r
