import type { IncidentDetail, BieDraft } from '@/types'
import { senapredBadge, cruzRojaBadge } from '@/utils/alerts'

// Deriva el borrador del BIE desde un incidente (lo conocido se autollena; el resto
// queda "En evaluación"). Lo usan tanto el mock como el ApiDataService.
const PENDIENTE = 'En evaluación'

// Los 16 títulos uniformes de la Descripción, según el formato oficial del BIE.
const TITULOS_BIE = [
  '1. SÍNTESIS DE LA JORNADA',
  '2. ALERTA VIGENTE Y NOVEDAD PRINCIPAL',
  '3. ALERTAMIENTOS Y AVISOS',
  '4. BALANCE REGIONAL',
  '5. SALUD Y HOSPITALES',
  '6. ESTABLECIMIENTOS EDUCACIONALES',
  '7. VIVIENDAS AFECTADAS',
  '8. SITUACIÓN ELÉCTRICA',
  '9. AGUA POTABLE',
  '10. CONECTIVIDAD Y RUTAS',
  '11. TELECOMUNICACIONES',
  '12. HIDROLOGÍA Y CAUCES',
  '13. EMERGENCIAS POR PROVINCIA Y COMUNA',
  '14. ACCIONES MUNICIPALES Y DE GOBIERNO',
  '15. PROYECCIÓN DEL EVENTO',
  '16. FUENTES CONSULTADAS',
]

export function buildBieDraft(d: IncidentDetail): BieDraft {
  const corr = Number(d.code.split('-')[1] ?? '0')
  const filialNames = d.voluntariosPorFilial.map((f) => f.filial)
  const accionar = d.timeline.filter((t) => !t.source || t.source === 'Interno').map((t) => t.text).join(' ')
  const reporteFilial = d.voluntariosPorFilial.map((f) => `${f.filial}: ${f.n} voluntarios`).join('\n')
  const lastAt = d.timeline.at(-1)?.at ?? d.startedAt

  return {
    incidentId: d.id,
    incidentCode: d.code,
    incidentTitle: d.title,
    datos: {
      nbie: String(corr),
      tipo: d.eventType,
      fechaEvento: d.startedAt,
      fechaReporte: lastAt,
      senapred: senapredBadge(d.alertSenapred).label,
      cruzRoja: cruzRojaBadge(d.alertCruzRoja).label.toUpperCase(),
    },
    afectacion: {
      Afectados: d.personasAfectadas || PENDIENTE,
      Comunas: String(d.comunas.length),
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
      voluntarios: d.voluntarios ? String(d.voluntarios) : PENDIENTE,
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
    cierre: { sala: 'Activada', telecom: 'Sin activar', elaborado: '', autorizado: 'Ive Manni' },
    fuentes: [...new Set(d.sources.map((s) => s.org))],
  }
}
