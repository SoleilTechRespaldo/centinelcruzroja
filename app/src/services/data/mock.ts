import type { DataService } from './DataService'
import type {
  DashboardData,
  IncidentSummary,
  IncidentDetail,
  BieDraft,
  NewIncidentInput,
  EvidenceInput,
  ReportInput,
  UpdateIncidentInput,
  TimelineInput,
  SourceInput,
} from '@/types'
import * as db from './mockDb'
import { buildBieDraft } from './bieDraft'

// Pequeña latencia simulada para probar estados de carga.
const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms))

// Fallback sin backend (VITE_DATA_SOURCE=mock).
export class MockDataService implements DataService {
  async getDashboard(): Promise<DashboardData> {
    await delay()
    return db.dashboard
  }

  async listIncidents(): Promise<IncidentSummary[]> {
    await delay()
    return db.incidents
  }

  async getIncident(id: string): Promise<IncidentDetail | undefined> {
    await delay()
    return db.details[id]
  }

  async getBieDraft(incidentId: string): Promise<BieDraft | undefined> {
    await delay()
    const detail = db.details[incidentId]
    return detail ? buildBieDraft(detail) : undefined
  }

  async createIncident(input: NewIncidentInput): Promise<{ id: string; code: string }> {
    await delay()
    const maxSeq = db.incidents.reduce((m, i) => Math.max(m, Number(i.code.split('-')[1]) || 0), 0)
    const code = `2026-${String(maxSeq + 1).padStart(4, '0')}`
    const id = 'i' + (maxSeq + 1)
    db.incidents.unshift({
      id,
      code,
      title: input.title,
      eventType: input.eventType,
      status: input.status,
      alertSenapred: input.alertSenapred,
      alertCruzRoja: input.alertCruzRoja,
      comunas: input.comunas,
      startedAt: input.startedAt,
    })
    return { id, code }
  }

  async addEvidence(incidentId: string, input: EvidenceInput): Promise<{ id: string }> {
    await delay()
    const id = 'e' + db.incidents.length + Math.floor(performance.now())
    const detail = db.details[incidentId]
    if (detail) {
      detail.evidence.unshift({ id, kind: input.kind, caption: input.caption, source: input.source, at: input.at, url: input.url })
    }
    return { id }
  }

  async addReport(incidentId: string, input: ReportInput): Promise<{ id: string }> {
    await delay()
    const detail = db.details[incidentId]
    if (detail) {
      detail.personasAfectadas = input.personasAfectadas.toLocaleString('es-CL')
      detail.voluntarios = input.voluntarios
    }
    return { id: 'r' + Math.floor(performance.now()) }
  }

  async updateIncident(incidentId: string, patch: UpdateIncidentInput): Promise<{ id: string }> {
    await delay()
    const summary = db.incidents.find((i) => i.id === incidentId)
    const detail = db.details[incidentId]
    const apply = (t: IncidentSummary) => {
      if (patch.title !== undefined) t.title = patch.title
      if (patch.status !== undefined) t.status = patch.status
      if (patch.alertSenapred !== undefined) t.alertSenapred = patch.alertSenapred
      if (patch.alertCruzRoja !== undefined) t.alertCruzRoja = patch.alertCruzRoja
      if (patch.eventType !== undefined) t.eventType = patch.eventType
      if (patch.comunas !== undefined) t.comunas = patch.comunas
    }
    if (summary) apply(summary)
    if (detail) {
      apply(detail)
      if (patch.description !== undefined) detail.description = patch.description
    }
    return { id: incidentId }
  }

  async addTimelineEvent(incidentId: string, input: TimelineInput): Promise<{ id: string }> {
    await delay()
    const detail = db.details[incidentId]
    if (detail) detail.timeline.push({ at: input.happenedAt, text: input.description })
    return { id: 't' + Math.floor(performance.now()) }
  }

  async addSource(incidentId: string, input: SourceInput): Promise<{ id: string }> {
    await delay()
    const detail = db.details[incidentId]
    if (detail) detail.sources.unshift({ org: input.org, title: input.title, at: '' })
    return { id: 's' + Math.floor(performance.now()) }
  }
}
