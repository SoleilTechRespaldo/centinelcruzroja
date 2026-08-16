import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { createMarkerSchema, markerTypeSchema } from '../types'
import { authMiddleware, requireRole, type HonoEnv } from '../lib/auth'
import { listMarkers, createMarker, deleteMarker } from '../services/mapMarkers'

// Afectaciones del mapa. Leer: cualquier autenticado. Crear/borrar: operator+.
const EDITORES = ['operator', 'coordinator', 'admin'] as const

const listQuery = z.object({ incidentId: z.string().optional(), type: markerTypeSchema.optional() })

const r = new Hono<HonoEnv>()
r.use('*', authMiddleware)

r.get('/', zValidator('query', listQuery), async (c) => c.json({ items: await listMarkers(c.req.valid('query')) }))

r.post('/', requireRole(...EDITORES), zValidator('json', createMarkerSchema), async (c) => {
  const res = await createMarker(c.req.valid('json'), c.get('user').id)
  if ('error' in res) return c.json({ error: res.error }, 400)
  return c.json(res, 201)
})

r.delete('/:id', requireRole(...EDITORES), async (c) => {
  const res = await deleteMarker(c.req.param('id'), c.get('user').id)
  if (!res) return c.json({ error: 'no_encontrado' }, 404)
  return c.json(res)
})

export default r
