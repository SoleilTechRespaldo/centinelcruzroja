import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware, requireRole, type HonoEnv } from '../lib/auth'
import { getCatalogs, addCatalogItem, setCatalogActive } from '../services/catalogs'

const typeParam = z.enum(['comunas', 'tipos', 'fuentes'])
const addSchema = z.object({ name: z.string().trim().min(2), meta: z.string().optional() })
const activeSchema = z.object({ isActive: z.boolean() })

const r = new Hono<HonoEnv>()
r.use('*', authMiddleware)

// Cualquier usuario autenticado lee los catálogos.
r.get('/', async (c) => c.json(await getCatalogs()))

// Alta y activar/desactivar: solo admin.
r.post('/:type', requireRole('admin'), zValidator('json', addSchema), async (c) => {
  const type = typeParam.safeParse(c.req.param('type'))
  if (!type.success) return c.json({ error: 'tipo_invalido' }, 400)
  const body = c.req.valid('json')
  return c.json(await addCatalogItem(type.data, body.name, body.meta ?? ''), 201)
})

r.patch('/:type/:id', requireRole('admin'), zValidator('json', activeSchema), async (c) => {
  const type = typeParam.safeParse(c.req.param('type'))
  if (!type.success) return c.json({ error: 'tipo_invalido' }, 400)
  return c.json(await setCatalogActive(type.data, c.req.param('id'), c.req.valid('json').isActive))
})

export default r
