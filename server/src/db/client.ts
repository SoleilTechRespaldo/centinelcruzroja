import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import { env } from '../env'
import * as schema from './schema'

// La conexión real a Turso se activa cuando exista la BD (etapa final).
export function createDb() {
  if (!env.TURSO_DATABASE_URL) {
    throw new Error('TURSO_DATABASE_URL no configurada — la BD Turso aún no se crea (etapa final).')
  }
  const client = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN })
  return drizzle(client, { schema })
}

export type Db = ReturnType<typeof createDb>
export { schema }
