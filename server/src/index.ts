import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { env } from './env'
import auth from './routes/auth'
import incidents from './routes/incidents'

// App Hono (esqueleto endurecido). Middlewares transversales + manejo de errores.
// El acceso a datos (Drizzle/Turso) se conecta cuando se cree la BD (etapa final).
const app = new Hono()

app.use('*', logger())
app.use('*', secureHeaders())
app.use('*', cors({ origin: env.CORS_ORIGIN }))

// Health check (fuera de /api, para monitoreo/uptime).
app.get('/health', (c) =>
  c.json({
    ok: true,
    service: 'centinela-api',
    db: env.TURSO_DATABASE_URL ? 'configurada' : 'no creada (etapa final)',
    ts: new Date().toISOString(),
  }),
)

// API versionada.
const api = new Hono()
api.route('/auth', auth)
api.route('/incidents', incidents)
app.route('/api', api)

app.notFound((c) => c.json({ error: 'not_found', path: c.req.path }, 404))

app.onError((err, c) => {
  console.error('[api] error no controlado:', err)
  return c.json({ error: 'internal_error', message: err.message }, 500)
})

export default app
