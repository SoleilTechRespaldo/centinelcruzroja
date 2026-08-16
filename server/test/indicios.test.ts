import { describe, it, expect } from 'vitest'
import { apiReq, login } from './helpers'

describe('bandeja de indicios', () => {
  it('operador captura un indicio de redes (no oficial, por verificar)', async () => {
    const token = await login('operador@cruzroja.cl')
    const create = await apiReq('POST', '/indicios', {
      token,
      body: {
        channel: 'redes',
        title: 'Post oficial: corte de agua en sectores',
        content: 'Esval informa corte de suministro.',
        url: 'https://x.com/esval/status/123',
        sender: '@Esval',
        sourceOrg: 'Esval',
      },
    })
    expect(create.status).toBe(201)
    expect(create.json.id).toBeTruthy()

    const detail = await apiReq('GET', `/indicios/${create.json.id}`, { token })
    expect(detail.status).toBe(200)
    expect(detail.json.status).toBe('por_verificar')
    expect(detail.json.isOfficial).toBe(false) // redes => no oficial hasta verificar
    expect(detail.json.channel).toBe('redes')
  })

  it('consulta (solo lectura) no puede crear => 403', async () => {
    const token = await login('consulta@cruzroja.cl')
    const create = await apiReq('POST', '/indicios', { token, body: { title: 'x' } })
    expect(create.status).toBe(403)
  })

  it('verificar con visto bueno promueve a fuente del incidente', async () => {
    const token = await login('operador@cruzroja.cl')
    const create = await apiReq('POST', '/indicios', {
      token,
      body: { channel: 'manual', title: 'Comunicado SENAPRED N°13', sourceOrg: 'SENAPRED' },
    })
    const id = create.json.id

    const verify = await apiReq('POST', `/indicios/${id}/verify`, {
      token,
      body: { incidentId: 'inc-2026-0015', promote: true },
    })
    expect(verify.status).toBe(200)
    expect(typeof verify.json.sourceId).toBe('string') // creó la fuente

    const detail = await apiReq('GET', `/indicios/${id}`, { token })
    expect(detail.json.status).toBe('verificado')
    expect(detail.json.incidentCode).toBe('2026-0015')
  })

  it('promover sin incidente => 400 incidente_requerido', async () => {
    const token = await login('operador@cruzroja.cl')
    const create = await apiReq('POST', '/indicios', { token, body: { title: 'Indicio suelto' } })
    const verify = await apiReq('POST', `/indicios/${create.json.id}/verify`, { token, body: { promote: true } })
    expect(verify.status).toBe(400)
    expect(verify.json.error).toBe('incidente_requerido')
  })

  it('descartar deja el indicio como descartado', async () => {
    const token = await login('operador@cruzroja.cl')
    const create = await apiReq('POST', '/indicios', { token, body: { title: 'Rumor sin confirmar' } })
    const discard = await apiReq('POST', `/indicios/${create.json.id}/discard`, { token, body: { note: 'no confirmado' } })
    expect(discard.status).toBe(200)
    const list = await apiReq('GET', '/indicios?status=descartado', { token })
    expect(list.json.items.some((i: { id: string }) => i.id === create.json.id)).toBe(true)
  })
})
