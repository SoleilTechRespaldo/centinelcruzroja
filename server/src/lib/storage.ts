import { mkdir, writeFile, readFile, access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'
import { env } from '../env'

// Almacenamiento de archivos binarios (evidencias, adjuntos de correo).
// Dos backends con la MISMA interfaz: carpeta local (por defecto, $0, funciona ya)
// y Cloudflare R2 (S3-compatible) cuando se configuran las 4 variables R2_*.
// El código de negocio no cambia al pasar de uno a otro.

export function isR2Configured(): boolean {
  return Boolean(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET)
}

export function storageBackend(): 'local' | 'r2' {
  return isR2Configured() ? 'r2' : 'local'
}

// --- Backend local (carpeta STORAGE_DIR) ---
function localPath(key: string): string {
  const base = resolve(env.STORAGE_DIR)
  // Evita traversal: la ruta final debe quedar dentro de STORAGE_DIR.
  const full = resolve(base, key)
  if (full !== base && !full.startsWith(base + sep)) {
    throw new Error('clave de almacenamiento inválida')
  }
  return full
}

async function localPut(key: string, body: Uint8Array): Promise<void> {
  const full = localPath(key)
  await mkdir(dirname(full), { recursive: true })
  await writeFile(full, body)
}

async function localGet(key: string): Promise<Uint8Array | null> {
  try {
    return await readFile(localPath(key))
  } catch {
    return null
  }
}

// --- Backend R2 (aws4fetch, firma S3 sobre fetch) ---
function r2Url(key: string): string {
  return `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${key.split('/').map(encodeURIComponent).join('/')}`
}

async function r2Client() {
  const { AwsClient } = await import('aws4fetch')
  return new AwsClient({ accessKeyId: env.R2_ACCESS_KEY_ID!, secretAccessKey: env.R2_SECRET_ACCESS_KEY!, service: 's3', region: 'auto' })
}

async function r2Put(key: string, body: Uint8Array, contentType: string): Promise<void> {
  const client = await r2Client()
  const res = await client.fetch(r2Url(key), { method: 'PUT', body: body as unknown as BodyInit, headers: { 'Content-Type': contentType } })
  if (!res.ok) throw new Error(`R2 PUT falló (${res.status})`)
}

async function r2Get(key: string): Promise<Uint8Array | null> {
  const client = await r2Client()
  const res = await client.fetch(r2Url(key))
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`R2 GET falló (${res.status})`)
  return new Uint8Array(await res.arrayBuffer())
}

// --- API pública ---
export async function putObject(key: string, body: Uint8Array, contentType = 'application/octet-stream'): Promise<void> {
  if (isR2Configured()) return r2Put(key, body, contentType)
  return localPut(key, body)
}

export async function getObject(key: string): Promise<Uint8Array | null> {
  if (isR2Configured()) return r2Get(key)
  return localGet(key)
}

export async function objectExists(key: string): Promise<boolean> {
  if (isR2Configured()) return (await getObject(key)) !== null
  try {
    await access(join(resolve(env.STORAGE_DIR), key), constants.F_OK)
    return true
  } catch {
    return false
  }
}
