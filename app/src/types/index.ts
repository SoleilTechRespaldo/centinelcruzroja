// Tipos del dominio (contrato) — alineado con el ERD (docs/05-BASE-DE-DATOS.md)

export type AlertSenapred = 'none' | 'atp' | 'yellow' | 'red'
export type AlertCruzRoja = 'green' | 'yellow' | 'red'
export type IncidentStatus = 'monitoring' | 'active' | 'closed'
export type AlertTone = 'green' | 'celeste' | 'yellow' | 'red' | 'gray'
export type Role = 'admin' | 'coordinator' | 'operator' | 'consulta'

export interface Metric {
  label: string
  value: string
  color?: string
}

export interface IncidentSummary {
  id: string
  code: string
  title: string
  eventType: string
  status: IncidentStatus
  alertSenapred: AlertSenapred
  alertCruzRoja: AlertCruzRoja
  comunas: string[] // nombres de las comunas dentro de la alerta (el conteo = comunas.length)
  startedAt: string
}

export interface ComunaAlert {
  name: string
  tone: AlertTone
}

export interface DashboardData {
  updatedAgo: string
  metrics: Metric[]
  metrics2: Metric[]
  activeIncidents: IncidentSummary[]
  comunasByAlert: ComunaAlert[]
}

export interface TimelineItem {
  at: string
  text: string
  source?: string
}

export interface EvidenceItem {
  id: string
  kind: 'image' | 'pdf' | 'screenshot' | 'doc' | 'link'
  caption: string
  source: string
  at?: string
  url?: string
  fileName?: string
  hasFile?: boolean
}

export interface SourceItem {
  org: string
  title: string
  at: string
}

export interface IncidentDetail extends IncidentSummary {
  description: string
  personasAfectadas: string
  voluntarios: number
  voluntariosPorFilial: { filial: string; n: number }[]
  timeline: TimelineItem[]
  evidence: EvidenceItem[]
  sources: SourceItem[]
}

// Borrador del BIE autollenado desde un incidente y sus fuentes. Es el contrato
// que hoy sirve el mock y que mañana llenará el backend (autollenado + RF-20).
export interface BieDraft {
  incidentId: string
  incidentCode: string
  incidentTitle: string
  datos: {
    nbie: string
    tipo: string
    fechaEvento: string
    fechaReporte: string
    senapred: string
    cruzRoja: string
    magnitud: string
    intensidad: string
  }
  afectacion: Record<string, string>
  descripcion: { titulo: string; texto: string }[]
  cruzRoja: {
    filiales: string
    voluntarios: string
    actividades: string
    gestion: string
    salud: string
    comunicacion: string
    proteccion: string
    reporteFilial: string
  }
  necesidades: Record<string, string>
  cierre: {
    sala: string
    telecom: string
    elaborado: string
    autorizado: string
    monitoreoEquipo: string
  }
  fuentes: string[]
}

// Entrada para crear un incidente (valores ya mapeados a los enums del dominio).
export interface NewIncidentInput {
  title: string
  eventType: string
  startedAt: string
  status: IncidentStatus
  alertSenapred: AlertSenapred
  alertCruzRoja: AlertCruzRoja
  comunas: string[]
  description: string
}

// Entrada para capturar evidencia con procedencia.
export interface EvidenceInput {
  kind: EvidenceItem['kind']
  caption: string
  source: string
  at: string
  url?: string
  fileName?: string
}

// Nuevo reporte de situación (historial).
export interface ReportInput {
  personasAfectadas: number
  voluntarios: number
}

// Editar incidente (parcial); "cerrar" = status: 'closed'.
export interface UpdateIncidentInput {
  title?: string
  status?: IncidentStatus
  alertSenapred?: AlertSenapred
  alertCruzRoja?: AlertCruzRoja
  description?: string
  eventType?: string
  comunas?: string[]
}

export interface TimelineInput {
  happenedAt: string
  entryType: string
  description: string
}

export interface SourceInput {
  org: string
  title: string
  url?: string
}
