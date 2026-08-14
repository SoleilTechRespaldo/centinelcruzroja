import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createIncidentSchema } from '../types'
import { authMiddleware, requireRole, type HonoEnv } from '../lib/auth'
import { listSummaries, getDetail, createIncident } from '../services/incidents'

// Cualquier usuario autenticado puede LEER; crear requiere operator/coordinator/admin.
const r = new Hono<HonoEnv>()
r.use('*', authMiddleware)

r.get('/', async (c) => c.json({ items: await listSummaries() }))

r.get('/:id', async (c) => {
  const inc = await getDetail(c.req.param('id'))
  if (!inc) return c.json({ error: 'no_encontrado' }, 404)
  return c.json(inc)
})

r.post('/', requireRole('operator', 'coordinator', 'admin'), zValidator('json', createIncidentSchema), async (c) => {
  const body = c.req.valid('json')
  const user = c.get('user')
  const created = await createIncident(body, user.id)
  return c.json(created, 201)
})

export default r
