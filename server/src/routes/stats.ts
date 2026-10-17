import { Hono } from 'hono'
import { authMiddleware, type HonoEnv } from '../lib/auth'
import { getHistorico, getIncidentStats } from '../services/stats'

// Estadísticas: histórico/monitoreo (agregado) y por incidente. Lectura: autenticado.
const r = new Hono<HonoEnv>()
r.use('*', authMiddleware)

r.get('/historico', async (c) => c.json(await getHistorico()))

r.get('/incident/:id', async (c) => {
  const res = await getIncidentStats(c.req.param('id'))
  if (!res) return c.json({ error: 'no_encontrado' }, 404)
  return c.json(res)
})

export default r
