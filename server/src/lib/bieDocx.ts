import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx'

// Genera el .docx del BIE a partir de los datos del borrador (los que muestra/edita
// la pantalla). No es la plantilla oficial con logos (eso se hará con docxtemplater
// sobre el master cuando esté disponible), pero es un documento real y estructurado.
type Draft = {
  incidentCode?: string
  incidentTitle?: string
  datos?: Record<string, string>
  afectacion?: Record<string, string>
  titulos?: string[]
  cruzRoja?: Record<string, string>
  necesidades?: Record<string, string>
  cierre?: Record<string, string>
  fuentes?: string[]
}

const GRAFITO = '1E222B'
const ROJO = 'E30613'
const GRIS = '5B6472'

function sectionTitle(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, color: GRAFITO, size: 22 })],
  })
}

function kv(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({ width: { size: 34, type: WidthType.PERCENTAGE }, shading: { fill: 'F3F4F6' }, children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20 })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: value || '—', size: 20 })] })] }),
    ],
  })
}

function recordTable(rec: Record<string, string>): Table {
  const entries = Object.entries(rec)
  const rows = entries.length ? entries.map(([k, v]) => kv(k, v)) : [kv('—', '')]
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows })
}

export async function buildBieDocx(d: Draft): Promise<Buffer> {
  const datos = d.datos ?? {}
  const cierre = d.cierre ?? {}
  const cr = d.cruzRoja ?? {}
  const children: (Paragraph | Table)[] = []

  // Encabezado
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'CRUZ ROJA CHILENA', bold: true, color: ROJO, size: 26 })] }))
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Comité Regional Valparaíso', size: 18, color: GRIS })] }))
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80 }, children: [new TextRun({ text: 'Boletín de Información de Emergencia (BIE) — Monitoreo Regional', bold: true, size: 24 })] }))
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `N°${datos.nbie ?? ''} · ${datos.tipo ?? ''} · Región de Valparaíso · ${datos.fechaReporte ?? ''}`, size: 18, color: GRIS })] }))
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 120 }, children: [new TextRun({ text: 'BORRADOR · APOYO, NO OFICIAL', bold: true, color: ROJO, size: 16 })] }))

  // 1. Datos generales
  children.push(sectionTitle('1. Datos generales'))
  children.push(recordTable({
    'Tipo de emergencia': datos.tipo ?? '',
    Evento: `${datos.tipo ?? ''} — ${d.incidentTitle ?? ''}`,
    'Fecha y hora del evento': datos.fechaEvento ?? '',
    'Fecha y hora del reporte': datos.fechaReporte ?? '',
    'Alerta SENAPRED': datos.senapred ?? '',
    'Alerta Cruz Roja': datos.cruzRoja ?? '',
  }))

  // 2. Afectación
  children.push(sectionTitle('2. Afectación'))
  children.push(recordTable(d.afectacion ?? {}))

  // 3. Descripción (16 títulos)
  children.push(sectionTitle('3. Descripción'))
  for (const t of d.titulos ?? []) {
    children.push(new Paragraph({ spacing: { before: 60 }, children: [new TextRun({ text: t, bold: true, size: 20 })] }))
  }

  // 4. Cruz Roja
  children.push(sectionTitle('4. Filiales y voluntariado'))
  children.push(new Paragraph({ children: [new TextRun({ text: 'Filiales: ', bold: true, size: 20 }), new TextRun({ text: cr.filiales ?? '', size: 20 }), new TextRun({ text: '    Voluntarios: ', bold: true, size: 20 }), new TextRun({ text: cr.voluntarios ?? '', size: 20 })] }))
  children.push(new Paragraph({ spacing: { before: 60 }, children: [new TextRun({ text: 'Accionar: ', bold: true, size: 20 }), new TextRun({ text: cr.accionar ?? '', size: 20 })] }))
  for (const line of (cr.reporteFilial ?? '').split('\n')) {
    if (line.trim()) children.push(new Paragraph({ children: [new TextRun({ text: line, size: 20 })] }))
  }

  // 5. Necesidades
  children.push(sectionTitle('5. Necesidades internas'))
  children.push(recordTable(d.necesidades ?? {}))

  // 6. Fuentes
  children.push(sectionTitle('6. Fuentes consultadas'))
  children.push(new Paragraph({ children: [new TextRun({ text: (d.fuentes ?? []).join(', ') || '—', size: 20 })] }))

  // Firma
  children.push(new Paragraph({ spacing: { before: 260 }, children: [new TextRun({ text: `Sala de crisis: ${cierre.sala ?? ''}    ·    Telecomunicaciones: ${cierre.telecom ?? ''}`, size: 18, color: GRIS })] }))
  children.push(new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: `Elaborado por: ${cierre.elaborado ?? ''}`, bold: true, size: 20 })] }))
  children.push(new Paragraph({ children: [new TextRun({ text: `Autorizado por: ${cierre.autorizado ?? ''}`, bold: true, size: 20 })] }))

  const doc = new Document({ sections: [{ children }] })
  return Packer.toBuffer(doc)
}
