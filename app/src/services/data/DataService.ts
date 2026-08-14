import type { DashboardData, IncidentSummary, IncidentDetail, BieDraft, NewIncidentInput } from '@/types'

// Contrato de acceso a datos. Implementaciones: ApiDataService (backend real) y
// MockDataService (fallback). Las pantallas hablan con esta interfaz.
export interface DataService {
  getDashboard(): Promise<DashboardData>
  listIncidents(): Promise<IncidentSummary[]>
  getIncident(id: string): Promise<IncidentDetail | undefined>
  getBieDraft(incidentId: string): Promise<BieDraft | undefined>
  createIncident(input: NewIncidentInput): Promise<{ id: string; code: string }>
}
