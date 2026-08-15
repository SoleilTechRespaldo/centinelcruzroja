import { beforeAll } from 'vitest'

// IMPORTANTE: fijar el entorno ANTES de importar cualquier módulo que lea `env`
// (db/client, index). BD en memoria => aislada y efímera por archivo de prueba.
process.env.TURSO_DATABASE_URL = ':memory:'
process.env.AUTH_SECRET = 'test-secret'
process.env.SEED_ADMIN_PASSWORD = 'centinela1234'

beforeAll(async () => {
  const { seed } = await import('../src/db/seed')
  await seed()
})
