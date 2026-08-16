import { serve } from '@hono/node-server'
import app from './index'
import { env } from './env'
import { startEmailIngestion } from './lib/emailIngest'
import { startWebIngestion } from './lib/webIngest'

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`Centinela API en http://localhost:${info.port}`)
  startEmailIngestion()
  startWebIngestion()
})
