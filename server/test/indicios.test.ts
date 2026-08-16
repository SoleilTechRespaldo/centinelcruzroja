import { describe, it, expect } from 'vitest'
import app from '../src/index'
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

describe('indicios con adjunto (captura de redes, RF-27)', () => {
  it('captura con archivo → se descarga idéntico → al verificar pasa a evidencia', async () => {
    const token = await login('operador@cruzroja.cl')
    const bytes = new Uint8Array([137, 80, 78, 71, 13, 10]) // cabecera PNG

    const fd = new FormData()
    fd.set('channel', 'redes')
    fd.set('title', 'Captura de post oficial')
    fd.set('sourceOrg', 'SENAPRED')
    fd.set('file', new File([bytes], 'captura.png', { type: 'image/png' }))
    const up = await app.request('/api/indicios/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
    expect(up.status).toBe(201)
    const { id } = (await up.json()) as { id: string }

    const det = await apiReq('GET', `/indicios/${id}`, { token })
    expect(det.json.hasAttachment).toBe(true)
    expect(det.json.isOfficial).toBe(false) // redes

    const dl = await app.request(`/api/indicios/${id}/file`, { headers: { Authorization: `Bearer ${token}` } })
    expect(dl.status).toBe(200)
    expect(Array.from(new Uint8Array(await dl.arrayBuffer()))).toEqual(Array.from(bytes))

    // Al dar el visto bueno con incidente, el adjunto pasa a evidencia.
    const ver = await apiReq('POST', `/indicios/${id}/verify`, { token, body: { incidentId: 'inc-2026-0015', promote: true } })
    expect(ver.status).toBe(200)
    const inc = await apiReq('GET', '/incidents/inc-2026-0015', { token })
    const found = (inc.json.evidence as { hasFile: boolean; caption: string }[]).some(
      (e) => e.hasFile && e.caption === 'Captura de post oficial',
    )
    expect(found).toBe(true)
  })
})
