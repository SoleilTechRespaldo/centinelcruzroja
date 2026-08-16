import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import { z } from 'zod'
import { db, schema } from '../db/client'
import { env } from '../env'
import { ingestIndicio, type IndicioAttachment } from '../services/indicios'

// Canal de ingesta por correo (RF-26). Lee buzones IMAP (solo lectura), convierte
// cada correo nuevo en un indicio "por verificar" y deduplica por Message-ID.
// Sin buzones configurados (IMAP_MAILBOXES vacío) el canal queda desactivado.

const mailboxSchema = z.object({
  host: z.string().min(1),
  port: z.coerce.number().int().positive().default(993),
  user: z.string().min(1),
  password: z.string().min(1),
  label: z.string().default('Correo'),
  sinceDays: z.coerce.number().int().positive().default(3),
})
export type MailboxConfig = z.infer<typeof mailboxSchema>

export function parseMailboxConfig(raw: string): MailboxConfig[] {
  if (!raw.trim()) return []
  try {
    return z.array(mailboxSchema).parse(JSON.parse(raw))
  } catch (e) {
    console.error('[ingesta-correo] IMAP_MAILBOXES inválido (se ignora):', (e as Error).message)
    return []
  }
}

export interface ParsedEmail {
  channel: 'correo'
  title: string
  content: string
  sender: string
  externalRef: string | null
  occurredAt: number | null
  isOfficial: boolean
  attachment: IndicioAttachment | null
}

// Convierte el RFC822 crudo de un correo en los campos de un indicio. Puro y testeable.
export async function parseEmailToIndicio(raw: string | Buffer): Promise<ParsedEmail> {
  const mail = await simpleParser(raw)
  const title = (mail.subject ?? '(sin asunto)').trim() || '(sin asunto)'
  const sender = mail.from?.text ?? ''
  const body = (mail.text ?? (typeof mail.html === 'string' ? mail.html : '') ?? '').toString()
  // Primer adjunto real (ej. el PDF oficial de la alerta).
  const att = (mail.attachments ?? []).find((a) => a.content && !a.related) ?? mail.attachments?.[0]
  const attachment: IndicioAttachment | null =
    att?.content != null
      ? { bytes: new Uint8Array(att.content), fileName: att.filename ?? 'adjunto', mimeType: att.contentType ?? 'application/octet-stream' }
      : null
  return {
    channel: 'correo',
    title,
    content: body.slice(0, 5000),
    sender,
    externalRef: mail.messageId ?? null,
    occurredAt: mail.date ? Math.floor(mail.date.getTime() / 1000) : null,
    isOfficial: true,
    attachment,
  }
}

// Intenta asociar el correo a un organismo conocido por su nombre/slug en el texto.
async function resolveOrgFromText(text: string): Promise<string | null> {
  const t = text.toLowerCase()
  const orgs = await db
    .select({ id: schema.sourceOrgs.id, name: schema.sourceOrgs.name, slug: schema.sourceOrgs.slug })
    .from(schema.sourceOrgs)
  const hit = orgs.find((o) => t.includes(o.name.toLowerCase()) || (o.slug && t.includes(o.slug.toLowerCase())))
  return hit?.id ?? null
}

export interface PollResult {
  fetched: number
  created: number
  deduped: number
}

// Revisa un buzón y crea indicios para los correos recientes (últimos `sinceDays`).
export async function pollMailbox(cfg: MailboxConfig): Promise<PollResult> {
  const client = new ImapFlow({
    host: cfg.host,
    port: cfg.port,
    secure: true,
    auth: { user: cfg.user, pass: cfg.password },
    logger: false,
  })
  const result: PollResult = { fetched: 0, created: 0, deduped: 0 }
  await client.connect()
  try {
    const lock = await client.getMailboxLock('INBOX')
    try {
      const since = new Date(Date.now() - cfg.sinceDays * 86400 * 1000)
      for await (const msg of client.fetch({ since }, { source: true })) {
        if (!msg.source) continue
        result.fetched++
        const parsed = await parseEmailToIndicio(msg.source)
        const orgId = await resolveOrgFromText(`${parsed.sender} ${parsed.title}`)
        const res = await ingestIndicio({ ...parsed, sourceOrgId: orgId })
        if (res.deduped) result.deduped++
        else result.created++
      }
    } finally {
      lock.release()
    }
  } finally {
    await client.logout()
  }
  return result
}

// Una pasada por todos los buzones configurados (para el botón/prueba manual).
export async function runEmailIngestionOnce(): Promise<{ mailboxes: number; created: number; deduped: number; fetched: number }> {
  const cfgs = parseMailboxConfig(env.IMAP_MAILBOXES)
  const agg = { mailboxes: cfgs.length, created: 0, deduped: 0, fetched: 0 }
  for (const cfg of cfgs) {
    const r = await pollMailbox(cfg)
    agg.created += r.created
    agg.deduped += r.deduped
    agg.fetched += r.fetched
  }
  return agg
}

// Arranca el sondeo periódico (llamado desde server.ts). No hace nada si no hay buzones.
export function startEmailIngestion(): void {
  const cfgs = parseMailboxConfig(env.IMAP_MAILBOXES)
  if (!cfgs.length) {
    console.log('[ingesta-correo] sin buzones (IMAP_MAILBOXES vacío) — canal desactivado')
    return
  }
  console.log(`[ingesta-correo] ${cfgs.length} buzón(es), sondeo cada ${env.IMAP_POLL_SECONDS}s`)
  const runAll = async () => {
    for (const cfg of cfgs) {
      try {
        const r = await pollMailbox(cfg)
        if (r.created) console.log(`[ingesta-correo] ${cfg.label}: ${r.created} nuevo(s), ${r.deduped} repetido(s)`)
      } catch (e) {
        console.error(`[ingesta-correo] ${cfg.label} falló:`, (e as Error).message)
      }
    }
  }
  void runAll()
  setInterval(() => void runAll(), env.IMAP_POLL_SECONDS * 1000)
}
