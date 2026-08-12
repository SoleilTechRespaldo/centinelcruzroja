import { Hono } from 'hono'

// Esqueleto de rutas de incidentes. Responden stubs hasta que la BD Turso se
// cree (etapa final) y se conecte el cliente Drizzle + la autorización por rol.
const r = new Hono()

r.get('/', (c) => c.json({ items: [], note: 'stub — BD no creada aún' }))
r.get('/:id', (c) => c.json({ id: c.req.param('id'), note: 'stub' }))
r.post('/', (c) => c.json({ ok: true, note: 'stub — crear incidente' }, 201))

export default r
