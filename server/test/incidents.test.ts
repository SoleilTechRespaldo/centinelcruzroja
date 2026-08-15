import { describe, it, expect } from 'vitest'
import { apiReq, login } from './helpers'

describe('incidentes', () => {
  it('operador crea un incidente y luego se puede leer', async () => {
    const token = await login('operador@cruzroja.cl')
    const create = await apiReq('POST', '/incidents', {
      token,
      body: { title: 'Sismo de prueba', eventType: 'Sismo', startedAt: '2026-08-15 10:00', comunas: ['Valparaíso', 'Viña del Mar'] },
    })
    expect(create.status).toBe(201)
    expect(create.json.id).toBeTruthy()
    expect(create.json.code).toMatch(/^2026-\d{4}$/)

    const detail = await apiReq('GET', `/incidents/${create.json.id}`, { token })
    expect(detail.status).toBe(200)
    expect(detail.json.title).toBe('Sismo de prueba')
  })

  it('consulta (solo lectura) no puede crear => 403', async () => {
    const token = await login('consulta@cruzroja.cl')
    const create = await apiReq('POST', '/incidents', {
      token,
      body: { title: 'No permitido', eventType: 'Sismo', startedAt: '2026-08-15 10:00', comunas: ['Valparaíso'] },
    })
    expect(create.status).toBe(403)
  })

  it('cerrar un incidente lo marca como closed', async () => {
    const token = await login('operador@cruzroja.cl')
    const patch = await apiReq('PATCH', '/incidents/inc-2026-0013', { token, body: { status: 'closed' } })
    expect(patch.status).toBe(200)
    const detail = await apiReq('GET', '/incidents/inc-2026-0013', { token })
    expect(detail.json.status).toBe('closed')
  })
})

describe('BIE: versiones y aprobación', () => {
  it('operador guarda borrador; no puede aprobar; el coordinador sí', async () => {
    const op = await login('operador@cruzroja.cl')
    const save = await apiReq('POST', '/incidents/inc-2026-0015/bie/versions', {
      token: op,
      body: { data: { datos: { nbie: '15' } } },
    })
    expect(save.status).toBe(201)
    expect(save.json.versionNumber).toBe(1)

    const denied = await apiReq('POST', `/incidents/inc-2026-0015/bie/versions/${save.json.id}/approve`, { token: op })
    expect(denied.status).toBe(403)

    const co = await login('imanni@cruzroja.cl')
    const ok = await apiReq('POST', `/incidents/inc-2026-0015/bie/versions/${save.json.id}/approve`, { token: co })
    expect(ok.status).toBe(200)

    const list = await apiReq('GET', '/incidents/inc-2026-0015/bie/versions', { token: op })
    expect(list.json.items[0].status).toBe('approved')
    expect(list.json.items[0].approvedBy).toBe('Ive Manni')
  })
})
