import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createIncidentSchema } from '../types'

// Rutas de incidentes. La entrada se valida con zod; la persistencia real llega
// cuando se cree la BD Turso (por ahora responden stubs).
const r = new Hono()

r.get('/', (c) => c.json({ items: [], note: 'stub — BD no creada aún' }))
r.get('/:id', (c) => c.json({ id: c.req.param('id'), note: 'stub' }))

r.post('/', zValidator('json', createIncidentSchema), (c) => {
  const incident = c.req.valid('json')
  return c.json(
    { ok: true, note: 'stub — entrada validada; falta persistir (BD al final)', incident },
    201,
  )
})

export default r
