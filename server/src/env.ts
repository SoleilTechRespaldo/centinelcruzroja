import { z } from 'zod'

// Configuración validada al arrancar.
const schema = z.object({
  PORT: z.coerce.number().int().positive().default(8787),
  CORS_ORIGIN: z.string().default('*'),
  // BD: por defecto un archivo SQLite LOCAL (sin cuenta Turso, $0). En producción
  // se apunta a Turso cambiando estas dos variables — el código no cambia.
  TURSO_DATABASE_URL: z.string().default('file:local.db'),
  TURSO_AUTH_TOKEN: z.string().optional(),
  // Secreto para firmar los JWT. En producción DEBE definirse uno propio.
  AUTH_SECRET: z.string().default('dev-secret-cambiar-en-produccion'),
})

export const env = schema.parse(process.env)
