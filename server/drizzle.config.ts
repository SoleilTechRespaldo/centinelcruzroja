import { defineConfig } from 'drizzle-kit'

// Config de drizzle-kit. `db:generate` produce el SQL de migración desde el
// schema SIN necesidad de una BD real. La creación/migración en Turso se hace
// al final (con TURSO_DATABASE_URL configurada).
export default defineConfig({
  dialect: 'turso',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? 'file:local.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
})
