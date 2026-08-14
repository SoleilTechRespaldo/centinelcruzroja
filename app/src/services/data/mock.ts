import type { DataService } from './DataService'
import type { DashboardData, IncidentSummary, IncidentDetail, BieDraft, NewIncidentInput } from '@/types'
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
      id, code, title: input.title, eventType: input.eventType,
      status: input.status, alertSenapred: input.alertSenapred, alertCruzRoja: input.alertCruzRoja,
      comunas: input.comunas, startedAt: input.startedAt,
    })
    return { id, code }
  }
}
