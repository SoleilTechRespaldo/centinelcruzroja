import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { createIndicioSchema, verifyIndicioSchema, discardIndicioSchema } from '../types'
import { authMiddleware, requireRole, type HonoEnv } from '../lib/auth'
import { listIndicios, getIndicio, createIndicio, verifyIndicio, discardIndicio } from '../services/indicios'
import { runEmailIngestionOnce } from '../lib/emailIngest'

// Bandeja de indicios. Leer: cualquier autenticado. Crear/verificar/descartar: operator+.
const EDITORES = ['operator', 'coordinator', 'admin'] as const

const listQuery = z.object({
  status: z.enum(['por_verificar', 'verificado', 'descartado']).optional(),
  incidentId: z.string().optional(),
  channel: z.enum(['correo', 'web', 'redes', 'manual']).optional(),
})

const r = new Hono<HonoEnv>()
r.use('*', authMiddleware)

r.get('/', zValidator('query', listQuery), async (c) => c.json({ items: await listIndicios(c.req.valid('query')) }))

// Sondear los buzones de correo ahora (RF-26). Solo admin.
r.post('/ingest/email', requireRole('admin'), async (c) => {
  const res = await runEmailIngestionOnce()
  if (res.mailboxes === 0) return c.json({ error: 'correo_no_configurado' }, 400)
  return c.json(res)
})

r.get('/:id', async (c) => {
  const ind = await getIndicio(c.req.param('id'))
  if (!ind) return c.json({ error: 'no_encontrado' }, 404)
  return c.json(ind)
})

r.post('/', requireRole(...EDITORES), zValidator('json', createIndicioSchema), async (c) => {
  const res = await createIndicio(c.req.valid('json'), c.get('user').id)
  return c.json(res, 201)
})

r.post('/:id/verify', requireRole(...EDITORES), zValidator('json', verifyIndicioSchema), async (c) => {
  const res = await verifyIndicio(c.req.param('id'), c.req.valid('json'), c.get('user').id)
  if (!res) return c.json({ error: 'no_encontrado' }, 404)
  if ('error' in res) return c.json({ error: res.error }, 400)
  return c.json(res)
})

r.post('/:id/discard', requireRole(...EDITORES), zValidator('json', discardIndicioSchema), async (c) => {
  const res = await discardIndicio(c.req.param('id'), c.req.valid('json'), c.get('user').id)
  if (!res) return c.json({ error: 'no_encontrado' }, 404)
  return c.json(res)
})

export default r
