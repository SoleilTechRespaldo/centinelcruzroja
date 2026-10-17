import { and, desc, eq, isNull } from 'drizzle-orm'
import { db, schema } from '../db/client'

const { incidents, eventTypes, incidentComunas, incidentReports, sources, evidence, timelineEvents, bieVersions, indicios, mapMarkers } =
  schema

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

// Cuenta por mes (timestamps en segundos unix) en los últimos `n` meses, con ceros.
function lastMonths(n: number, timestamps: (number | null)[]): { label: string; n: number }[] {
  const now = new Date()
  const buckets: { key: string; label: string; n: number }[] = []
  for (let k = n - 1; k >= 0; k--) {
    const d = new Date(now.getFullYear(), now.getMonth() - k, 1)
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MESES[d.getMonth()], n: 0 })
  }
  const idx = new Map(buckets.map((b, i) => [b.key, i]))
  for (const ts of timestamps) {
    if (!ts) continue
    const d = new Date(ts * 1000)
    const i = idx.get(`${d.getFullYear()}-${d.getMonth()}`)
    if (i !== undefined) buckets[i].n++
  }
  return buckets.map((b) => ({ label: b.label, n: b.n }))
}

// --- Histórico / "por monitoreo" (agregado REAL; reemplaza los datos de ejemplo) ---
export async function getHistorico() {
  const incs = await db
    .select({ startedAt: incidents.startedAt, status: incidents.status, eventType: eventTypes.name })
    .from(incidents)
    .leftJoin(eventTypes, eq(incidents.eventTypeId, eventTypes.id))
    .where(isNull(incidents.deletedAt))

  const tipoMap = new Map<string, number>()
  for (const i of incs) {
    const k = i.eventType ?? 'Sin tipo'
    tipoMap.set(k, (tipoMap.get(k) ?? 0) + 1)
  }
  const porTipo = [...tipoMap.entries()].map(([label, n]) => ({ label, n })).sort((a, b) => b.n - a.n)
  const porMes = lastMonths(
    6,
    incs.map((i) => i.startedAt),
  )

  const bies = await db
    .select({ createdAt: bieVersions.createdAt, status: bieVersions.status })
    .from(bieVersions)
    .where(isNull(bieVersions.deletedAt))
  const biePorMes = lastMonths(
    6,
    bies.map((b) => b.createdAt),
  )

  return {
    totals: {
      incidentes: incs.length,
      activos: incs.filter((i) => i.status === 'active').length,
      enMonitoreo: incs.filter((i) => i.status === 'monitoring').length,
      cerrados: incs.filter((i) => i.status === 'closed').length,
      bieGenerados: bies.length,
      bieAprobados: bies.filter((b) => b.status === 'approved').length,
    },
    porTipo,
    porMes,
    biePorMes,
  }
}

// --- Estadísticas de UN incidente ---
export async function getIncidentStats(id: string) {
  const inc = (
    await db
      .select({
        id: incidents.id,
        code: incidents.code,
        title: incidents.title,
        status: incidents.status,
        alertSenapred: incidents.alertSenapred,
        alertCruzRoja: incidents.alertCruzRoja,
        startedAt: incidents.startedAt,
        endedAt: incidents.endedAt,
        eventType: eventTypes.name,
      })
      .from(incidents)
      .leftJoin(eventTypes, eq(incidents.eventTypeId, eventTypes.id))
      .where(and(eq(incidents.id, id), isNull(incidents.deletedAt)))
      .limit(1)
  )[0]
  if (!inc) return undefined

  const comunasN = (await db.select({ x: incidentComunas.comunaId }).from(incidentComunas).where(eq(incidentComunas.incidentId, id))).length
  const fuentesN = (await db.select({ x: sources.id }).from(sources).where(eq(sources.incidentId, id))).length
  const evidenciasN = (
    await db
      .select({ x: evidence.id })
      .from(evidence)
      .where(and(eq(evidence.incidentId, id), isNull(evidence.deletedAt)))
  ).length
  const hitosN = (await db.select({ x: timelineEvents.id }).from(timelineEvents).where(eq(timelineEvents.incidentId, id))).length
  const marcadoresN = (
    await db
      .select({ x: mapMarkers.id })
      .from(mapMarkers)
      .where(and(eq(mapMarkers.incidentId, id), isNull(mapMarkers.deletedAt)))
  ).length

  const indRows = await db
    .select({ status: indicios.status })
    .from(indicios)
    .where(and(eq(indicios.incidentId, id), isNull(indicios.deletedAt)))
  const ind = {
    total: indRows.length,
    por_verificar: indRows.filter((r) => r.status === 'por_verificar').length,
    verificado: indRows.filter((r) => r.status === 'verificado').length,
    descartado: indRows.filter((r) => r.status === 'descartado').length,
  }

  const bieRows = await db
    .select({ status: bieVersions.status })
    .from(bieVersions)
    .where(and(eq(bieVersions.incidentId, id), isNull(bieVersions.deletedAt)))
  const bie = { versiones: bieRows.length, aprobados: bieRows.filter((r) => r.status === 'approved').length }

  const rep = (
    await db.select().from(incidentReports).where(eq(incidentReports.incidentId, id)).orderBy(desc(incidentReports.reportedAt)).limit(1)
  )[0]

  const endSec = inc.endedAt ?? Math.floor(Date.now() / 1000)
  const diasActivo = Math.max(1, Math.round((endSec - inc.startedAt) / 86400))

  return {
    id: inc.id,
    code: inc.code,
    title: inc.title,
    status: inc.status,
    eventType: inc.eventType ?? '—',
    alertSenapred: inc.alertSenapred,
    alertCruzRoja: inc.alertCruzRoja,
    diasActivo,
    comunas: comunasN,
    fuentes: fuentesN,
    evidencias: evidenciasN,
    hitos: hitosN,
    marcadores: marcadoresN,
    indicios: ind,
    bie,
    personasAfectadas: rep?.personasAfectadas != null ? rep.personasAfectadas.toLocaleString('es-CL') : 'En evaluación',
    voluntarios: rep?.voluntarios ?? 0,
  }
}
