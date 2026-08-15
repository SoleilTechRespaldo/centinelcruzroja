import { serve } from '@hono/node-server'
import app from './index'
import { env } from './env'

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`Centinela API en http://localhost:${info.port}`)
})
