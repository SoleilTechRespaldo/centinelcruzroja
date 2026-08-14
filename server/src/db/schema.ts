// Esqueleto de la base de datos — schema Drizzle (SQLite/libSQL para Turso).
// Refleja el ERD (docs/05-BASE-DE-DATOS.md). La creación real de la BD Turso
// (provisión + migraciones) se deja para el final; aquí va solo el "molde".

import { sqliteTable, text, integer, primaryKey, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

const now = sql`(unixepoch())`

// --- Enums (texto + typing) ---
const roleEnum = ['admin', 'coordinator', 'operator', 'consulta'] as const
const statusEnum = ['monitoring', 'active', 'closed'] as const
const alertSenapredEnum = ['none', 'atp', 'yellow', 'red'] as const
const alertCruzRojaEnum = ['green', 'yellow', 'red'] as const
const evidenceKindEnum = ['image', 'pdf', 'screenshot', 'doc', 'link'] as const
const timelineTypeEnum = ['alert_change', 'source', 'note', 'action'] as const
const bieStatusEnum = ['draft', 'approved', 'exported'] as const

// --- Usuarios (auth/roles; sesiones las gestiona la librería de auth) ---
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  displayName: text('display_name').notNull(),
  role: text('role', { enum: roleEnum }).notNull().default('operator'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  lastLoginAt: integer('last_login_at'),
  createdAt: integer('created_at').notNull().default(now),
  updatedAt: integer('updated_at').notNull().default(now),
})

// --- Geografía (país→región→provincia→comuna; escalable) ---
export const regions = sqliteTable('regions', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
})

export const comunas = sqliteTable('comunas', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  province: text('province'),
  regionId: text('region_id').notNull().references(() => regions.id),
  ineCode: text('ine_code'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
})

// --- Catálogos ---
export const eventTypes = sqliteTable('event_types', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  icon: text('icon'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
})

export const sourceOrgs = sqliteTable('source_orgs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  officialUrl: text('official_url'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
})

// --- Incidente (objeto central) ---
export const incidents = sqliteTable('incidents', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  title: text('title').notNull(),
  eventTypeId: text('event_type_id').references(() => eventTypes.id),
  status: text('status', { enum: statusEnum }).notNull().default('monitoring'),
  alertSenapred: text('alert_senapred', { enum: alertSenapredEnum }).notNull().default('none'),
  alertCruzRoja: text('alert_cruz_roja', { enum: alertCruzRojaEnum }).notNull().default('green'),
  description: text('description'),
  startedAt: integer('started_at').notNull(),
  endedAt: integer('ended_at'),
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at').notNull().default(now),
  updatedAt: integer('updated_at').notNull().default(now),
  deletedAt: integer('deleted_at'),
}, (t) => [
  index('idx_incidents_status').on(t.status),
  index('idx_incidents_event_type').on(t.eventTypeId),
  index('idx_incidents_started').on(t.startedAt),
])

// --- Pivote incidente ↔ comuna (N:M) ---
export const incidentComunas = sqliteTable('incident_comunas', {
  incidentId: text('incident_id').notNull().references(() => incidents.id),
  comunaId: text('comuna_id').notNull().references(() => comunas.id),
}, (t) => [primaryKey({ columns: [t.incidentId, t.comunaId] })])

// --- Reportes de situación (métricas con historia, para comparar) ---
export const incidentReports = sqliteTable('incident_reports', {
  id: text('id').primaryKey(),
  incidentId: text('incident_id').notNull().references(() => incidents.id),
  personasAfectadas: integer('personas_afectadas'),
  voluntarios: integer('voluntarios'),
  metrics: text('metrics', { mode: 'json' }), // heridos, fallecidos, albergues, eléctrico…
  voluntariosPorFilial: text('voluntarios_por_filial', { mode: 'json' }),
  reportedAt: integer('reported_at').notNull().default(now),
  createdBy: text('created_by').references(() => users.id),
}, (t) => [index('idx_reports_incident').on(t.incidentId)])

// --- Fuentes (procedencia: org + url + captured_at) ---
export const sources = sqliteTable('sources', {
  id: text('id').primaryKey(),
  incidentId: text('incident_id').notNull().references(() => incidents.id),
  sourceOrgId: text('source_org_id').references(() => sourceOrgs.id),
  title: text('title'),
  url: text('url'),
  content: text('content'),
  capturedAt: integer('captured_at').notNull().default(now),
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at').notNull().default(now),
}, (t) => [index('idx_sources_incident').on(t.incidentId)])

// --- Evidencias (archivos en R2) ---
export const evidence = sqliteTable('evidence', {
  id: text('id').primaryKey(),
  incidentId: text('incident_id').notNull().references(() => incidents.id),
  sourceId: text('source_id').references(() => sources.id),
  kind: text('kind', { enum: evidenceKindEnum }).notNull(),
  fileKey: text('file_key'),
  fileName: text('file_name'),
  mimeType: text('mime_type'),
  sizeBytes: integer('size_bytes'),
  caption: text('caption'),
  sourceText: text('source_text'), // procedencia libre (ej. "SENAPRED", "Terreno · voluntario")
  url: text('url'),
  capturedAt: integer('captured_at').notNull().default(now),
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at').notNull().default(now),
  deletedAt: integer('deleted_at'),
}, (t) => [index('idx_evidence_incident').on(t.incidentId)])

// --- Cronología (append-only) ---
export const timelineEvents = sqliteTable('timeline_events', {
  id: text('id').primaryKey(),
  incidentId: text('incident_id').notNull().references(() => incidents.id),
  happenedAt: integer('happened_at').notNull(),
  entryType: text('entry_type', { enum: timelineTypeEnum }).notNull().default('note'),
  description: text('description').notNull(),
  sourceId: text('source_id').references(() => sources.id),
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at').notNull().default(now),
}, (t) => [index('idx_timeline_incident').on(t.incidentId)])

// --- Plantillas del BIE (versionadas) ---
export const bieTemplates = sqliteTable('bie_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  version: integer('version').notNull().default(1),
  docxTemplateKey: text('docx_template_key'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at').notNull().default(now),
})

// --- BIE por versión (N por incidente) ---
export const bieVersions = sqliteTable('bie_versions', {
  id: text('id').primaryKey(),
  incidentId: text('incident_id').notNull().references(() => incidents.id),
  versionNumber: integer('version_number').notNull(),
  status: text('status', { enum: bieStatusEnum }).notNull().default('draft'),
  templateId: text('template_id').references(() => bieTemplates.id),
  data: text('data', { mode: 'json' }), // todos los campos del BIE (~45, ver skill)
  docxKey: text('docx_key'),
  pdfKey: text('pdf_key'),
  generatedBy: text('generated_by').references(() => users.id),
  approvedBy: text('approved_by').references(() => users.id),
  approvedAt: integer('approved_at'),
  createdAt: integer('created_at').notNull().default(now),
  deletedAt: integer('deleted_at'),
}, (t) => [index('idx_bie_incident').on(t.incidentId)])

// --- Bitácora (append-only; el backend solo inserta) ---
export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  action: text('action').notNull(),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  details: text('details', { mode: 'json' }),
  createdAt: integer('created_at').notNull().default(now),
}, (t) => [index('idx_audit_user').on(t.userId)])
