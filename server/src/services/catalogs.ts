import { eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { db, schema } from '../db/client'

const { comunas, eventTypes, sourceOrgs } = schema
export type CatalogType = 'comunas' | 'tipos' | 'fuentes'

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Lectura: comunas / tipos de evento / fuentes oficiales (con su estado).
export async function getCatalogs() {
  const [cs, ts, fs] = await Promise.all([db.select().from(comunas), db.select().from(eventTypes), db.select().from(sourceOrgs)])
  return {
    comunas: cs.map((c) => ({ id: c.id, name: c.name, meta: c.province ?? '', isActive: c.isActive })),
    tipos: ts.map((t) => ({ id: t.id, name: t.name, meta: '', isActive: t.isActive })),
    fuentes: fs.map((f) => ({ id: f.id, name: f.name, meta: f.officialUrl ?? '', isActive: f.isActive })),
  }
}

// Alta (solo admin).
export async function addCatalogItem(type: CatalogType, name: string, meta: string): Promise<{ id: string }> {
  const id = randomUUID()
  if (type === 'comunas') {
    await db.insert(comunas).values({ id, name, province: meta || null, regionId: 'reg-valparaiso' })
  } else if (type === 'tipos') {
    await db.insert(eventTypes).values({ id, name, slug: `${slug(name)}-${id.slice(0, 4)}` })
  } else {
    await db.insert(sourceOrgs).values({ id, name, slug: `${slug(name)}-${id.slice(0, 4)}`, officialUrl: meta || null })
  }
  return { id }
}

// Activar / desactivar (solo admin).
export async function setCatalogActive(type: CatalogType, id: string, isActive: boolean): Promise<{ id: string }> {
  if (type === 'comunas') await db.update(comunas).set({ isActive }).where(eq(comunas.id, id))
  else if (type === 'tipos') await db.update(eventTypes).set({ isActive }).where(eq(eventTypes.id, id))
  else await db.update(sourceOrgs).set({ isActive }).where(eq(sourceOrgs.id, id))
  return { id }
}
