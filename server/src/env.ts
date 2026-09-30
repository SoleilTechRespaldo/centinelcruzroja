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
  // Monitoreo de webs oficiales (RF-20). JSON con feeds RSS/Atom; vacío = desactivado.
  // Ej: [{"url":"https://www.meteochile.gob.cl/rss/avisos.xml","label":"DMC Avisos","org":"DMC"}]
  WEB_SOURCES: z.string().default(''),
  WEB_POLL_SECONDS: z.coerce.number().int().positive().default(900),
  // Almacenamiento de archivos (evidencias/adjuntos). Carpeta local por defecto;
  // si se definen las 4 variables R2, se usa Cloudflare R2 (mismo código).
  STORAGE_DIR: z.string().default('./storage'),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  // IA de apoyo (RF-18). Vacío = APAGADA (US$0, no llama a nada). 'ollama' = local
  // gratis; 'openai' = cualquier API compatible OpenAI (Groq/OpenRouter/etc.).
  AI_PROVIDER: z.string().default(''),
  OLLAMA_URL: z.string().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('llama3.2'),
  AI_BASE_URL: z.string().optional(), // ej. https://api.groq.com/openai/v1
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().optional(), // ej. llama-3.1-8b-instant
})

export const env = schema.parse(process.env)

// Guardas de producción: en prod, no arrancar con el secreto de desarrollo, y
// avisar si CORS quedó abierto (defaults de seguridad #7/#2/#13).
const DEV_SECRET = 'dev-secret-cambiar-en-produccion'
if (process.env.NODE_ENV === 'production') {
  if (env.AUTH_SECRET === DEV_SECRET) {
    throw new Error('[seguridad] AUTH_SECRET por defecto en producción: define uno propio y largo antes de desplegar.')
  }
  if (env.CORS_ORIGIN === '*') {
    console.warn('[seguridad] CORS_ORIGIN="*" en producción: restríngelo al dominio del frontend.')
  }
} else if (env.AUTH_SECRET === DEV_SECRET) {
  console.warn('[seguridad] Usando AUTH_SECRET de desarrollo. Define uno propio antes de producción.')
}
