import { Hono } from 'hono'
import { cors } from 'hono/cors'
import auth from './routes/auth'
import incidents from './routes/incidents'

// App Hono (esqueleto). La autorización por rol y el acceso a datos (Drizzle/Turso)
// se conectan en la etapa backend; la BD Turso se crea al final.
const app = new Hono()

app.use('*', cors())

app.get('/health', (c) =>
  c.json({ ok: true, service: 'centinela-api', db: 'no creada (etapa final)' }),
)

app.route('/auth', auth)
app.route('/incidents', incidents)

export default app
