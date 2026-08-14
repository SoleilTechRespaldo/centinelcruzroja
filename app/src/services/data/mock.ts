import type { DataService } from './DataService'
import type { DashboardData, IncidentSummary, IncidentDetail, BieDraft } from '@/types'
import { senapredBadge, cruzRojaBadge } from '@/utils/alerts'
import * as db from './mockDb'

// Pequeña latencia simulada para probar estados de carga
const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms))

const PENDIENTE = 'En evaluación'

// Los 16 títulos uniformes de la descripción del BIE (estructura del formato).
const TITULOS_BIE = [
  '1. Síntesis de la jornada',
  '2. Alerta vigente y novedad principal',
  '3. Situación meteorológica',
  '4. Balance regional',
  '5. Salud',
  '6. Viviendas',
  '7. Agua potable',
  '8. Situación eléctrica',
  '9. Rutas y conectividad',
  '10. Telecomunicaciones',
  '11. Hidrología',
  '12. Educación',
  '13. Emergencias por provincia y comuna',
  '14. Gobierno y coordinación',
  '15. Proyección',
  '16. Fuentes',
]

// Construye el borrador del BIE a partir de lo que se conoce del incidente.
// Lo que aún no está en el modelo del incidente queda "En evaluación" (el
// operador lo completa). Esta lógica la reemplazará el backend (autollenado real).
function buildBieDraft(summary: IncidentSummary, detail?: IncidentDetail): BieDraft {
  const corr = Number(summary.code.split('-')[1] ?? '0')
  const filialNames = detail?.voluntariosPorFilial.map((f) => f.filial) ?? []
  const accionar = detail?.timeline.filter((t) => t.source === 'Interno').map((t) => t.text).join(' ')
  const reporteFilial = detail?.voluntariosPorFilial.map((f) => `${f.filial}: ${f.n} voluntarios`).join('\n')
  const lastAt = detail?.timeline.at(-1)?.at ?? summary.startedAt

  return {
    incidentId: summary.id,
    incidentCode: summary.code,
    incidentTitle: summary.title,
    datos: {
      nbie: String(corr),
      tipo: summary.eventType,
      fechaEvento: summary.startedAt,
      fechaReporte: lastAt,
      senapred: senapredBadge(summary.alertSenapred).label,
      cruzRoja: cruzRojaBadge(summary.alertCruzRoja).label.toUpperCase(),
    },
    afectacion: {
      Afectados: detail?.personasAfectadas ?? PENDIENTE,
      Comunas: String(summary.comunas.length),
      Viviendas: PENDIENTE,
      Heridos: PENDIENTE,
      Desplazados: PENDIENTE,
      Fallecidos: PENDIENTE,
      Damnificados: PENDIENTE,
      Albergues: PENDIENTE,
      Albergados: PENDIENTE,
      Agua: PENDIENTE,
      'Eléctrico': PENDIENTE,
      Rutas: PENDIENTE,
      Hospitales: PENDIENTE,
      Aeropuerto: 'N/A',
      Otras: PENDIENTE,
    },
    titulos: TITULOS_BIE,
    cruzRoja: {
      filiales: filialNames.length ? filialNames.join(', ') : PENDIENTE,
      voluntarios: detail ? String(detail.voluntarios) : PENDIENTE,
      accionar: accionar ? accionar : PENDIENTE,
      reporteFilial: reporteFilial ? reporteFilial : PENDIENTE,
    },
    necesidades: {
      'Gestión': PENDIENTE,
      Salud: PENDIENTE,
      Voluntariado: PENDIENTE,
      'Logística': PENDIENTE,
      Albergues: PENDIENTE,
    },
    cierre: {
      sala: 'Activada',
      telecom: 'Sin activar',
      elaborado: '',
      autorizado: 'Ive Manni',
    },
    fuentes: detail ? [...new Set(detail.sources.map((s) => s.org))] : [],
  }
}

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
    const summary = db.incidents.find((i) => i.id === incidentId)
    if (!summary) return undefined
    return buildBieDraft(summary, db.details[incidentId])
  }
}
