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
  comunasCount: number
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
  kind: 'image' | 'pdf' | 'screenshot' | 'doc'
  caption: string
  source: string
}

export interface SourceItem {
  org: string
  title: string
  at: string
}

export interface IncidentDetail extends IncidentSummary {
  description: string
  comunas: string[]
  personasAfectadas: string
  voluntarios: number
  voluntariosPorFilial: { filial: string; n: number }[]
  timeline: TimelineItem[]
  evidence: EvidenceItem[]
  sources: SourceItem[]
}
