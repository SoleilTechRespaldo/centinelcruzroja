import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { db, schema } from '../db/client'
import { fmtDateTime, fmtTimeline, fmtTime } from '../lib/format'
import type { CreateIncidentInput, AddEvidenceInput, AddReportInput, UpdateIncidentInput, AddTimelineInput, AddSourceInput } from '../types'

const {
  incidents, incidentComunas, comunas, eventTypes, incidentReports,
  sources, sourceOrgs, evidence, timelineEvents, auditLog,
} = schema

type Filial = { filial: string; n: number }

// --- Helpers ---
async function comunasByIncident(ids: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>()
  if (ids.length === 0) return map
  const rows = await db
    .select({ incidentId: incidentComunas.incidentId, name: comunas.name })
    .from(incidentComunas)
    .innerJoin(comunas, eq(incidentComunas.comunaId, comunas.id))
    .where(inArray(incidentComunas.incidentId, ids))
  for (const r of rows) {
    const arr = map.get(r.incidentId) ?? []
    arr.push(r.name)
    map.set(r.incidentId, arr)
  }
  return map
}

async function latestReport(incidentId: string) {
  const rows = await db
    .select()
    .from(incidentReports)
    .where(eq(incidentReports.incidentId, incidentId))
    .orderBy(desc(incidentReports.reportedAt))
    .limit(1)
  return rows[0]
}

// tono para el mapa de comunas por alerta (según SENAPRED)
function senapredTone(a: string): string {
  return a === 'red' ? 'red' : a === 'yellow' ? 'yellow' : a === 'atp' ? 'celeste' : 'green'
}

// --- Lista (resúmenes) ---
export async function listSummaries() {
  const rows = await db
    .select({
      id: incidents.id, code: incidents.code, title: incidents.title,
      status: incidents.status, alertSenapred: incidents.alertSenapred, alertCruzRoja: incidents.alertCruzRoja,
      startedAt: incidents.startedAt, eventType: eventTypes.name,
    })
    .from(incidents)
    .leftJoin(eventTypes, eq(incidents.eventTypeId, eventTypes.id))
    .where(isNull(incidents.deletedAt))
    .orderBy(desc(incidents.startedAt))
  const cmap = await comunasByIncident(rows.map((r) => r.id))
  return rows.map((r) => ({
    id: r.id, code: r.code, title: r.title, eventType: r.eventType ?? '—',
    status: r.status, alertSenapred: r.alertSenapred, alertCruzRoja: r.alertCruzRoja,
    comunas: cmap.get(r.id) ?? [], startedAt: fmtDateTime(r.startedAt),
  }))
}

// --- Detalle ---
export async function getDetail(id: string) {
  const rows = await db
    .select({
      id: incidents.id, code: incidents.code, title: incidents.title,
      status: incidents.status, alertSenapred: incidents.alertSenapred, alertCruzRoja: incidents.alertCruzRoja,
      startedAt: incidents.startedAt, description: incidents.description, eventType: eventTypes.name,
    })
    .from(incidents)
    .leftJoin(eventTypes, eq(incidents.eventTypeId, eventTypes.id))
    .where(and(eq(incidents.id, id), isNull(incidents.deletedAt)))
    .limit(1)
  const inc = rows[0]
  if (!inc) return undefined

  const cmap = await comunasByIncident([id])
  const rep = await latestReport(id)

  const tl = await db
    .select({ happenedAt: timelineEvents.happenedAt, description: timelineEvents.description, org: sourceOrgs.name })
    .from(timelineEvents)
    .leftJoin(sources, eq(timelineEvents.sourceId, sources.id))
    .leftJoin(sourceOrgs, eq(sources.sourceOrgId, sourceOrgs.id))
    .where(eq(timelineEvents.incidentId, id))
    .orderBy(asc(timelineEvents.happenedAt))

  const srcs = await db
    .select({ org: sourceOrgs.name, title: sources.title, capturedAt: sources.capturedAt })
    .from(sources)
    .leftJoin(sourceOrgs, eq(sources.sourceOrgId, sourceOrgs.id))
    .where(eq(sources.incidentId, id))
    .orderBy(desc(sources.capturedAt))

  const evs = await db
    .select()
    .from(evidence)
    .where(and(eq(evidence.incidentId, id), isNull(evidence.deletedAt)))
    .orderBy(desc(evidence.capturedAt))

  const vpf = (rep?.voluntariosPorFilial as Filial[] | null) ?? []

  return {
    id: inc.id, code: inc.code, title: inc.title, eventType: inc.eventType ?? '—',
    status: inc.status, alertSenapred: inc.alertSenapred, alertCruzRoja: inc.alertCruzRoja,
    comunas: cmap.get(id) ?? [], startedAt: fmtDateTime(inc.startedAt),
    description: inc.description ?? '',
    personasAfectadas: rep?.personasAfectadas != null ? rep.personasAfectadas.toLocaleString('es-CL') : 'En evaluación',
    voluntarios: rep?.voluntarios ?? 0,
    voluntariosPorFilial: vpf,
    timeline: tl.map((t) => ({ at: fmtTimeline(t.happenedAt), text: t.description, source: t.org ?? undefined })),
    evidence: evs.map((e) => ({ id: e.id, kind: e.kind, caption: e.caption ?? '', source: e.sourceText ?? '', at: fmtTime(e.capturedAt), url: e.url ?? undefined })),
    sources: srcs.map((s) => ({ org: s.org ?? '—', title: s.title ?? '', at: fmtTime(s.capturedAt) })),
  }
}

// --- Dashboard (agregado) ---
export async function getDashboard() {
  const summaries = await listSummaries()
  const active = summaries.filter((s) => s.status === 'active')

  const isRed = (s: (typeof active)[number]) => s.alertSenapred === 'red' || s.alertCruzRoja === 'red'
  const isYellow = (s: (typeof active)[number]) => s.alertSenapred === 'yellow' || s.alertCruzRoja === 'yellow'
  const redCount = active.filter(isRed).length
  const yellowCount = active.filter((s) => isYellow(s) && !isRed(s)).length

  const allComunas = new Set<string>()
  active.forEach((s) => s.comunas.forEach((c) => allComunas.add(c)))

  let personas = 0
  let voluntarios = 0
  const filiales = new Set<string>()
  for (const s of active) {
    const rep = await latestReport(s.id)
    if (rep?.personasAfectadas) personas += rep.personasAfectadas
    if (rep?.voluntarios) voluntarios += rep.voluntarios
    ;((rep?.voluntariosPorFilial as Filial[] | null) ?? []).forEach((f) => filiales.add(f.filial))
  }

  const toneRank: Record<string, number> = { red: 4, yellow: 3, celeste: 2, green: 1, gray: 0 }
  const comunaTone = new Map<string, string>()
  for (const s of active) {
    const tone = senapredTone(s.alertSenapred)
    for (const c of s.comunas) {
      const prev = comunaTone.get(c)
      if (!prev || toneRank[tone] > (toneRank[prev] ?? 0)) comunaTone.set(c, tone)
    }
  }

  return {
    updatedAgo: 'recién',
    metrics: [
      { label: 'Eventos activos', value: String(active.length) },
      { label: 'Alerta roja', value: String(redCount), color: 'var(--al-red)' },
      { label: 'Alerta amarilla', value: String(yellowCount), color: 'var(--al-yellow-t)' },
      { label: 'Comunas afectadas', value: String(allComunas.size) },
    ],
    metrics2: [
      { label: 'Personas afectadas', value: personas.toLocaleString('es-CL') },
      { label: 'Voluntarios desplegados', value: String(voluntarios) },
      { label: 'Filiales activadas', value: String(filiales.size) },
    ],
    activeIncidents: active,
    comunasByAlert: [...comunaTone.entries()].map(([name, tone]) => ({ name, tone })),
  }
}

// --- Crear incidente ---
function parseDate(s: string): number | null {
  const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/)
  if (!m) return null
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4]), Number(m[5]))
  const t = d.getTime()
  return Number.isNaN(t) ? null : Math.floor(t / 1000)
}

export async function createIncident(input: CreateIncidentInput, userId: string): Promise<{ id: string; code: string }> {
  const et = await db.select({ id: eventTypes.id }).from(eventTypes).where(eq(eventTypes.name, input.eventType)).limit(1)
  const all = await db.select({ code: incidents.code }).from(incidents)
  const maxSeq = all.reduce((m, row) => Math.max(m, Number(row.code.split('-')[1]) || 0), 0)
  const code = `2026-${String(maxSeq + 1).padStart(4, '0')}`
  const id = randomUUID()
  const startedAt = parseDate(input.startedAt) ?? Math.floor(Date.now() / 1000)

  await db.insert(incidents).values({
    id, code, title: input.title, eventTypeId: et[0]?.id,
    status: input.status, alertSenapred: input.alertSenapred, alertCruzRoja: input.alertCruzRoja,
    description: input.description ?? '', startedAt, createdBy: userId,
  })

  if (input.comunas.length) {
    const crows = await db.select({ id: comunas.id }).from(comunas).where(inArray(comunas.name, input.comunas))
    for (const cr of crows) {
      await db.insert(incidentComunas).values({ incidentId: id, comunaId: cr.id }).onConflictDoNothing()
    }
  }
  return { id, code }
}

// --- Editar incidente (parcial); "cerrar" = status closed (+ endedAt). ---
export async function updateIncident(id: string, input: UpdateIncidentInput, userId: string): Promise<{ id: string } | undefined> {
  const exists = await db.select({ id: incidents.id }).from(incidents).where(eq(incidents.id, id)).limit(1)
  if (!exists[0]) return undefined
  const nowSec = Math.floor(Date.now() / 1000)
  const patch: Partial<typeof incidents.$inferInsert> = { updatedAt: nowSec }
  if (input.title !== undefined) patch.title = input.title
  if (input.status !== undefined) {
    patch.status = input.status
    patch.endedAt = input.status === 'closed' ? nowSec : null
  }
  if (input.alertSenapred !== undefined) patch.alertSenapred = input.alertSenapred
  if (input.alertCruzRoja !== undefined) patch.alertCruzRoja = input.alertCruzRoja
  if (input.description !== undefined) patch.description = input.description
  if (input.eventType !== undefined) {
    const et = await db.select({ id: eventTypes.id }).from(eventTypes).where(eq(eventTypes.name, input.eventType)).limit(1)
    patch.eventTypeId = et[0]?.id ?? null
  }
  await db.update(incidents).set(patch).where(eq(incidents.id, id))

  if (input.comunas !== undefined) {
    await db.delete(incidentComunas).where(eq(incidentComunas.incidentId, id))
    if (input.comunas.length) {
      const crows = await db.select({ id: comunas.id }).from(comunas).where(inArray(comunas.name, input.comunas))
      for (const cr of crows) await db.insert(incidentComunas).values({ incidentId: id, comunaId: cr.id }).onConflictDoNothing()
    }
  }
  await db.insert(auditLog).values({ id: randomUUID(), userId, action: 'incident.update', entityType: 'incident', entityId: id, details: input }).catch(() => {})
  return { id }
}

// --- Agregar hito a la cronología (append-only). ---
export async function addTimelineEvent(id: string, input: AddTimelineInput, userId: string): Promise<{ id: string } | undefined> {
  const exists = await db.select({ id: incidents.id }).from(incidents).where(eq(incidents.id, id)).limit(1)
  if (!exists[0]) return undefined
  const eid = randomUUID()
  await db.insert(timelineEvents).values({
    id: eid, incidentId: id,
    happenedAt: parseDate(input.happenedAt) ?? Math.floor(Date.now() / 1000),
    entryType: input.entryType, description: input.description, createdBy: userId,
  })
  return { id: eid }
}

// --- Registrar una fuente (procedencia). ---
export async function addSource(id: string, input: AddSourceInput, userId: string): Promise<{ id: string } | undefined> {
  const exists = await db.select({ id: incidents.id }).from(incidents).where(eq(incidents.id, id)).limit(1)
  if (!exists[0]) return undefined
  const so = await db.select({ id: sourceOrgs.id }).from(sourceOrgs).where(eq(sourceOrgs.name, input.org)).limit(1)
  const sid = randomUUID()
  await db.insert(sources).values({ id: sid, incidentId: id, sourceOrgId: so[0]?.id ?? null, title: input.title, url: input.url, createdBy: userId })
  return { id: sid }
}

// --- Nuevo reporte de situación (append-only; arrastra el desglose por filial previo). ---
export async function addReport(incidentId: string, input: AddReportInput, userId: string): Promise<{ id: string } | undefined> {
  const exists = await db.select({ id: incidents.id }).from(incidents).where(eq(incidents.id, incidentId)).limit(1)
  if (!exists[0]) return undefined
  const prev = await latestReport(incidentId)
  const id = randomUUID()
  await db.insert(incidentReports).values({
    id,
    incidentId,
    personasAfectadas: input.personasAfectadas,
    voluntarios: input.voluntarios,
    voluntariosPorFilial: prev?.voluntariosPorFilial ?? null,
    reportedAt: Math.floor(Date.now() / 1000),
    createdBy: userId,
  })
  return { id }
}

// --- Agregar evidencia (con procedencia). El archivo real (R2) es etapa posterior. ---
export async function addEvidence(incidentId: string, input: AddEvidenceInput, userId: string): Promise<{ id: string } | undefined> {
  const exists = await db.select({ id: incidents.id }).from(incidents).where(eq(incidents.id, incidentId)).limit(1)
  if (!exists[0]) return undefined
  const id = randomUUID()
  const capturedAt = parseDate(input.at) ?? Math.floor(Date.now() / 1000)
  await db.insert(evidence).values({
    id, incidentId, kind: input.kind, caption: input.caption, sourceText: input.source,
    url: input.url, fileName: input.fileName, capturedAt, createdBy: userId,
  })
  return { id }
}
