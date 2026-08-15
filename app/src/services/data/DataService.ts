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

// Contrato de acceso a datos. Implementaciones: ApiDataService (backend real) y
// MockDataService (fallback). Las pantallas hablan con esta interfaz.
export interface DataService {
  getDashboard(): Promise<DashboardData>
  listIncidents(): Promise<IncidentSummary[]>
  getIncident(id: string): Promise<IncidentDetail | undefined>
  getBieDraft(incidentId: string): Promise<BieDraft | undefined>
  createIncident(input: NewIncidentInput): Promise<{ id: string; code: string }>
  addEvidence(incidentId: string, input: EvidenceInput): Promise<{ id: string }>
  addReport(incidentId: string, input: ReportInput): Promise<{ id: string }>
  updateIncident(incidentId: string, patch: UpdateIncidentInput): Promise<{ id: string }>
  addTimelineEvent(incidentId: string, input: TimelineInput): Promise<{ id: string }>
  addSource(incidentId: string, input: SourceInput): Promise<{ id: string }>
}
