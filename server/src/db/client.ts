import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import { env } from '../env'
import * as schema from './schema'

// Cliente único. Por defecto habla con un archivo SQLite local (file:local.db);
// en producción, la misma llamada apunta a Turso vía TURSO_DATABASE_URL.
export const client = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN })
export const db = drizzle(client, { schema })

export type Db = typeof db
export { schema }
