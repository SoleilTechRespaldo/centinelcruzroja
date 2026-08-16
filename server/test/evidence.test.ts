import { describe, it, expect } from 'vitest'
import app from '../src/index'
import { login } from './helpers'
import { putObject, getObject, storageBackend } from '../src/lib/storage'

describe('almacenamiento de archivos', () => {
  it('usa el backend local por defecto', () => {
    expect(storageBackend()).toBe('local')
  })

  it('guarda y recupera bytes (roundtrip)', async () => {
    await putObject('test/roundtrip.bin', new Uint8Array([9, 8, 7]), 'application/octet-stream')
    const back = await getObject('test/roundtrip.bin')
    expect(back && Array.from(back)).toEqual([9, 8, 7])
  })

  it('devuelve null si la clave no existe', async () => {
    expect(await getObject('test/no-existe.bin')).toBeNull()
  })
})

describe('evidencia con archivo real', () => {
  it('sube un archivo y luego lo descarga idéntico', async () => {
    const token = await login('operador@cruzroja.cl')
    const bytes = new Uint8Array([37, 80, 68, 70, 45, 1, 2, 3]) // "%PDF-" + datos

    const fd = new FormData()
    fd.set('kind', 'pdf')
    fd.set('caption', 'Comunicado N°12')
    fd.set('source', 'SENAPRED')
    fd.set('file', new File([bytes], 'comunicado-12.pdf', { type: 'application/pdf' }))

    const up = await app.request('/api/incidents/inc-2026-0015/evidence/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    })
    expect(up.status).toBe(201)
    const { id } = (await up.json()) as { id: string }
    expect(id).toBeTruthy()

    const dl = await app.request(`/api/evidence/${id}/file`, { headers: { Authorization: `Bearer ${token}` } })
    expect(dl.status).toBe(200)
    expect(dl.headers.get('content-type')).toContain('application/pdf')
    const back = new Uint8Array(await dl.arrayBuffer())
    expect(Array.from(back)).toEqual(Array.from(bytes))
  })

  it('sin archivo => 400', async () => {
    const token = await login('operador@cruzroja.cl')
    const fd = new FormData()
    fd.set('caption', 'x')
    fd.set('source', 'y')
    const up = await app.request('/api/incidents/inc-2026-0015/evidence/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    })
    expect(up.status).toBe(400)
  })

  it('descargar evidencia inexistente => 404', async () => {
    const token = await login('operador@cruzroja.cl')
    const dl = await app.request('/api/evidence/no-existe/file', { headers: { Authorization: `Bearer ${token}` } })
    expect(dl.status).toBe(404)
  })
})
