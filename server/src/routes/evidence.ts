import { Hono } from 'hono'
import { authMiddleware, type HonoEnv } from '../lib/auth'
import { getEvidenceFile } from '../services/incidents'

// Descarga del archivo de una evidencia (cualquier usuario autenticado).
const r = new Hono<HonoEnv>()
r.use('*', authMiddleware)

r.get('/:id/file', async (c) => {
  const f = await getEvidenceFile(c.req.param('id'))
  if (!f) return c.json({ error: 'no_encontrado' }, 404)
  return new Response(new Uint8Array(f.bytes), {
    headers: {
      'Content-Type': f.mimeType,
      'Content-Disposition': `attachment; filename="${f.fileName.replace(/"/g, '')}"`,
    },
  })
})

export default r
