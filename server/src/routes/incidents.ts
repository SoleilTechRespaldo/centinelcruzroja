import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createIncidentSchema, addEvidenceSchema } from '../types'
import { authMiddleware, requireRole, type HonoEnv } from '../lib/auth'
import { listSummaries, getDetail, createIncident, addEvidence } from '../services/incidents'
import { buildBieDocx } from '../lib/bieDocx'

// Cualquier usuario autenticado puede LEER; crear/capturar requiere operator+.
const r = new Hono<HonoEnv>()
r.use('*', authMiddleware)

r.get('/', async (c) => c.json({ items: await listSummaries() }))

r.get('/:id', async (c) => {
  const inc = await getDetail(c.req.param('id'))
  if (!inc) return c.json({ error: 'no_encontrado' }, 404)
  return c.json(inc)
})

r.post('/', requireRole('operator', 'coordinator', 'admin'), zValidator('json', createIncidentSchema), async (c) => {
  const created = await createIncident(c.req.valid('json'), c.get('user').id)
  return c.json(created, 201)
})

// Capturar evidencia (con procedencia) para un incidente.
r.post('/:id/evidence', requireRole('operator', 'coordinator', 'admin'), zValidator('json', addEvidenceSchema), async (c) => {
  const res = await addEvidence(c.req.param('id'), c.req.valid('json'), c.get('user').id)
  if (!res) return c.json({ error: 'no_encontrado' }, 404)
  return c.json(res, 201)
})

// Generar el .docx del BIE desde los datos del borrador (los del formulario).
r.post('/:id/bie/docx', async (c) => {
  const draft = await c.req.json().catch(() => ({}))
  const buf = await buildBieDocx(draft)
  const nbie = (draft?.datos?.nbie ?? 'BIE').toString().replace(/[^\w-]/g, '')
  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="BIE-N${nbie}.docx"`,
    },
  })
})

export default r
