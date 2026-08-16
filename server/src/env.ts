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
  // Ingesta por correo (RF-26). JSON con los buzones IMAP a vigilar; vacío = desactivado.
  // Ej: [{"host":"imap.gmail.com","user":"x@gmail.com","password":"app-pass","label":"SENAPRED"}]
  IMAP_MAILBOXES: z.string().default(''),
  IMAP_POLL_SECONDS: z.coerce.number().int().positive().default(300),
  // Almacenamiento de archivos (evidencias/adjuntos). Carpeta local por defecto;
  // si se definen las 4 variables R2, se usa Cloudflare R2 (mismo código).
  STORAGE_DIR: z.string().default('./storage'),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
})

export const env = schema.parse(process.env)
