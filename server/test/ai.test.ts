import { describe, it, expect } from 'vitest'
import { extractAnalysis, isAiEnabled } from '../src/lib/ai'
import { apiReq, login } from './helpers'

describe('IA de apoyo (RF-18)', () => {
  it('está APAGADA por defecto (US$0, no llama a nada)', () => {
    expect(isAiEnabled()).toBe(false)
  })

  it('extractAnalysis parsea un JSON limpio', () => {
    const a = extractAnalysis(
      '{"resumen":"Lluvia intensa en Valparaíso.","tipo":"Sistema frontal","comunas":["Valparaíso","Viña del Mar"]}',
    )
    expect(a).not.toBeNull()
    expect(a?.resumen).toContain('Lluvia')
    expect(a?.tipo).toBe('Sistema frontal')
    expect(a?.comunas).toEqual(['Valparaíso', 'Viña del Mar'])
  })

  it('extractAnalysis tolera texto alrededor del JSON y "" => null', () => {
    const a = extractAnalysis('Claro, aquí tienes:\n{"resumen":"x","tipo":"","comunas":[]}\nEspero que sirva.')
    expect(a).not.toBeNull()
    expect(a?.tipo).toBeNull()
  })

  it('extractAnalysis devuelve null si no hay JSON', () => {
    expect(extractAnalysis('no hay json aquí')).toBeNull()
  })

  it('analizar con la IA apagada => 400 ia_no_configurada', async () => {
    const token = await login('operador@cruzroja.cl')
    const create = await apiReq('POST', '/indicios', { token, body: { title: 'Prueba IA' } })
    const res = await apiReq('POST', `/indicios/${create.json.id}/analyze`, { token })
    expect(res.status).toBe(400)
    expect(res.json.error).toBe('ia_no_configurada')
  })
})
