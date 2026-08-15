import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import PizZip from 'pizzip'
import { DOMParser, XMLSerializer } from '@xmldom/xmldom'

// Rellena el MAESTRO OFICIAL `assets/BIE FORMATO.docx` (conserva logos y formato).
// Porta la lógica del script de la skill: por cada celda-etiqueta de las tablas,
// escribe el valor en la celda de la derecha; la Descripción usa los 16 títulos y
// el bloque "ACCIONES DE CRUZ ROJA CHILENA" se agrega bajo su encabezado.

const MASTER_PATH = fileURLToPath(new URL('../../assets/BIE FORMATO.docx', import.meta.url))

type Draft = {
  incidentTitle?: string
  datos?: Record<string, string>
  afectacion?: Record<string, string>
  descripcion?: { titulo: string; texto: string }[]
  cruzRoja?: Record<string, string>
  necesidades?: Record<string, string>
  cierre?: Record<string, string>
  fuentes?: string[]
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type El = any

// Etiqueta (como aparece en el maestro) -> campo de datos.
const RAW_MAP: Record<string, string> = {
  'Tipo de Emergencia': 'tipo_emergencia',
  'Fecha del Evento': 'fecha_evento',
  'Hora del Evento': 'hora_evento',
  Evento: 'evento',
  'Nivel Alerta Cruz Roja': 'alerta_cruz_roja',
  'Nivel Alerta SENAPRED': 'alerta_senapred',
  'Fecha del Reporte': 'fecha_reporte',
  'Hora del Reporte': 'hora_reporte',
  'Magnitud (Richter)': 'magnitud',
  'Intensidad (Mercalli)': 'intensidad',
  'Afectación Territorial': 'afectacion_territorial',
  'N° Afectados total': 'afectados_total',
  'Cantidad de Comunas Afectadas': 'comunas_afectadas',
  'N° de viviendas afectadas': 'viviendas_afectadas',
  'Nº heridos': 'heridos',
  'Nº desplazados': 'desplazados',
  'Suministro Agua Potable': 'agua',
  'N° de albergues habilitados': 'albergues',
  'Nº de fallecidos': 'fallecidos',
  'Suministro eléctrico': 'electrico',
  'Afectación de aeropuerto': 'aeropuerto',
  'Rutas dañadas': 'rutas',
  'N° de personas albergados': 'personas_albergadas',
  'N° de Hospitales dañados': 'hospitales',
  'N° de personas damnificadas': 'damnificadas',
  'Otras afectaciones': 'otras_afectaciones',
  Filiales: 'filiales',
  'Nº de Voluntarios Trabajando': 'voluntarios',
  Actividades: 'actividades',
  'Gestión del Riesgo (indique participación en COGRID - Monitoreo - Reporte u otra actividad)': 'cr_gestion',
  'Salud (indique acciones de SMAPS - PPAA- WASH)': 'cr_salud',
  'Comunicación (Difusión de mensajes claves, Activación de campañas locales de donaciones en especies)': 'cr_comunicacion',
  'Protección (indique las actividades realizadas por las diferentes áreas de protección).': 'cr_proteccion',
  'Gestión del riesgo': 'nec_gestion',
  Salud: 'nec_salud',
  Voluntariado: 'nec_voluntariado',
  Logística: 'nec_logistica',
  Albergues: 'nec_albergues',
  'Monitoreo y recopilación de información': 'monitoreo_equipo',
  'Coordinación Sala de Crisis': 'sala_crisis',
  Telecomunicaciones: 'telecom',
  'Nº BIE': 'num_bie',
  'Elaborado por': 'elaborado_por',
}

const nkey = (s: string) => (s ?? '').toLowerCase().replace(/[°º.,\s]/g, '')

function splitDateTime(s: string): [string, string] {
  const m = (s ?? '').trim().match(/^(.*?)[\s·]+(\d{1,2}:\d{2})(?:\s*hrs\.?)?$/)
  return m ? [m[1].trim(), m[2]] : [s ?? '', '']
}

// Borrador de la app -> campos oficiales del maestro.
function draftToFields(d: Draft): Record<string, string> {
  const datos = d.datos ?? {},
    af = d.afectacion ?? {},
    cr = d.cruzRoja ?? {},
    nec = d.necesidades ?? {},
    cierre = d.cierre ?? {}
  const [fe, he] = splitDateTime(datos.fechaEvento ?? '')
  const [fr, hr] = splitDateTime(datos.fechaReporte ?? '')
  return {
    tipo_emergencia: datos.tipo ?? '',
    fecha_evento: fe,
    hora_evento: he,
    evento: d.incidentTitle ? `${datos.tipo ?? ''} — ${d.incidentTitle}` : (datos.tipo ?? ''),
    alerta_cruz_roja: datos.cruzRoja ?? '',
    alerta_senapred: datos.senapred ?? '',
    fecha_reporte: fr,
    hora_reporte: hr,
    magnitud: datos.magnitud ?? '',
    intensidad: datos.intensidad ?? '',
    afectacion_territorial: af.Comunas ? `${af.Comunas} comuna(s) de la región` : '',
    afectados_total: af.Afectados ?? '',
    comunas_afectadas: af.Comunas ?? '',
    viviendas_afectadas: af.Viviendas ?? '',
    heridos: af.Heridos ?? '',
    desplazados: af.Desplazados ?? '',
    agua: af.Agua ?? '',
    albergues: af.Albergues ?? '',
    fallecidos: af.Fallecidos ?? '',
    electrico: af['Eléctrico'] ?? '',
    aeropuerto: af.Aeropuerto ?? '',
    rutas: af.Rutas ?? '',
    personas_albergadas: af.Albergados ?? '',
    hospitales: af.Hospitales ?? '',
    damnificadas: af.Damnificados ?? '',
    otras_afectaciones: af.Otras ?? '',
    filiales: cr.filiales ?? '',
    voluntarios: cr.voluntarios ?? '',
    actividades: cr.actividades ?? cr.accionar ?? '',
    cr_gestion: cr.gestion ?? '',
    cr_salud: cr.salud ?? '',
    cr_comunicacion: cr.comunicacion ?? '',
    cr_proteccion: cr.proteccion ?? '',
    acciones_cr: cr.reporteFilial ?? '',
    nec_gestion: nec['Gestión'] ?? '',
    nec_salud: nec.Salud ?? '',
    nec_voluntariado: nec.Voluntariado ?? '',
    nec_logistica: nec['Logística'] ?? '',
    nec_albergues: nec.Albergues ?? '',
    sala_crisis: cierre.sala ?? '',
    telecom: cierre.telecom ?? '',
    num_bie: datos.nbie ?? '',
    elaborado_por: cierre.elaborado ?? '',
    monitoreo_equipo: cierre.monitoreoEquipo ?? '',
    descripcion_encabezado: `${datos.tipo ?? ''} | Región de Valparaíso | ${datos.fechaReporte ?? ''}`,
  }
}

// --- Helpers de árbol (equivalentes a los del script PowerShell) ---
const WNS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
const toArr = (nl: any): El[] => {
  const a: El[] = []
  for (let i = 0; i < nl.length; i++) a.push(nl[i])
  return a
}
const directChildren = (node: El, tag: string): El[] => toArr(node.childNodes).filter((n) => n.nodeType === 1 && n.nodeName === tag)
const tags = (node: El, tag: string): El[] => toArr(node.getElementsByTagName(tag))

function directText(tc: El): string {
  let s = ''
  for (const p of directChildren(tc, 'w:p')) for (const t of tags(p, 'w:t')) s += t.textContent ?? ''
  return s
}

function cellTemplates(tc: El): [El | null, El | null] {
  const firstP = directChildren(tc, 'w:p')[0]
  if (!firstP) return [null, null]
  const pPr = directChildren(firstP, 'w:pPr')[0] ?? null
  const r0 = directChildren(firstP, 'w:r')[0]
  let rPr = r0 ? (directChildren(r0, 'w:rPr')[0] ?? null) : null
  if (!rPr && pPr) rPr = directChildren(pPr, 'w:rPr')[0] ?? null
  return [pPr, rPr]
}

function makeParagraph(doc: El, pPrTpl: El | null, rPrTpl: El | null, text: string, bold: boolean): El {
  const p = doc.createElement('w:p')
  if (pPrTpl) p.appendChild(pPrTpl.cloneNode(true))
  const r = doc.createElement('w:r')
  let rPr = rPrTpl ? rPrTpl.cloneNode(true) : null
  if (bold) {
    if (!rPr) rPr = doc.createElement('w:rPr')
    if (!directChildren(rPr, 'w:b')[0]) rPr.insertBefore(doc.createElement('w:b'), rPr.firstChild)
  }
  if (rPr) r.appendChild(rPr)
  const t = doc.createElement('w:t')
  t.setAttribute('xml:space', 'preserve')
  t.appendChild(doc.createTextNode(text))
  r.appendChild(t)
  p.appendChild(r)
  return p
}

function clearParagraphs(tc: El): void {
  for (const p of directChildren(tc, 'w:p')) tc.removeChild(p)
}

function setCellText(doc: El, tc: El, text: string): void {
  const [pPr, rPr] = cellTemplates(tc)
  clearParagraphs(tc)
  for (const ln of String(text).replace(/\r/g, '').split('\n')) tc.appendChild(makeParagraph(doc, pPr, rPr, ln, false))
}

export async function buildBieDocx(d: Draft): Promise<Buffer> {
  const fields = draftToFields(d)
  const blocks = d.descripcion ?? []

  const zip = new PizZip(readFileSync(MASTER_PATH))
  const xml = zip.file('word/document.xml')?.asText() ?? ''
  const doc = new DOMParser().parseFromString(xml, 'text/xml') as unknown as El

  const map: Record<string, string> = {}
  for (const k of Object.keys(RAW_MAP)) map[nkey(k)] = RAW_MAP[k]

  // Pasada genérica: etiqueta -> celda a la derecha.
  for (const tbl of tags(doc, 'w:tbl')) {
    for (const tr of directChildren(tbl, 'w:tr')) {
      const cells = directChildren(tr, 'w:tc')
      for (let i = 0; i < cells.length; i++) {
        const field = map[nkey(directText(cells[i]))]
        if (field && i + 1 < cells.length) {
          const val = fields[field]
          if (val) setCellText(doc, cells[i + 1], val)
        }
      }
    }
  }

  // Especial: Descripción de la Emergencia (valor en la fila siguiente al encabezado).
  for (const tbl of tags(doc, 'w:tbl')) {
    const rows = directChildren(tbl, 'w:tr')
    if (rows.length < 2) continue
    const c0 = directChildren(rows[0], 'w:tc')[0]
    if (c0 && nkey(directText(c0)) === nkey('Descripción de la Emergencia')) {
      const tc = directChildren(rows[1], 'w:tc')[0]
      if (tc) {
        const [pPr, rPr] = cellTemplates(tc)
        clearParagraphs(tc)
        if (fields.descripcion_encabezado) tc.appendChild(makeParagraph(doc, pPr, rPr, fields.descripcion_encabezado, true))
        for (const b of blocks) {
          tc.appendChild(makeParagraph(doc, pPr, rPr, `${b.titulo}:`, true))
          for (const ln of String(b.texto).replace(/\r/g, '').split('\n')) tc.appendChild(makeParagraph(doc, pPr, rPr, ln, false))
          tc.appendChild(makeParagraph(doc, pPr, rPr, '', false))
        }
      }
    }
  }

  // Especial: ACCIONES DE CRUZ ROJA CHILENA (se agrega bajo el encabezado).
  if (fields.acciones_cr) {
    for (const tc of tags(doc, 'w:tc')) {
      if (nkey(directText(tc)) === nkey('ACCIONES DE CRUZ ROJA CHILENA')) {
        const [pPr, rPr] = cellTemplates(tc)
        tc.appendChild(makeParagraph(doc, pPr, rPr, '', false))
        for (const ln of String(fields.acciones_cr).replace(/\r/g, '').split('\n')) tc.appendChild(makeParagraph(doc, pPr, rPr, ln, false))
      }
    }
  }

  const out = new XMLSerializer().serializeToString(doc)
  zip.file('word/document.xml', out)
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' }) as Buffer
}

export { WNS }
