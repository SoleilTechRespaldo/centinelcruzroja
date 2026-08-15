import { migrate } from 'drizzle-orm/libsql/migrator'
import { pathToFileURL } from 'node:url'
import { db, schema, client } from './client'
import { hashPassword } from '../lib/password'
import type { Role } from '../lib/auth'

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Las 38 comunas de la Región de Valparaíso, por provincia.
const COMUNAS: { name: string; province: string }[] = [
  ...['Valparaíso', 'Casablanca', 'Concón', 'Juan Fernández', 'Puchuncaví', 'Quintero', 'Viña del Mar'].map((name) => ({
    name,
    province: 'Valparaíso',
  })),
  ...['Isla de Pascua'].map((name) => ({ name, province: 'Isla de Pascua' })),
  ...['Los Andes', 'Calle Larga', 'Rinconada', 'San Esteban'].map((name) => ({ name, province: 'Los Andes' })),
  ...['La Ligua', 'Cabildo', 'Papudo', 'Petorca', 'Zapallar'].map((name) => ({ name, province: 'Petorca' })),
  ...['Quillota', 'La Calera', 'Hijuelas', 'La Cruz', 'Nogales'].map((name) => ({ name, province: 'Quillota' })),
  ...['San Antonio', 'Algarrobo', 'Cartagena', 'El Quisco', 'El Tabo', 'Santo Domingo'].map((name) => ({ name, province: 'San Antonio' })),
  ...['San Felipe', 'Catemu', 'Llaillay', 'Panquehue', 'Putaendo', 'Santa María'].map((name) => ({
    name,
    province: 'San Felipe de Aconcagua',
  })),
  ...['Quilpué', 'Limache', 'Olmué', 'Villa Alemana'].map((name) => ({ name, province: 'Marga Marga' })),
]

const EVENT_TYPES = [
  'Sistema frontal',
  'Incendio forestal',
  'Sismo',
  'Marejada',
  'Aluvión / remoción en masa',
  'Corte eléctrico',
  'Corte de agua',
  'Erupción volcánica',
  'Tsunami',
  'Ola de calor',
]

const SOURCE_ORGS: { name: string; url: string }[] = [
  { name: 'SENAPRED', url: 'https://senapred.cl' },
  { name: 'DMC', url: 'https://www.meteochile.gob.cl' },
  { name: 'DGA', url: 'https://dga.mop.gob.cl' },
  { name: 'SHOA', url: 'https://www.shoa.cl' },
  { name: 'CSN', url: 'https://www.sismologia.cl' },
  { name: 'CONAF', url: 'https://www.conaf.cl' },
  { name: 'SEC', url: 'https://www.sec.cl' },
  { name: 'Esval', url: 'https://www.esval.cl' },
  { name: 'Vialidad MOP', url: 'https://www.vialidad.cl' },
  { name: 'DIRECTEMAR', url: 'https://www.directemar.cl' },
  { name: 'SERNAGEOMIN', url: 'https://www.sernageomin.cl' },
  { name: 'Delegación Presidencial Valparaíso', url: 'https://www.delegacionpresidencialvalparaiso.gob.cl' },
  { name: 'MINEDUC', url: 'https://www.mineduc.cl' },
  { name: 'MINSAL', url: 'https://www.minsal.cl' },
  { name: 'SUBTEL', url: 'https://www.subtel.gob.cl' },
]

const USERS: { email: string; name: string; role: Role }[] = [
  { email: 'njerez@cruzroja.cl', name: 'Nicolás Jerez', role: 'admin' },
  { email: 'imanni@cruzroja.cl', name: 'Ive Manni', role: 'coordinator' },
  { email: 'operador@cruzroja.cl', name: 'Operador Sala', role: 'operator' },
  { email: 'consulta@cruzroja.cl', name: 'Consulta DEM', role: 'consulta' },
]

type SeedIncident = {
  id: string
  code: string
  title: string
  eventType: string
  status: 'monitoring' | 'active' | 'closed'
  senapred: 'none' | 'atp' | 'yellow' | 'red'
  cruzRoja: 'green' | 'yellow' | 'red'
  description: string
  daysAgo: number
  comunas: string[]
  report: { personas: number; voluntarios: number; filiales: [string, number][] }
  sources: { org: string; title: string; hOffset: number }[]
  timeline: { org: string | null; text: string; hOffset: number }[]
  evidence: { kind: 'image' | 'pdf' | 'screenshot' | 'doc' | 'link'; caption: string; fileName: string; source: string }[]
}

const INCIDENTS: SeedIncident[] = [
  {
    id: 'inc-2026-0015',
    code: '2026-0015',
    title: 'Sistema frontal zona centro',
    eventType: 'Sistema frontal',
    status: 'active',
    senapred: 'yellow',
    cruzRoja: 'yellow',
    description:
      'Sistema frontal afecta la zona centro de la región con precipitaciones intensas y viento. SENAPRED declaró Alerta Amarilla para 5 comunas.',
    daysAgo: 6,
    comunas: ['Valparaíso', 'Viña del Mar', 'Quilpué', 'Villa Alemana', 'Limache'],
    report: {
      personas: 2350,
      voluntarios: 72,
      filiales: [
        ['Valparaíso', 18],
        ['Viña del Mar', 16],
        ['Quilpué', 14],
        ['Villa Alemana', 12],
        ['Limache', 12],
      ],
    },
    sources: [
      { org: 'SENAPRED', title: 'Comunicado N°12', hOffset: 5 },
      { org: 'DMC', title: 'Aviso meteorológico AAA4', hOffset: 1 },
      { org: 'Esval', title: 'Corte de suministro', hOffset: 6 },
    ],
    timeline: [
      { org: 'SENAPRED', text: 'SENAPRED emite Alerta Temprana Preventiva.', hOffset: 0 },
      { org: 'DMC', text: 'DMC informa precipitaciones intensas.', hOffset: 1 },
      { org: 'SENAPRED', text: 'SENAPRED actualiza a Alerta Amarilla (5 comunas).', hOffset: 5 },
      { org: null, text: 'Cruz Roja activa 6 filiales.', hOffset: 6 },
    ],
    evidence: [
      { kind: 'image', caption: 'Río Aconcagua', fileName: 'aconcagua.jpg', source: 'SENAPRED' },
      { kind: 'pdf', caption: 'Comunicado N°12', fileName: 'comunicado-12.pdf', source: 'SENAPRED' },
    ],
  },
  {
    id: 'inc-2026-0014',
    code: '2026-0014',
    title: 'Incendio sector Las Tablas',
    eventType: 'Incendio forestal',
    status: 'active',
    senapred: 'red',
    cruzRoja: 'red',
    description: 'Incendio forestal en el sector Las Tablas con avance hacia zonas pobladas.',
    daysAgo: 7,
    comunas: ['Viña del Mar', 'Quilpué'],
    report: {
      personas: 180,
      voluntarios: 24,
      filiales: [
        ['Viña del Mar', 14],
        ['Quilpué', 10],
      ],
    },
    sources: [],
    timeline: [],
    evidence: [],
  },
  {
    id: 'inc-2026-0013',
    code: '2026-0013',
    title: 'Marejadas litoral',
    eventType: 'Marejada',
    status: 'active',
    senapred: 'atp',
    cruzRoja: 'green',
    description: 'Marejadas anormales en el borde costero regional.',
    daysAgo: 8,
    comunas: ['Valparaíso', 'Viña del Mar', 'Concón'],
    report: {
      personas: 60,
      voluntarios: 12,
      filiales: [
        ['Valparaíso', 7],
        ['Concón', 5],
      ],
    },
    sources: [],
    timeline: [],
    evidence: [],
  },
  {
    id: 'inc-2026-0012',
    code: '2026-0012',
    title: 'Corte de agua Quilpué',
    eventType: 'Corte de agua',
    status: 'closed',
    senapred: 'none',
    cruzRoja: 'green',
    description: 'Corte de suministro de agua potable en sectores de Quilpué.',
    daysAgo: 12,
    comunas: ['Quilpué'],
    report: { personas: 700, voluntarios: 6, filiales: [['Quilpué', 6]] },
    sources: [],
    timeline: [],
    evidence: [],
  },
]

// Migra + siembra. Exportada para reutilizarla en pruebas (BD en memoria).
export async function seed() {
  await migrate(db, { migrationsFolder: './drizzle' })

  const regionId = 'reg-valparaiso'
  await db.insert(schema.regions).values({ id: regionId, name: 'Valparaíso' }).onConflictDoNothing()

  for (const c of COMUNAS) {
    await db
      .insert(schema.comunas)
      .values({ id: 'com-' + slug(c.name), name: c.name, province: c.province, regionId })
      .onConflictDoNothing()
  }
  for (const name of EVENT_TYPES) {
    await db
      .insert(schema.eventTypes)
      .values({ id: 'et-' + slug(name), name, slug: slug(name) })
      .onConflictDoNothing()
  }
  for (const o of SOURCE_ORGS) {
    await db
      .insert(schema.sourceOrgs)
      .values({ id: 'so-' + slug(o.name), name: o.name, slug: slug(o.name), officialUrl: o.url })
      .onConflictDoNothing()
  }

  const initialPassword = process.env.SEED_ADMIN_PASSWORD ?? 'centinela1234'
  const passwordHash = await hashPassword(initialPassword)
  for (const u of USERS) {
    await db
      .insert(schema.users)
      .values({
        id: 'usr-' + slug(u.email.split('@')[0]),
        email: u.email.toLowerCase(),
        displayName: u.name,
        role: u.role,
        passwordHash,
        isActive: true,
      })
      .onConflictDoNothing()
  }

  // Incidentes de ejemplo (con comunas, reporte, y cronología/fuentes/evidencias en el principal).
  const DAY = 86400
  const nowSec = Math.floor(Date.now() / 1000)
  const adminId = 'usr-njerez'
  for (const it of INCIDENTS) {
    const start = nowSec - it.daysAgo * DAY
    await db
      .insert(schema.incidents)
      .values({
        id: it.id,
        code: it.code,
        title: it.title,
        eventTypeId: 'et-' + slug(it.eventType),
        status: it.status,
        alertSenapred: it.senapred,
        alertCruzRoja: it.cruzRoja,
        description: it.description,
        startedAt: start,
        createdBy: adminId,
      })
      .onConflictDoNothing()

    for (const cn of it.comunas) {
      await db
        .insert(schema.incidentComunas)
        .values({ incidentId: it.id, comunaId: 'com-' + slug(cn) })
        .onConflictDoNothing()
    }

    await db
      .insert(schema.incidentReports)
      .values({
        id: 'rep-' + it.id,
        incidentId: it.id,
        personasAfectadas: it.report.personas,
        voluntarios: it.report.voluntarios,
        voluntariosPorFilial: it.report.filiales.map(([filial, n]) => ({ filial, n })),
        reportedAt: start + 3600,
        createdBy: adminId,
      })
      .onConflictDoNothing()

    const srcIds: Record<string, string> = {}
    for (let i = 0; i < it.sources.length; i++) {
      const s = it.sources[i]
      const sid = `src-${it.id}-${i}`
      await db
        .insert(schema.sources)
        .values({
          id: sid,
          incidentId: it.id,
          sourceOrgId: 'so-' + slug(s.org),
          title: s.title,
          capturedAt: start + s.hOffset * 3600,
          createdBy: adminId,
        })
        .onConflictDoNothing()
      if (!srcIds[s.org]) srcIds[s.org] = sid
    }
    for (let i = 0; i < it.timeline.length; i++) {
      const t = it.timeline[i]
      await db
        .insert(schema.timelineEvents)
        .values({
          id: `tl-${it.id}-${i}`,
          incidentId: it.id,
          happenedAt: start + t.hOffset * 3600,
          entryType: t.org ? 'source' : 'action',
          description: t.text,
          sourceId: t.org ? (srcIds[t.org] ?? null) : null,
          createdBy: adminId,
        })
        .onConflictDoNothing()
    }
    for (let i = 0; i < it.evidence.length; i++) {
      const e = it.evidence[i]
      await db
        .insert(schema.evidence)
        .values({
          id: `ev-${it.id}-${i}`,
          incidentId: it.id,
          kind: e.kind,
          caption: e.caption,
          fileName: e.fileName,
          sourceText: e.source,
          capturedAt: start + 7200,
          createdBy: adminId,
        })
        .onConflictDoNothing()
    }
  }

  return {
    comunas: COMUNAS.length,
    tipos: EVENT_TYPES.length,
    fuentes: SOURCE_ORGS.length,
    usuarios: USERS.length,
    incidentes: INCIDENTS.length,
    initialPassword,
  }
}

async function main() {
  console.log('→ Aplicando migraciones y sembrando datos…')
  const r = await seed()
  console.log(
    `✓ Seed OK — ${r.comunas} comunas, ${r.tipos} tipos, ${r.fuentes} fuentes, ${r.usuarios} usuarios, ${r.incidentes} incidentes.`,
  )
  console.log(`  Clave inicial de todos los usuarios: "${r.initialPassword}"  (cámbiala luego)`)
  USERS.forEach((u) => console.log(`   - ${u.email}  (${u.role})`))
}

// Ejecutar solo si se invoca directamente (no al importar, p. ej. en pruebas).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .then(() => {
      client.close()
      process.exit(0)
    })
    .catch((e) => {
      console.error('✗ Seed falló:', e)
      client.close()
      process.exit(1)
    })
}
