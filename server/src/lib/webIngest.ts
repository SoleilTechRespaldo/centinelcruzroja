import { DOMParser } from '@xmldom/xmldom'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, schema } from '../db/client'
import { env } from '../env'
import { ingestIndicio } from '../services/indicios'

// Canal de monitoreo de webs oficiales (RF-20). Lee feeds RSS/Atom de sitios
// oficiales (SENAPRED, DMC, SHOA, CONAF…) y crea indicios "por verificar".
// Si un feed falla o cambió, emite un indicio de aviso para que se corrija la URL.
// Solo se consumen feeds explícitamente configurados (contenido público pensado
// para ser leído); sin `WEB_SOURCES` el canal queda desactivado.

const webSourceSchema = z.object({
  url: z.string().url(),
  label: z.string().default('Fuente'),
  org: z.string().optional(),
})
export type WebSource = z.infer<typeof webSourceSchema>

export function parseWebSources(raw: string): WebSource[] {
  if (!raw.trim()) return []
  try {
    return z.array(webSourceSchema).parse(JSON.parse(raw))
  } catch (e) {
    console.error('[ingesta-web] WEB_SOURCES inválido (se ignora):', (e as Error).message)
    return []
  }
}

export interface FeedItem {
  title: string
  link: string
  guid: string
  published: number | null
  summary: string
}

function firstText(el: Element, tag: string): string {
  const n = el.getElementsByTagName(tag)[0]
  return (n?.textContent ?? '').trim()
}
function toEpoch(s: string): number | null {
  if (!s) return null
  const t = Date.parse(s)
  return Number.isNaN(t) ? null : Math.floor(t / 1000)
}

// Parsea un feed RSS o Atom a una lista de ítems. Puro y testeable.
export function parseFeed(xml: string): FeedItem[] {
  let doc: Document
  try {
    doc = new DOMParser().parseFromString(xml, 'text/xml') as unknown as Document
  } catch {
    return [] // XML malformado: sin ítems (el poll lo trata como "sin novedades")
  }
  const out: FeedItem[] = []

  const rssItems = doc.getElementsByTagName('item')
  for (let i = 0; i < rssItems.length; i++) {
    const it = rssItems[i] as unknown as Element
    const link = firstText(it, 'link')
    const guid = firstText(it, 'guid') || link || firstText(it, 'title')
    out.push({
      title: firstText(it, 'title') || '(sin título)',
      link,
      guid,
      published: toEpoch(firstText(it, 'pubDate') || firstText(it, 'date')),
      summary: firstText(it, 'description'),
    })
  }
  if (out.length) return out

  // Atom
  const entries = doc.getElementsByTagName('entry')
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i] as unknown as Element
    const linkEl = e.getElementsByTagName('link')[0] as unknown as Element | undefined
    const link = linkEl?.getAttribute('href') ?? firstText(e, 'link')
    const guid = firstText(e, 'id') || link || firstText(e, 'title')
    out.push({
      title: firstText(e, 'title') || '(sin título)',
      link,
      guid,
      published: toEpoch(firstText(e, 'updated') || firstText(e, 'published')),
      summary: firstText(e, 'summary') || firstText(e, 'content'),
    })
  }
  return out
}

async function resolveOrgId(name?: string): Promise<string | null> {
  if (!name) return null
  const rows = await db.select({ id: schema.sourceOrgs.id }).from(schema.sourceOrgs).where(eq(schema.sourceOrgs.name, name)).limit(1)
  return rows[0]?.id ?? null
}

export interface WebPollResult {
  ok: boolean
  created: number
  deduped: number
  items: number
  error?: string
}

export async function pollWebSource(cfg: WebSource): Promise<WebPollResult> {
  const orgId = await resolveOrgId(cfg.org)
  try {
    const res = await fetch(cfg.url, {
      headers: { 'User-Agent': 'CentinelaBot/1.0 (+monitoreo Cruz Roja Valparaíso)' },
      redirect: 'follow',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const xml = await res.text()
    const items = parseFeed(xml)
    let created = 0
    let deduped = 0
    for (const it of items) {
      const r = await ingestIndicio({
        channel: 'web',
        title: it.title,
        content: it.summary,
        url: it.link || cfg.url,
        sender: cfg.label,
        sourceOrgId: orgId,
        isOfficial: true,
        externalRef: `web:${cfg.url}#${it.guid}`,
        occurredAt: it.published,
      })
      if (r.deduped) deduped++
      else created++
    }
    return { ok: true, created, deduped, items: items.length }
  } catch (e) {
    // Aviso de "fuente caída / posible cambio" (una sola vez, dedup por URL).
    await ingestIndicio({
      channel: 'web',
      title: `⚠ Revisar fuente: ${cfg.label}`,
      content: `No se pudo leer la fuente (${(e as Error).message}). Puede haber cambiado la URL; verifícala.`,
      url: cfg.url,
      sender: cfg.label,
      sourceOrgId: orgId,
      isOfficial: false,
      externalRef: `web-alerta:${cfg.url}`,
    })
    return { ok: false, created: 0, deduped: 0, items: 0, error: (e as Error).message }
  }
}

export async function runWebIngestionOnce(): Promise<{ sources: number; created: number; deduped: number; fallos: number }> {
  const cfgs = parseWebSources(env.WEB_SOURCES)
  const agg = { sources: cfgs.length, created: 0, deduped: 0, fallos: 0 }
  for (const cfg of cfgs) {
    const r = await pollWebSource(cfg)
    agg.created += r.created
    agg.deduped += r.deduped
    if (!r.ok) agg.fallos++
  }
  return agg
}

export function startWebIngestion(): void {
  const cfgs = parseWebSources(env.WEB_SOURCES)
  if (!cfgs.length) {
    console.log('[ingesta-web] sin fuentes (WEB_SOURCES vacío) — canal desactivado')
    return
  }
  console.log(`[ingesta-web] ${cfgs.length} fuente(s), sondeo cada ${env.WEB_POLL_SECONDS}s`)
  const runAll = async () => {
    for (const cfg of cfgs) {
      try {
        const r = await pollWebSource(cfg)
        if (r.created) console.log(`[ingesta-web] ${cfg.label}: ${r.created} nuevo(s)`)
        else if (!r.ok) console.warn(`[ingesta-web] ${cfg.label}: fuente caída (${r.error})`)
      } catch (e) {
        console.error(`[ingesta-web] ${cfg.label} falló:`, (e as Error).message)
      }
    }
  }
  void runAll()
  setInterval(() => void runAll(), env.WEB_POLL_SECONDS * 1000)
}
