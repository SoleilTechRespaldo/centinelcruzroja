import { Hono } from 'hono'

// Esqueleto de auth. La implementación real (Better Auth / JWT + hashing) va en
// la etapa backend, con la BD ya disponible.
const r = new Hono()

r.post('/login', (c) => c.json({ note: 'stub — auth real pendiente (Better Auth / JWT)' }))
r.post('/logout', (c) => c.json({ ok: true }))
r.get('/me', (c) => c.json({ user: null, note: 'stub' }))

export default r
