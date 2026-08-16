import { and, desc, eq, isNull } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { db, schema } from '../db/client'
import { fmtDateTime } from '../lib/format'
import type { CreateIndicioInput, VerifyIndicioInput, DiscardIndicioInput } from '../types'

// Bandeja de indicios: material que llega por correo/web/redes/manual y espera
// revisión humana. Nada entra al BIE sin visto bueno; al verificar con un
// incidente se puede "promover" a fuente (procedencia) de ese incidente.

const { indicios, incidents, sources, sourceOrgs, users, auditLog } = schema

type Channel = 'correo' | 'web' | 'redes' | 'manual'
type Status = 'por_verificar' | 'verificado' | 'descartado'

const nowSec = () => Math.floor(Date.now() / 1000)
const parseDate = (s?: string): number | null => {
  if (!s) return null
  const t = Date.parse(s)
  return Number.isNaN(t) ? null : Math.floor(t / 1000)
}

async function resolveOrgId(name?: string): Promise<string | null> {
  if (!name) return null
  const rows = await db.select({ id: sourceOrgs.id }).from(sourceOrgs).where(eq(sourceOrgs.name, name)).limit(1)
  return rows[0]?.id ?? null
}

export async function listIndicios(filter: { status?: Status; incidentId?: string; channel?: Channel }) {
  const conds = [isNull(indicios.deletedAt)]
  if (filter.status) conds.push(eq(indicios.status, filter.status))
  if (filter.incidentId) conds.push(eq(indicios.incidentId, filter.incidentId))
  if (filter.channel) conds.push(eq(indicios.channel, filter.channel))
  const rows = await db
    .select({
      id: indicios.id,
      channel: indicios.channel,
      status: indicios.status,
      title: indicios.title,
      summary: indicios.summary,
      url: indicios.url,
      sender: indicios.sender,
      isOfficial: indicios.isOfficial,
      incidentId: indicios.incidentId,
      receivedAt: indicios.receivedAt,
      reviewedAt: indicios.reviewedAt,
      reviewNote: indicios.reviewNote,
      orgName: sourceOrgs.name,
      incidentCode: incidents.code,
      incidentTitle: incidents.title,
      reviewer: users.displayName,
    })
    .from(indicios)
    .leftJoin(sourceOrgs, eq(indicios.sourceOrgId, sourceOrgs.id))
    .leftJoin(incidents, eq(indicios.incidentId, incidents.id))
    .leftJoin(users, eq(indicios.reviewedBy, users.id))
    .where(and(...conds))
    .orderBy(desc(indicios.receivedAt))
  return rows.map((r) => ({
    id: r.id,
    channel: r.channel,
    status: r.status,
    title: r.title,
    summary: r.summary ?? null,
    url: r.url ?? null,
    sender: r.sender ?? null,
    isOfficial: r.isOfficial,
    incidentId: r.incidentId ?? null,
    incidentCode: r.incidentCode ?? null,
    incidentTitle: r.incidentTitle ?? null,
    org: r.orgName ?? null,
    receivedAt: fmtDateTime(r.receivedAt),
    reviewedAt: r.reviewedAt ? fmtDateTime(r.reviewedAt) : null,
    reviewer: r.reviewer ?? null,
    reviewNote: r.reviewNote ?? null,
  }))
}

export async function getIndicio(id: string) {
  const rows = await db
    .select({
      id: indicios.id,
      channel: indicios.channel,
      status: indicios.status,
      title: indicios.title,
      summary: indicios.summary,
      content: indicios.content,
      url: indicios.url,
      sender: indicios.sender,
      isOfficial: indicios.isOfficial,
      incidentId: indicios.incidentId,
      occurredAt: indicios.occurredAt,
      receivedAt: indicios.receivedAt,
      reviewedAt: indicios.reviewedAt,
      reviewNote: indicios.reviewNote,
      orgName: sourceOrgs.name,
      incidentCode: incidents.code,
      reviewer: users.displayName,
    })
    .from(indicios)
    .leftJoin(sourceOrgs, eq(indicios.sourceOrgId, sourceOrgs.id))
    .leftJoin(incidents, eq(indicios.incidentId, incidents.id))
    .leftJoin(users, eq(indicios.reviewedBy, users.id))
    .where(eq(indicios.id, id))
    .limit(1)
  const r = rows[0]
  if (!r) return undefined
  return {
    id: r.id,
    channel: r.channel,
    status: r.status,
    title: r.title,
    summary: r.summary ?? null,
    content: r.content ?? null,
    url: r.url ?? null,
    sender: r.sender ?? null,
    isOfficial: r.isOfficial,
    incidentId: r.incidentId ?? null,
    incidentCode: r.incidentCode ?? null,
    org: r.orgName ?? null,
    occurredAt: r.occurredAt ? fmtDateTime(r.occurredAt) : null,
    receivedAt: fmtDateTime(r.receivedAt),
    reviewedAt: r.reviewedAt ? fmtDateTime(r.reviewedAt) : null,
    reviewer: r.reviewer ?? null,
    reviewNote: r.reviewNote ?? null,
  }
}

// Ingesta desde un canal automático (correo/web). Deduplica por (canal, externalRef):
// dos capturas del mismo correo/página no se duplican.
export async function ingestIndicio(data: {
  channel: Channel
  title: string
  content?: string | null
  url?: string | null
  sender?: string | null
  sourceOrgId?: string | null
  isOfficial?: boolean
  externalRef?: string | null
  occurredAt?: number | null
  incidentId?: string | null
}): Promise<{ id: string; deduped: boolean }> {
  if (data.externalRef) {
    const existing = await db
      .select({ id: indicios.id })
      .from(indicios)
      .where(and(eq(indicios.channel, data.channel), eq(indicios.externalRef, data.externalRef)))
      .limit(1)
    if (existing[0]) return { id: existing[0].id, deduped: true }
  }
  const id = randomUUID()
  await db.insert(indicios).values({
    id,
    channel: data.channel,
    status: 'por_verificar',
    title: data.title,
    content: data.content ?? null,
    url: data.url ?? null,
    sender: data.sender ?? null,
    sourceOrgId: data.sourceOrgId ?? null,
    isOfficial: data.isOfficial ?? true,
    externalRef: data.externalRef ?? null,
    occurredAt: data.occurredAt ?? null,
    incidentId: data.incidentId ?? null,
  })
  return { id, deduped: false }
}

// Alta manual (captura legal de redes o indicio a mano).
export async function createIndicio(input: CreateIndicioInput, userId: string): Promise<{ id: string }> {
  const sourceOrgId = await resolveOrgId(input.sourceOrg)
  const isOfficial = input.isOfficial ?? input.channel !== 'redes'
  const id = randomUUID()
  await db.insert(indicios).values({
    id,
    channel: input.channel,
    status: 'por_verificar',
    title: input.title,
    content: input.content ?? null,
    url: input.url ?? null,
    sender: input.sender ?? null,
    sourceOrgId,
    isOfficial,
    incidentId: input.incidentId ?? null,
    occurredAt: parseDate(input.occurredAt),
  })
  await db
    .insert(auditLog)
    .values({
      id: randomUUID(),
      userId,
      action: 'indicio.create',
      entityType: 'indicio',
      entityId: id,
      details: { channel: input.channel },
    })
    .catch(() => {})
  return { id }
}

// Visto bueno: marca verificado y (por defecto) lo promueve a fuente del incidente.
export async function verifyIndicio(
  id: string,
  input: VerifyIndicioInput,
  userId: string,
): Promise<{ id: string; sourceId: string | null } | { error: string } | undefined> {
  const rows = await db.select().from(indicios).where(eq(indicios.id, id)).limit(1)
  const ind = rows[0]
  if (!ind || ind.deletedAt) return undefined
  const incidentId = input.incidentId ?? ind.incidentId ?? null
  if (input.promote && !incidentId) return { error: 'incidente_requerido' }
  if (incidentId) {
    const inc = await db.select({ id: incidents.id }).from(incidents).where(eq(incidents.id, incidentId)).limit(1)
    if (!inc[0]) return { error: 'incidente_no_encontrado' }
  }
  let sourceId: string | null = null
  if (input.promote && incidentId) {
    const orgId = (await resolveOrgId(input.sourceOrg)) ?? ind.sourceOrgId ?? null
    sourceId = randomUUID()
    await db.insert(sources).values({
      id: sourceId,
      incidentId,
      sourceOrgId: orgId,
      title: ind.title,
      url: ind.url,
      content: ind.content,
      capturedAt: ind.occurredAt ?? ind.receivedAt,
      createdBy: userId,
    })
  }
  await db
    .update(indicios)
    .set({
      status: 'verificado',
      incidentId,
      reviewedBy: userId,
      reviewedAt: nowSec(),
      reviewNote: input.note ?? null,
      promotedSourceId: sourceId,
    })
    .where(eq(indicios.id, id))
  await db
    .insert(auditLog)
    .values({
      id: randomUUID(),
      userId,
      action: 'indicio.verify',
      entityType: 'indicio',
      entityId: id,
      details: { incidentId, promoted: !!sourceId },
    })
    .catch(() => {})
  return { id, sourceId }
}

export async function discardIndicio(id: string, input: DiscardIndicioInput, userId: string): Promise<{ id: string } | undefined> {
  const rows = await db.select({ id: indicios.id, deletedAt: indicios.deletedAt }).from(indicios).where(eq(indicios.id, id)).limit(1)
  if (!rows[0] || rows[0].deletedAt) return undefined
  await db
    .update(indicios)
    .set({ status: 'descartado', reviewedBy: userId, reviewedAt: nowSec(), reviewNote: input.note ?? null })
    .where(eq(indicios.id, id))
  await db
    .insert(auditLog)
    .values({
      id: randomUUID(),
      userId,
      action: 'indicio.discard',
      entityType: 'indicio',
      entityId: id,
      details: { note: input.note ?? null },
    })
    .catch(() => {})
  return { id }
}
