import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, desc } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { db, schema } from '../db/client'
import { hashPassword } from '../lib/password'
import { authMiddleware, requireRole, type HonoEnv } from '../lib/auth'

const roleEnum = z.enum(['admin', 'coordinator', 'operator', 'consulta'])

const createSchema = z.object({
  displayName: z.string().trim().min(2),
  email: z.string().email(),
  role: roleEnum,
  password: z.string().min(8, 'La clave inicial debe tener al menos 8 caracteres'),
})

const updateSchema = z
  .object({ role: roleEnum.optional(), isActive: z.boolean().optional() })
  .refine((v) => v.role !== undefined || v.isActive !== undefined, 'Nada que actualizar')

type UserRow = typeof schema.users.$inferSelect
const publicUser = (u: UserRow) => ({
  id: u.id,
  email: u.email,
  displayName: u.displayName,
  role: u.role,
  isActive: u.isActive,
  lastLoginAt: u.lastLoginAt,
  createdAt: u.createdAt,
})

// Gestión de usuarios: SOLO admin (no hay auto-registro; el admin invita/gestiona).
const r = new Hono<HonoEnv>()
r.use('*', authMiddleware, requireRole('admin'))

r.get('/', async (c) => {
  const rows = await db.select().from(schema.users).orderBy(desc(schema.users.createdAt))
  return c.json({ items: rows.map(publicUser) })
})

// Agregar usuario por correo + rol + clave inicial (opción a).
r.post('/', zValidator('json', createSchema), async (c) => {
  const body = c.req.valid('json')
  const email = body.email.toLowerCase()
  const exists = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1)
  if (exists[0]) return c.json({ error: 'email_ya_registrado' }, 409)

  const id = randomUUID()
  const passwordHash = await hashPassword(body.password)
  await db.insert(schema.users).values({ id, email, displayName: body.displayName, role: body.role, passwordHash, isActive: true })

  const admin = c.get('user')
  await db.insert(schema.auditLog).values({ id: randomUUID(), userId: admin.id, action: 'user.create', entityType: 'user', entityId: id, details: { email, role: body.role } }).catch(() => {})
  const created = (await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1))[0]
  return c.json({ user: publicUser(created) }, 201)
})

// Cambiar rol y/o activar-desactivar. No sobre uno mismo (evita quedar sin admin).
r.patch('/:id', zValidator('json', updateSchema), async (c) => {
  const id = c.req.param('id')
  const admin = c.get('user')
  if (id === admin.id) return c.json({ error: 'no_puedes_cambiar_tu_propio_rol_o_estado' }, 400)
  const target = (await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1))[0]
  if (!target) return c.json({ error: 'no_encontrado' }, 404)

  const body = c.req.valid('json')
  const patch: Partial<typeof schema.users.$inferInsert> = { updatedAt: Math.floor(Date.now() / 1000) }
  if (body.role !== undefined) patch.role = body.role
  if (body.isActive !== undefined) patch.isActive = body.isActive
  await db.update(schema.users).set(patch).where(eq(schema.users.id, id))

  await db.insert(schema.auditLog).values({ id: randomUUID(), userId: admin.id, action: 'user.update', entityType: 'user', entityId: id, details: body }).catch(() => {})
  const updated = (await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1))[0]
  return c.json({ user: publicUser(updated) })
})

// Opción (a): el admin fija/resetea la clave inicial del usuario.
r.post('/:id/password', zValidator('json', z.object({ password: z.string().min(8) })), async (c) => {
  const id = c.req.param('id')
  const target = (await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.id, id)).limit(1))[0]
  if (!target) return c.json({ error: 'no_encontrado' }, 404)
  const passwordHash = await hashPassword(c.req.valid('json').password)
  await db.update(schema.users).set({ passwordHash, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(schema.users.id, id))
  return c.json({ ok: true })
})

export default r
