/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { apiReq, login } from './helpers'

describe('usuarios (solo admin)', () => {
  it('sin token => 401', async () => {
    const { status } = await apiReq('GET', '/users')
    expect(status).toBe(401)
  })

  it('operador (no admin) => 403', async () => {
    const token = await login('operador@cruzroja.cl')
    const { status } = await apiReq('GET', '/users', { token })
    expect(status).toBe(403)
  })

  it('admin lista los usuarios sembrados', async () => {
    const token = await login('njerez@cruzroja.cl')
    const { status, json } = await apiReq('GET', '/users', { token })
    expect(status).toBe(200)
    expect(json.items.length).toBeGreaterThanOrEqual(4)
    expect(json.items.map((u: any) => u.email)).toContain('njerez@cruzroja.cl')
  })

  it('recuperar contraseña: admin fija clave nueva y el usuario entra con ella', async () => {
    const admin = await login('njerez@cruzroja.cl')
    const { json } = await apiReq('GET', '/users', { token: admin })
    const op = json.items.find((u: any) => u.email === 'operador@cruzroja.cl')
    expect(op).toBeTruthy()

    // clave corta (<8) => 400
    const corta = await apiReq('POST', `/users/${op.id}/password`, { token: admin, body: { password: 'corta' } })
    expect(corta.status).toBe(400)

    // reset válido => 200
    const reset = await apiReq('POST', `/users/${op.id}/password`, { token: admin, body: { password: 'nuevaClave99' } })
    expect(reset.status).toBe(200)

    // login con la nueva => 200; con la vieja => 401
    const nueva = await apiReq('POST', '/auth/login', { body: { email: 'operador@cruzroja.cl', password: 'nuevaClave99' } })
    expect(nueva.status).toBe(200)
    const vieja = await apiReq('POST', '/auth/login', { body: { email: 'operador@cruzroja.cl', password: 'centinela1234' } })
    expect(vieja.status).toBe(401)
  })
})
