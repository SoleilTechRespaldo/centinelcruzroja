import type { DataService } from './DataService'
import type { DashboardData, IncidentSummary, IncidentDetail, BieDraft, NewIncidentInput } from '@/types'
import { api, ApiError } from '@/services/api'
import { buildBieDraft } from './bieDraft'

// Implementación real: consume el backend Hono. El JWT lo agrega la capa `api`.
export class ApiDataService implements DataService {
  getDashboard(): Promise<DashboardData> {
    return api.get<DashboardData>('/dashboard')
  }

  async listIncidents(): Promise<IncidentSummary[]> {
    const res = await api.get<{ items: IncidentSummary[] }>('/incidents')
    return res.items
  }

  async getIncident(id: string): Promise<IncidentDetail | undefined> {
    try {
      return await api.get<IncidentDetail>(`/incidents/${id}`)
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return undefined
      throw e
    }
  }

  async getBieDraft(incidentId: string): Promise<BieDraft | undefined> {
    const detail = await this.getIncident(incidentId)
    return detail ? buildBieDraft(detail) : undefined
  }

  createIncident(input: NewIncidentInput): Promise<{ id: string; code: string }> {
    return api.post<{ id: string; code: string }>('/incidents', input)
  }
}
