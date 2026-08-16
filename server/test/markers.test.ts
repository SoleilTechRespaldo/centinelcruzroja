import { describe, it, expect } from 'vitest'
import { apiReq, login } from './helpers'

describe('mapa: afectaciones georreferenciadas', () => {
  it('operador crea, lista y borra una afectación', async () => {
    const token = await login('operador@cruzroja.cl')
    const create = await apiReq('POST', '/markers', {
      token,
      body: { type: 'socavon', title: 'Socavón en Av. España', lat: -33.045, lng: -71.62, incidentId: 'inc-2026-0015' },
    })
    expect(create.status).toBe(201)
    const id = create.json.id as string

    const list = await apiReq('GET', '/markers', { token })
    expect(list.json.items.some((m: { id: string }) => m.id === id)).toBe(true)

    const del = await apiReq('DELETE', `/markers/${id}`, { token })
    expect(del.status).toBe(200)
    const list2 = await apiReq('GET', '/markers', { token })
    expect(list2.json.items.some((m: { id: string }) => m.id === id)).toBe(false)
  })

  it('consulta (solo lectura) no puede crear => 403', async () => {
    const token = await login('consulta@cruzroja.cl')
    const create = await apiReq('POST', '/markers', { token, body: { type: 'incendio', title: 'x', lat: -33, lng: -71 } })
    expect(create.status).toBe(403)
  })

  it('filtra por tipo', async () => {
    const token = await login('operador@cruzroja.cl')
    await apiReq('POST', '/markers', { token, body: { type: 'corte_agua', title: 'Corte de agua', lat: -33.05, lng: -71.44 } })
    const list = await apiReq('GET', '/markers?type=corte_agua', { token })
    expect(list.json.items.length).toBeGreaterThanOrEqual(1)
    expect(list.json.items.every((m: { type: string }) => m.type === 'corte_agua')).toBe(true)
  })
})
