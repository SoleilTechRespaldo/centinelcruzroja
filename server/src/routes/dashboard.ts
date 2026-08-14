import { Hono } from 'hono'
import { authMiddleware, type HonoEnv } from '../lib/auth'
import { getDashboard } from '../services/incidents'

const r = new Hono<HonoEnv>()
r.use('*', authMiddleware)

r.get('/', async (c) => c.json(await getDashboard()))

export default r
