import type { DashboardData, IncidentSummary, IncidentDetail, BieDraft } from '@/types'

// Contrato de acceso a datos. Implementaciones: MockDataService (ahora) y
// ApiDataService (etapa backend Hono/Turso). Las pantallas hablan con esta interfaz.
export interface DataService {
  getDashboard(): Promise<DashboardData>
  listIncidents(): Promise<IncidentSummary[]>
  getIncident(id: string): Promise<IncidentDetail | undefined>
  // Autollenado del BIE desde el incidente (mock ahora; backend/RF-20 después).
  getBieDraft(incidentId: string): Promise<BieDraft | undefined>
}
