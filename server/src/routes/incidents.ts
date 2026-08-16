import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import {
  createIncidentSchema,
  addEvidenceSchema,
  addReportSchema,
  updateIncidentSchema,
  addTimelineSchema,
  addSourceSchema,
} from '../types'
import { authMiddleware, requireRole, type HonoEnv } from '../lib/auth'
import {
  listSummaries,
  getDetail,
  createIncident,
  addEvidence,
  addReport,
  updateIncident,
  addTimelineEvent,
  addSource,
  addEvidenceFile,
  saveBieVersion,
  listBieVersions,
  approveBieVersion,
} from '../services/incidents'

const EDITORES = ['operator', 'coordinator', 'admin'] as const
import { buildBieDocx } from '../lib/bieDocx'
import { buildBiePdf, PdfUnavailableError } from '../lib/biePdf'

// Cualquier usuario autenticado puede LEER; crear/capturar requiere operator+.
const r = new Hono<HonoEnv>()
r.use('*', authMiddleware)

r.get('/', async (c) => c.json({ items: await listSummaries() }))

r.get('/:id', async (c) => {
  const inc = await getDetail(c.req.param('id'))
  if (!inc) return c.json({ error: 'no_encontrado' }, 404)
  return c.json(inc)
})

r.post('/', requireRole(...EDITORES), zValidator('json', createIncidentSchema), async (c) => {
  const created = await createIncident(c.req.valid('json'), c.get('user').id)
  return c.json(created, 201)
})

// Editar / cerrar incidente.
r.patch('/:id', requireRole(...EDITORES), zValidator('json', updateIncidentSchema), async (c) => {
  const res = await updateIncident(c.req.param('id'), c.req.valid('json'), c.get('user').id)
  if (!res) return c.json({ error: 'no_encontrado' }, 404)
  return c.json(res)
})

// Agregar hito a la cronología.
r.post('/:id/timeline', requireRole(...EDITORES), zValidator('json', addTimelineSchema), async (c) => {
  const res = await addTimelineEvent(c.req.param('id'), c.req.valid('json'), c.get('user').id)
  if (!res) return c.json({ error: 'no_encontrado' }, 404)
  return c.json(res, 201)
})

// Registrar una fuente.
r.post('/:id/source', requireRole(...EDITORES), zValidator('json', addSourceSchema), async (c) => {
  const res = await addSource(c.req.param('id'), c.req.valid('json'), c.get('user').id)
  if (!res) return c.json({ error: 'no_encontrado' }, 404)
  return c.json(res, 201)
})

// Capturar evidencia (con procedencia) para un incidente.
r.post('/:id/evidence', requireRole('operator', 'coordinator', 'admin'), zValidator('json', addEvidenceSchema), async (c) => {
  const res = await addEvidence(c.req.param('id'), c.req.valid('json'), c.get('user').id)
  if (!res) return c.json({ error: 'no_encontrado' }, 404)
  return c.json(res, 201)
})

// Subir evidencia con ARCHIVO real (multipart → almacenamiento local o R2).
const EVIDENCE_KINDS = ['image', 'pdf', 'screenshot', 'doc', 'link'] as const
r.post('/:id/evidence/upload', requireRole('operator', 'coordinator', 'admin'), async (c) => {
  const body = await c.req.parseBody()
  const file = body['file']
  if (!(file instanceof File)) return c.json({ error: 'archivo_requerido' }, 400)
  const caption = String(body['caption'] ?? '').trim()
  const source = String(body['source'] ?? '').trim()
  if (!caption || !source) return c.json({ error: 'datos_incompletos' }, 400)
  const kindRaw = String(body['kind'] ?? 'doc')
  const kind = (EVIDENCE_KINDS as readonly string[]).includes(kindRaw) ? (kindRaw as (typeof EVIDENCE_KINDS)[number]) : 'doc'
  const bytes = new Uint8Array(await file.arrayBuffer())
  const res = await addEvidenceFile(
    c.req.param('id'),
    { kind, caption, source, fileName: file.name || 'archivo', mimeType: file.type || 'application/octet-stream', bytes },
    c.get('user').id,
  )
  if (!res) return c.json({ error: 'no_encontrado' }, 404)
  return c.json(res, 201)
})

// Nuevo reporte de situación (historial).
r.post('/:id/report', requireRole('operator', 'coordinator', 'admin'), zValidator('json', addReportSchema), async (c) => {
  const res = await addReport(c.req.param('id'), c.req.valid('json'), c.get('user').id)
  if (!res) return c.json({ error: 'no_encontrado' }, 404)
  return c.json(res, 201)
})

// Versiones del BIE: listar, guardar borrador, aprobar (coordinador+).
r.get('/:id/bie/versions', async (c) => c.json({ items: await listBieVersions(c.req.param('id')) }))

r.post('/:id/bie/versions', requireRole(...EDITORES), zValidator('json', z.object({ data: z.any() })), async (c) => {
  const res = await saveBieVersion(c.req.param('id'), c.req.valid('json').data, c.get('user').id)
  if (!res) return c.json({ error: 'no_encontrado' }, 404)
  return c.json(res, 201)
})

r.post('/:id/bie/versions/:versionId/approve', requireRole('coordinator', 'admin'), async (c) => {
  const res = await approveBieVersion(c.req.param('versionId'), c.get('user').id)
  if (!res) return c.json({ error: 'no_encontrado' }, 404)
  return c.json(res)
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

// Generar el PDF del BIE (rellena el maestro y lo convierte con LibreOffice o Word).
r.post('/:id/bie/pdf', async (c) => {
  const draft = await c.req.json().catch(() => ({}))
  try {
    const buf = await buildBiePdf(draft)
    const nbie = (draft?.datos?.nbie ?? 'BIE').toString().replace(/[^\w-]/g, '')
    return new Response(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="BIE-N${nbie}.pdf"`,
      },
    })
  } catch (e) {
    if (e instanceof PdfUnavailableError) return c.json({ error: 'pdf_no_disponible', message: e.message }, 503)
    throw e
  }
})

export default r
