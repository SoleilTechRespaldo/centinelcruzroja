import { describe, it, expect } from 'vitest'
import { parseEmailToIndicio, parseMailboxConfig } from '../src/lib/emailIngest'
import { ingestIndicio } from '../src/services/indicios'

const RAW = [
  'From: SENAPRED <alertas@senapred.cl>',
  'To: monitoreo@cruzroja.cl',
  'Subject: Alerta Amarilla por sistema frontal - Region de Valparaiso',
  'Message-ID: <abc123@senapred.cl>',
  'Date: Wed, 15 Aug 2026 10:00:00 -0400',
  'Content-Type: text/plain; charset=utf-8',
  '',
  'SENAPRED declara Alerta Amarilla para 5 comunas de la Region de Valparaiso.',
].join('\r\n')

describe('ingesta de correo', () => {
  it('parsea un correo RFC822 a los campos de un indicio', async () => {
    const ind = await parseEmailToIndicio(RAW)
    expect(ind.channel).toBe('correo')
    expect(ind.title).toContain('Alerta Amarilla')
    expect(ind.sender).toContain('senapred.cl')
    expect(ind.externalRef).toBe('<abc123@senapred.cl>')
    expect(ind.content).toContain('5 comunas')
    expect(ind.occurredAt).toBeGreaterThan(0)
  })

  it('deduplica por Message-ID (no crea dos veces el mismo correo)', async () => {
    const p = await parseEmailToIndicio(RAW)
    const a = await ingestIndicio({ ...p })
    const b = await ingestIndicio({ ...p })
    expect(a.deduped).toBe(false)
    expect(b.deduped).toBe(true)
    expect(b.id).toBe(a.id)
  })

  it('sin configuración de buzones devuelve lista vacía', () => {
    expect(parseMailboxConfig('')).toEqual([])
    expect(parseMailboxConfig('json-invalido')).toEqual([])
  })

  it('parsea la configuración de buzones válida', () => {
    const cfgs = parseMailboxConfig('[{"host":"imap.gmail.com","user":"a@b.cl","password":"x"}]')
    expect(cfgs).toHaveLength(1)
    expect(cfgs[0].port).toBe(993) // valor por defecto
    expect(cfgs[0].label).toBe('Correo')
  })
})
