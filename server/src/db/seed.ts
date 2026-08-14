import { migrate } from 'drizzle-orm/libsql/migrator'
import { randomUUID } from 'node:crypto'
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
  ...['Valparaíso', 'Casablanca', 'Concón', 'Juan Fernández', 'Puchuncaví', 'Quintero', 'Viña del Mar'].map((name) => ({ name, province: 'Valparaíso' })),
  ...['Isla de Pascua'].map((name) => ({ name, province: 'Isla de Pascua' })),
  ...['Los Andes', 'Calle Larga', 'Rinconada', 'San Esteban'].map((name) => ({ name, province: 'Los Andes' })),
  ...['La Ligua', 'Cabildo', 'Papudo', 'Petorca', 'Zapallar'].map((name) => ({ name, province: 'Petorca' })),
  ...['Quillota', 'La Calera', 'Hijuelas', 'La Cruz', 'Nogales'].map((name) => ({ name, province: 'Quillota' })),
  ...['San Antonio', 'Algarrobo', 'Cartagena', 'El Quisco', 'El Tabo', 'Santo Domingo'].map((name) => ({ name, province: 'San Antonio' })),
  ...['San Felipe', 'Catemu', 'Llaillay', 'Panquehue', 'Putaendo', 'Santa María'].map((name) => ({ name, province: 'San Felipe de Aconcagua' })),
  ...['Quilpué', 'Limache', 'Olmué', 'Villa Alemana'].map((name) => ({ name, province: 'Marga Marga' })),
]

const EVENT_TYPES = [
  'Sistema frontal', 'Incendio forestal', 'Sismo', 'Marejada', 'Aluvión / remoción en masa',
  'Corte eléctrico', 'Corte de agua', 'Erupción volcánica', 'Tsunami', 'Ola de calor',
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

async function main() {
  console.log('→ Aplicando migraciones (drizzle/)…')
  await migrate(db, { migrationsFolder: './drizzle' })

  console.log('→ Sembrando datos…')
  const regionId = 'reg-valparaiso'
  await db.insert(schema.regions).values({ id: regionId, name: 'Valparaíso' }).onConflictDoNothing()

  for (const c of COMUNAS) {
    await db.insert(schema.comunas).values({ id: 'com-' + slug(c.name), name: c.name, province: c.province, regionId }).onConflictDoNothing()
  }
  for (const name of EVENT_TYPES) {
    await db.insert(schema.eventTypes).values({ id: 'et-' + slug(name), name, slug: slug(name) }).onConflictDoNothing()
  }
  for (const o of SOURCE_ORGS) {
    await db.insert(schema.sourceOrgs).values({ id: 'so-' + slug(o.name), name: o.name, slug: slug(o.name), officialUrl: o.url }).onConflictDoNothing()
  }

  const initialPassword = process.env.SEED_ADMIN_PASSWORD ?? 'centinela1234'
  const passwordHash = await hashPassword(initialPassword)
  for (const u of USERS) {
    await db.insert(schema.users).values({
      id: 'usr-' + slug(u.email.split('@')[0]),
      email: u.email.toLowerCase(),
      displayName: u.name,
      role: u.role,
      passwordHash,
      isActive: true,
    }).onConflictDoNothing()
  }

  console.log(`✓ Seed OK — ${COMUNAS.length} comunas, ${EVENT_TYPES.length} tipos, ${SOURCE_ORGS.length} fuentes, ${USERS.length} usuarios.`)
  console.log(`  Clave inicial de todos los usuarios: "${initialPassword}"  (cámbiala luego)`)
  USERS.forEach((u) => console.log(`   - ${u.email}  (${u.role})`))
}

main()
  .then(() => { client.close(); process.exit(0) })
  .catch((e) => { console.error('✗ Seed falló:', e); client.close(); process.exit(1) })
