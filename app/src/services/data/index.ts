import type { DataService } from './DataService'
import { MockDataService } from './mock'

let instance: DataService | null = null

function createDataService(): DataService {
  const source = import.meta.env.VITE_DATA_SOURCE ?? 'mock'
  // En la etapa backend: if (source === 'api') return new ApiDataService(import.meta.env.VITE_API_URL)
  void source
  return new MockDataService()
}

// Composable para usar el servicio de datos desde cualquier componente.
export function useData(): DataService {
  if (!instance) instance = createDataService()
  return instance
}

export type { DataService }
