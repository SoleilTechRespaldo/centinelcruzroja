import { describe, it, expect } from 'vitest'
import { apiReq, login } from './helpers'

describe('auth', () => {
  it('login por usuario (username) devuelve token y usuario', async () => {
    const { status, json } = await apiReq('POST', '/auth/login', {
      body: { usuario: 'jerezn', password: 'centinela1234' },
    })
    expect(status).toBe(200)
    expect(typeof json.token).toBe('string')
    expect(json.user.role).toBe('admin')
  })

  it('login por correo también funciona', async () => {
    const { status, json } = await apiReq('POST', '/auth/login', {
      body: { usuario: 'njerez@cruzroja.cl', password: 'centinela1234' },
    })
    expect(status).toBe(200)
    expect(json.user.role).toBe('admin')
  })

  it('contraseña incorrecta => 401 credenciales_invalidas', async () => {
    const { status, json } = await apiReq('POST', '/auth/login', {
      body: { usuario: 'njerez@cruzroja.cl', password: 'incorrecta' },
    })
    expect(status).toBe(401)
    expect(json.error).toBe('credenciales_invalidas')
  })

  it('ruta protegida sin token => 401', async () => {
    const { status } = await apiReq('GET', '/incidents')
    expect(status).toBe(401)
  })

  it('con token se pueden leer los incidentes', async () => {
    const token = await login('njerez@cruzroja.cl')
    const { status, json } = await apiReq('GET', '/incidents', { token })
    expect(status).toBe(200)
    expect(Array.isArray(json.items)).toBe(true)
    expect(json.items.length).toBeGreaterThanOrEqual(4)
  })
})
