import type { DataService } from './DataService'
import { ApiDataService } from './api'
import { MockDataService } from './mock'

let instance: DataService | null = null

function createDataService(): DataService {
  // Por defecto usa el backend real; `VITE_DATA_SOURCE=mock` fuerza el mock.
  const source = import.meta.env.VITE_DATA_SOURCE ?? 'api'
  return source === 'mock' ? new MockDataService() : new ApiDataService()
}

// Composable para usar el servicio de datos desde cualquier componente.
export function useData(): DataService {
  if (!instance) instance = createDataService()
  return instance
}

export type { DataService }
