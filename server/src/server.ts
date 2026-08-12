import { serve } from '@hono/node-server'
import app from './index'

const port = Number(process.env.PORT ?? 8787)

serve({ fetch: app.fetch, port }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`Centinela API en http://localhost:${info.port}`)
})
