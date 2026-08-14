import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

// Hash de contraseñas con scrypt (nativo de Node, sin dependencias ni binarios).
const scryptAsync = promisify(scrypt)
const KEYLEN = 64

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derived = (await scryptAsync(password, salt, KEYLEN)) as Buffer
  return `scrypt$${salt}$${derived.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, hash] = stored.split('$')
  if (scheme !== 'scrypt' || !salt || !hash) return false
  const derived = (await scryptAsync(password, salt, KEYLEN)) as Buffer
  const hashBuf = Buffer.from(hash, 'hex')
  return hashBuf.length === derived.length && timingSafeEqual(hashBuf, derived)
}
