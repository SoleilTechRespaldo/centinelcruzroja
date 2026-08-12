import { z } from 'zod'

// Configuración validada al arrancar. Los valores de Turso/Auth son opcionales
// mientras la BD no exista (etapa final); el server igual levanta con stubs.
const schema = z.object({
  PORT: z.coerce.number().int().positive().default(8787),
  CORS_ORIGIN: z.string().default('*'),
  TURSO_DATABASE_URL: z.string().optional(),
  TURSO_AUTH_TOKEN: z.string().optional(),
  AUTH_SECRET: z.string().optional(),
})

export const env = schema.parse(process.env)
export type AppEnv = z.infer<typeof schema>
