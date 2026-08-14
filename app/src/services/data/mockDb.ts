import type { DashboardData, IncidentSummary, IncidentDetail } from '@/types'

export const dashboard: DashboardData = {
  updatedAgo: 'hace 3 min',
  metrics: [
    { label: 'Eventos activos', value: '3' },
    { label: 'Alerta roja', value: '1', color: 'var(--al-red)' },
    { label: 'Alerta amarilla', value: '2', color: 'var(--al-yellow-t)' },
    { label: 'Comunas afectadas', value: '7' },
  ],
  metrics2: [
    { label: 'Personas afectadas', value: '2.350' },
    { label: 'Voluntarios desplegados', value: '72' },
    { label: 'Filiales activadas', value: '6' },
  ],
  activeIncidents: [
    { id: 'i15', code: '2026-0015', title: 'Sistema frontal zona centro', eventType: 'Sistema frontal', status: 'active', alertSenapred: 'yellow', alertCruzRoja: 'yellow', comunas: ['Valparaíso', 'Viña del Mar', 'Quilpué', 'Villa Alemana', 'Limache'], startedAt: '08/08 14:00' },
    { id: 'i14', code: '2026-0014', title: 'Incendio sector Las Tablas', eventType: 'Incendio forestal', status: 'active', alertSenapred: 'red', alertCruzRoja: 'red', comunas: ['Viña del Mar', 'Quilpué'], startedAt: '07/08 11:20' },
    { id: 'i13', code: '2026-0013', title: 'Marejadas litoral', eventType: 'Marejada', status: 'active', alertSenapred: 'atp', alertCruzRoja: 'green', comunas: ['Valparaíso', 'Viña del Mar', 'Concón'], startedAt: '06/08 09:00' },
  ],
  comunasByAlert: [
    { name: 'Valparaíso', tone: 'red' },
    { name: 'Viña del Mar', tone: 'celeste' },
    { name: 'Quilpué', tone: 'yellow' },
    { name: 'Villa Alemana', tone: 'yellow' },
    { name: 'Concón', tone: 'green' },
    { name: 'Limache', tone: 'green' },
    { name: 'Quillota', tone: 'green' },
  ],
}

export const incidents: IncidentSummary[] = [
  { id: 'i15', code: '2026-0015', title: 'Sistema frontal zona centro', eventType: 'Sistema frontal', status: 'active', alertSenapred: 'yellow', alertCruzRoja: 'yellow', comunas: ['Valparaíso', 'Viña del Mar', 'Quilpué', 'Villa Alemana', 'Limache'], startedAt: '08/08 14:00' },
  { id: 'i14', code: '2026-0014', title: 'Incendio sector Las Tablas', eventType: 'Incendio forestal', status: 'active', alertSenapred: 'red', alertCruzRoja: 'red', comunas: ['Viña del Mar', 'Quilpué'], startedAt: '07/08 11:20' },
  { id: 'i13', code: '2026-0013', title: 'Marejadas litoral', eventType: 'Marejada', status: 'active', alertSenapred: 'atp', alertCruzRoja: 'green', comunas: ['Valparaíso', 'Viña del Mar', 'Concón'], startedAt: '06/08 09:00' },
  { id: 'i12', code: '2026-0012', title: 'Corte de agua Quilpué', eventType: 'Corte de agua', status: 'closed', alertSenapred: 'none', alertCruzRoja: 'green', comunas: ['Quilpué'], startedAt: '02/08 18:30' },
]

const detail15: IncidentDetail = {
  ...incidents[0],
  description:
    'Sistema frontal afecta la zona centro de la región con precipitaciones intensas y viento. SENAPRED declaró Alerta Amarilla para 5 comunas.',
  personasAfectadas: '2.350',
  voluntarios: 72,
  voluntariosPorFilial: [
    { filial: 'Valparaíso', n: 18 },
    { filial: 'Viña del Mar', n: 16 },
    { filial: 'Quilpué', n: 14 },
    { filial: 'Villa Alemana', n: 12 },
    { filial: 'Limache', n: 12 },
  ],
  timeline: [
    { at: '08/08 · 09:05', text: 'SENAPRED emite Alerta Temprana Preventiva.', source: 'SENAPRED' },
    { at: '08/08 · 10:15', text: 'DMC informa precipitaciones intensas.', source: 'DMC' },
    { at: '08/08 · 14:00', text: 'SENAPRED actualiza a Alerta Amarilla (5 comunas).', source: 'SENAPRED' },
    { at: '08/08 · 15:20', text: 'Cruz Roja activa 6 filiales.', source: 'Interno' },
  ],
  evidence: [
    { id: 'e1', kind: 'image', caption: 'Río Aconcagua', source: 'SENAPRED' },
    { id: 'e2', kind: 'pdf', caption: 'Comunicado N°12', source: 'SENAPRED' },
  ],
  sources: [
    { org: 'SENAPRED', title: 'Comunicado N°12', at: '14:00' },
    { org: 'DMC', title: 'Aviso meteorológico', at: '10:15' },
    { org: 'Esval', title: 'Corte de suministro', at: '15:40' },
  ],
}

export const details: Record<string, IncidentDetail> = {
  i15: detail15,
}
