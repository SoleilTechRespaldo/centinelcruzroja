import { and, desc, eq, isNull } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { db, schema } from '../db/client'
import type { CreateMarkerInput, MarkerType } from '../types'

// Afectaciones georreferenciadas (capa del mapa operativo): deslizamientos,
// socavones, cortes de agua/luz/redes, incendios, etc. Punto (lat/lng) + tipo,
// opcionalmente ligado a un incidente.

const { mapMarkers, incidents } = schema

export async function listMarkers(filter: { incidentId?: string; type?: MarkerType }) {
  const conds = [isNull(mapMarkers.deletedAt)]
  if (filter.incidentId) conds.push(eq(mapMarkers.incidentId, filter.incidentId))
  if (filter.type) conds.push(eq(mapMarkers.type, filter.type))
  const rows = await db
    .select({
      id: mapMarkers.id,
      type: mapMarkers.type,
      title: mapMarkers.title,
      description: mapMarkers.description,
      lat: mapMarkers.lat,
      lng: mapMarkers.lng,
      incidentId: mapMarkers.incidentId,
      incidentCode: incidents.code,
    })
    .from(mapMarkers)
    .leftJoin(incidents, eq(mapMarkers.incidentId, incidents.id))
    .where(and(...conds))
    .orderBy(desc(mapMarkers.createdAt))
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    description: r.description ?? null,
    lat: r.lat,
    lng: r.lng,
    incidentId: r.incidentId ?? null,
    incidentCode: r.incidentCode ?? null,
  }))
}

export async function createMarker(input: CreateMarkerInput, userId: string): Promise<{ id: string } | { error: string }> {
  if (input.incidentId) {
    const inc = await db.select({ id: incidents.id }).from(incidents).where(eq(incidents.id, input.incidentId)).limit(1)
    if (!inc[0]) return { error: 'incidente_no_encontrado' }
  }
  const id = randomUUID()
  await db.insert(mapMarkers).values({
    id,
    type: input.type,
    title: input.title,
    description: input.description ?? null,
    lat: input.lat,
    lng: input.lng,
    incidentId: input.incidentId ?? null,
    createdBy: userId,
  })
  return { id }
}

export async function deleteMarker(id: string, userId: string): Promise<{ id: string } | undefined> {
  const ex = await db.select({ id: mapMarkers.id, deletedAt: mapMarkers.deletedAt }).from(mapMarkers).where(eq(mapMarkers.id, id)).limit(1)
  if (!ex[0] || ex[0].deletedAt) return undefined
  await db
    .update(mapMarkers)
    .set({ deletedAt: Math.floor(Date.now() / 1000) })
    .where(eq(mapMarkers.id, id))
  await db
    .insert(schema.auditLog)
    .values({ id: randomUUID(), userId, action: 'marker.delete', entityType: 'map_marker', entityId: id })
    .catch(() => {})
  return { id }
}
