import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { env } from './env'
import type { HonoEnv } from './lib/auth'
import auth from './routes/auth'
import users from './routes/users'
import incidents from './routes/incidents'
import dashboard from './routes/dashboard'
import catalogs from './routes/catalogs'
import indicios from './routes/indicios'
import evidence from './routes/evidence'
import mapMarkers from './routes/map'
import { storageBackend } from './lib/storage'
import { aiProvider } from './lib/ai'

// App Hono. Middlewares transversales + manejo de errores. Autorización por rol
// en cada ruta (en el backend, porque SQLite no tiene RLS).
const app = new Hono<HonoEnv>()

app.use('*', logger())
app.use('*', secureHeaders())
app.use('*', cors({ origin: env.CORS_ORIGIN }))

app.get('/health', (c) =>
  c.json({
    ok: true,
    service: 'centinela-api',
    db: env.TURSO_DATABASE_URL.startsWith('file:') ? 'local (SQLite)' : 'turso',
    storage: storageBackend(),
    ai: aiProvider(),
    ts: new Date().toISOString(),
  }),
)

// API versionada.
const api = new Hono<HonoEnv>()
api.route('/auth', auth)
api.route('/users', users)
api.route('/incidents', incidents)
api.route('/dashboard', dashboard)
api.route('/catalogs', catalogs)
api.route('/indicios', indicios)
api.route('/evidence', evidence)
api.route('/markers', mapMarkers)
app.route('/api', api)

app.notFound((c) => c.json({ error: 'not_found', path: c.req.path }, 404))
app.onError((err, c) => {
  console.error('[api] error no controlado:', err)
  return c.json({ error: 'internal_error', message: err.message }, 500)
})

export default app
