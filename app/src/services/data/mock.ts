import type { DataService } from './DataService'
import type { DashboardData, IncidentSummary, IncidentDetail } from '@/types'
import * as db from './mockDb'

// Pequeña latencia simulada para probar estados de carga
const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms))

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
}
