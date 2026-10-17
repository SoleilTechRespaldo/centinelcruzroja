import { describe, it, expect } from 'vitest'
import { apiReq, login } from './helpers'

describe('estadísticas: histórico y por incidente', () => {
  it('histórico devuelve totales y series reales', async () => {
    const token = await login('operador@cruzroja.cl')
    const res = await apiReq('GET', '/stats/historico', { token })
    expect(res.status).toBe(200)
    expect(typeof res.json.totals.incidentes).toBe('number')
    expect(Array.isArray(res.json.porTipo)).toBe(true)
    expect(res.json.porMes.length).toBe(6)
    expect(res.json.biePorMes.length).toBe(6)
  })

  it('estadísticas de un incidente sembrado', async () => {
    const token = await login('operador@cruzroja.cl')
    const res = await apiReq('GET', '/stats/incident/inc-2026-0015', { token })
    expect(res.status).toBe(200)
    expect(res.json.code).toBeTruthy()
    expect(typeof res.json.indicios.total).toBe('number')
    expect(typeof res.json.bie.versiones).toBe('number')
    expect(res.json.diasActivo).toBeGreaterThanOrEqual(1)
  })

  it('incidente inexistente => 404', async () => {
    const token = await login('operador@cruzroja.cl')
    const res = await apiReq('GET', '/stats/incident/no-existe', { token })
    expect(res.status).toBe(404)
  })

  it('consulta (solo lectura) puede ver el histórico', async () => {
    const token = await login('consulta@cruzroja.cl')
    const res = await apiReq('GET', '/stats/historico', { token })
    expect(res.status).toBe(200)
  })
})
