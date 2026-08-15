import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp, writeFile, readFile, rm, access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { buildBieDocx } from './bieDocx'

// Convierte el BIE a PDF conservando logos y formato del maestro. Estrategia $0 y
// multiplataforma: 1) LibreOffice headless si está disponible (ideal para producción
// en cualquier SO); 2) Word COM en Windows (equipo del usuario hoy). Si no hay ninguno,
// lanza PdfUnavailableError y la app ofrece descargar el .docx.

const execFileP = promisify(execFile)

export class PdfUnavailableError extends Error {
  constructor() {
    super('El servidor no tiene conversor de PDF. Instala LibreOffice (soffice) o Microsoft Word.')
    this.name = 'PdfUnavailableError'
  }
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p, constants.F_OK)
    return true
  } catch {
    return false
  }
}

// Candidatos de LibreOffice: variable de entorno, PATH y rutas típicas por SO.
const SOFFICE_CANDIDATES = [
  process.env.SOFFICE_PATH,
  'soffice',
  'libreoffice',
  'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
  'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
  '/usr/bin/soffice',
  '/usr/bin/libreoffice',
  '/opt/libreoffice/program/soffice',
  '/Applications/LibreOffice.app/Contents/MacOS/soffice',
].filter((x): x is string => Boolean(x))

async function findSoffice(): Promise<string | null> {
  for (const bin of SOFFICE_CANDIDATES) {
    try {
      await execFileP(bin, ['--version'], { timeout: 8000 })
      return bin
    } catch {
      /* siguiente candidato */
    }
  }
  return null
}

async function convertWithLibreOffice(docx: Buffer): Promise<Buffer | null> {
  const bin = await findSoffice()
  if (!bin) return null
  const dir = await mkdtemp(join(tmpdir(), 'bie-pdf-'))
  try {
    const src = join(dir, 'bie.docx')
    const profile = join(dir, 'profile')
    await writeFile(src, docx)
    // Perfil aislado: permite conversiones concurrentes y no choca con una instancia abierta.
    await execFileP(
      bin,
      ['--headless', `-env:UserInstallation=${pathToFileURL(profile).href}`, '--convert-to', 'pdf', '--outdir', dir, src],
      { timeout: 90000 },
    )
    const pdf = join(dir, 'bie.pdf')
    return (await exists(pdf)) ? await readFile(pdf) : null
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

async function convertWithWord(docx: Buffer): Promise<Buffer | null> {
  if (process.platform !== 'win32') return null
  const dir = await mkdtemp(join(tmpdir(), 'bie-pdf-'))
  const src = join(dir, 'bie.docx')
  const dst = join(dir, 'bie.pdf')
  const q = (p: string) => p.replace(/'/g, "''") // escapa comilla simple para PowerShell
  const script = [
    "$ErrorActionPreference='Stop'",
    `$src='${q(src)}'`,
    `$dst='${q(dst)}'`,
    '$word=New-Object -ComObject Word.Application',
    '$word.Visible=$false',
    '$word.DisplayAlerts=0',
    'try{',
    '  $doc=$word.Documents.Open($src,$false,$true)',
    '  $doc.SaveAs([ref]$dst,[ref]17)', // 17 = wdFormatPDF
    '  $doc.Close($false)',
    '}finally{ $word.Quit() }',
  ].join('\n')
  try {
    await writeFile(src, docx)
    await execFileP('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script], {
      timeout: 90000,
    })
    return (await exists(dst)) ? await readFile(dst) : null
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

export async function buildBiePdf(draft: unknown): Promise<Buffer> {
  const docx = await buildBieDocx(draft as Parameters<typeof buildBieDocx>[0])
  const viaLo = await convertWithLibreOffice(docx)
  if (viaLo) return viaLo
  const viaWord = await convertWithWord(docx)
  if (viaWord) return viaWord
  throw new PdfUnavailableError()
}
