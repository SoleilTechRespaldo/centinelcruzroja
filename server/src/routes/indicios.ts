import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { createIndicioSchema, verifyIndicioSchema, discardIndicioSchema } from '../types'
import { authMiddleware, requireRole, type HonoEnv } from '../lib/auth'
import {
  listIndicios,
  getIndicio,
  createIndicio,
  createIndicioWithFile,
  getIndicioFile,
  verifyIndicio,
  discardIndicio,
} from '../services/indicios'
import { runEmailIngestionOnce } from '../lib/emailIngest'
import { runWebIngestionOnce } from '../lib/webIngest'

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

// Sondear las webs oficiales ahora (RF-20). Solo admin.
r.post('/ingest/web', requireRole('admin'), async (c) => {
  const res = await runWebIngestionOnce()
  if (res.sources === 0) return c.json({ error: 'webs_no_configuradas' }, 400)
  return c.json(res)
})

r.get('/:id', async (c) => {
  const ind = await getIndicio(c.req.param('id'))
  if (!ind) return c.json({ error: 'no_encontrado' }, 404)
  return c.json(ind)
})

// Descargar el archivo adjunto de un indicio.
r.get('/:id/file', async (c) => {
  const f = await getIndicioFile(c.req.param('id'))
  if (!f) return c.json({ error: 'no_encontrado' }, 404)
  return new Response(new Uint8Array(f.bytes), {
    headers: {
      'Content-Type': f.mimeType,
      'Content-Disposition': `inline; filename="${f.fileName.replace(/"/g, '')}"`,
    },
  })
})

r.post('/', requireRole(...EDITORES), zValidator('json', createIndicioSchema), async (c) => {
  const res = await createIndicio(c.req.valid('json'), c.get('user').id)
  return c.json(res, 201)
})

// Captura con ARCHIVO (multipart): redes con captura de pantalla (RF-27).
r.post('/upload', requireRole(...EDITORES), async (c) => {
  const body = await c.req.parseBody()
  const title = String(body['title'] ?? '').trim()
  if (!title) return c.json({ error: 'datos_incompletos' }, 400)
  const channelRaw = String(body['channel'] ?? 'redes')
  const channel = channelRaw === 'manual' ? 'manual' : 'redes'
  const f = body['file']
  const file =
    f instanceof File
      ? { bytes: new Uint8Array(await f.arrayBuffer()), fileName: f.name || 'archivo', mimeType: f.type || 'application/octet-stream' }
      : null
  const val = (k: string) => String(body[k] ?? '').trim() || undefined
  const res = await createIndicioWithFile(
    {
      channel,
      title,
      content: val('content'),
      url: val('url'),
      sender: val('sender'),
      sourceOrg: val('sourceOrg'),
      incidentId: val('incidentId'),
    },
    file,
    c.get('user').id,
  )
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
