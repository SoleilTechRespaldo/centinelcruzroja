import { env } from '../env'

// IA de apoyo (RF-18) intercambiable por variable de entorno. Costo 0 por defecto:
// APAGADA si AI_PROVIDER está vacío (no llama a nada). 'ollama' = local gratis;
// 'openai' = cualquier endpoint compatible OpenAI (Groq, OpenRouter, etc.).
// Nunca inventa hechos ni publica: solo devuelve una SUGERENCIA para revisión humana.

export type AiProvider = 'ollama' | 'openai' | 'none'

export function aiProvider(): AiProvider {
  const p = (env.AI_PROVIDER || '').toLowerCase().trim()
  if (p === 'ollama') return 'ollama'
  if (p === 'openai' || p === 'groq' || p === 'openai-compatible') return 'openai'
  return 'none'
}
export function isAiEnabled(): boolean {
  return aiProvider() !== 'none'
}

export interface IndicioAnalysis {
  resumen: string
  tipo: string | null
  comunas: string[]
}

const SYSTEM_PROMPT = [
  'Eres un asistente de la Cruz Roja Chilena que RESUME y CLASIFICA información de',
  'emergencias de la Región de Valparaíso, Chile. Reglas: NO inventes datos; si algo no',
  'está en el texto, déjalo vacío. Responde SOLO con un JSON válido, sin texto adicional,',
  'con esta forma exacta:',
  '{"resumen":"2-3 frases objetivas en español","tipo":"tipo de evento o cadena vacía","comunas":["comunas mencionadas"]}',
].join(' ')

function buildUserPrompt(input: { title: string; content: string }): string {
  return `Título: ${input.title}\n\nContenido:\n${(input.content || '').slice(0, 4000)}`
}

// Extrae el primer objeto JSON del texto del modelo (tolera texto alrededor).
export function extractAnalysis(text: string): IndicioAnalysis | null {
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) return null
  try {
    const o = JSON.parse(m[0]) as Record<string, unknown>
    const resumen = typeof o.resumen === 'string' ? o.resumen.trim() : ''
    const tipoRaw = typeof o.tipo === 'string' ? o.tipo.trim() : ''
    const comunas = Array.isArray(o.comunas)
      ? o.comunas.filter((c): c is string => typeof c === 'string' && c.trim().length > 0).slice(0, 12)
      : []
    if (!resumen && !tipoRaw && comunas.length === 0) return null
    return { resumen, tipo: tipoRaw || null, comunas }
  } catch {
    return null
  }
}

async function callOllama(system: string, user: string): Promise<string> {
  const url = (env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '')
  const res = await fetch(`${url}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: env.OLLAMA_MODEL || 'llama3.2',
      stream: false,
      format: 'json',
      options: { temperature: 0.1 },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  })
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`)
  const data = (await res.json()) as { message?: { content?: string } }
  return data.message?.content ?? ''
}

async function callOpenAiCompatible(system: string, user: string): Promise<string> {
  const base = (env.AI_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, '')
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.AI_API_KEY ?? ''}` },
    body: JSON.stringify({
      model: env.AI_MODEL || 'llama-3.1-8b-instant',
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  })
  if (!res.ok) throw new Error(`IA HTTP ${res.status}`)
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  return data.choices?.[0]?.message?.content ?? ''
}

// Devuelve el análisis, o null si la IA está apagada o no respondió algo usable.
export async function analyzeText(input: { title: string; content: string }): Promise<IndicioAnalysis | null> {
  const provider = aiProvider()
  if (provider === 'none') return null
  const user = buildUserPrompt(input)
  const raw = provider === 'ollama' ? await callOllama(SYSTEM_PROMPT, user) : await callOpenAiCompatible(SYSTEM_PROMPT, user)
  return extractAnalysis(raw)
}
