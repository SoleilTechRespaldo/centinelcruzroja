import { z } from 'zod'

// Contrato del API — alineado con `app/src/types/index.ts` y el ERD
// (docs/05-BASE-DE-DATOS.md). El frontend consumirá estas formas cuando el
// ApiDataService reemplace al mock. Enums y validación viven aquí (fuente única).

export const senapredEnum = z.enum(['none', 'atp', 'yellow', 'red'])
export const cruzRojaEnum = z.enum(['green', 'yellow', 'red'])
export const incidentStatusEnum = z.enum(['monitoring', 'active', 'closed'])

export type AlertSenapred = z.infer<typeof senapredEnum>
export type AlertCruzRoja = z.infer<typeof cruzRojaEnum>
export type IncidentStatus = z.infer<typeof incidentStatusEnum>

export interface IncidentSummary {
  id: string
  code: string
  title: string
  eventType: string
  status: IncidentStatus
  alertSenapred: AlertSenapred
  alertCruzRoja: AlertCruzRoja
  comunasCount: number
  startedAt: string
}

// Entrada validada para crear un incidente (coincide con el formulario del app).
export const createIncidentSchema = z.object({
  title: z.string().trim().min(3, 'El título es muy corto').max(160),
  eventType: z.string().trim().min(1, 'Selecciona un tipo de evento'),
  startedAt: z.string().trim().min(1, 'Indica la fecha/hora de inicio'),
  status: incidentStatusEnum.default('monitoring'),
  alertSenapred: senapredEnum.default('none'),
  alertCruzRoja: cruzRojaEnum.default('green'),
  comunas: z.array(z.string().trim().min(1)).min(1, 'Selecciona al menos una comuna'),
  description: z.string().max(5000).optional().default(''),
})

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>

// Captura de evidencia con procedencia (archivo real a R2 en etapa posterior).
export const addEvidenceSchema = z.object({
  kind: z.enum(['image', 'pdf', 'screenshot', 'doc', 'link']),
  caption: z.string().trim().min(1),
  source: z.string().trim().min(1),
  at: z.string().trim().min(1),
  url: z.string().optional(),
  fileName: z.string().optional(),
})

export type AddEvidenceInput = z.infer<typeof addEvidenceSchema>

// Nuevo reporte de situación (append-only; historial para comparar).
export const addReportSchema = z.object({
  personasAfectadas: z.coerce.number().int().min(0),
  voluntarios: z.coerce.number().int().min(0),
})

export type AddReportInput = z.infer<typeof addReportSchema>

// Editar incidente (parcial). "Cerrar" = status: 'closed'.
export const updateIncidentSchema = z
  .object({
    title: z.string().trim().min(3).optional(),
    status: incidentStatusEnum.optional(),
    alertSenapred: senapredEnum.optional(),
    alertCruzRoja: cruzRojaEnum.optional(),
    description: z.string().max(5000).optional(),
    eventType: z.string().optional(),
    comunas: z.array(z.string()).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Nada que actualizar')

export type UpdateIncidentInput = z.infer<typeof updateIncidentSchema>

// Agregar hito a la cronología (append-only).
export const addTimelineSchema = z.object({
  happenedAt: z.string().trim().min(1),
  entryType: z.enum(['alert_change', 'source', 'note', 'action']).default('note'),
  description: z.string().trim().min(1),
})
export type AddTimelineInput = z.infer<typeof addTimelineSchema>

// Registrar una fuente (procedencia).
export const addSourceSchema = z.object({
  org: z.string().trim().min(1),
  title: z.string().trim().min(1),
  url: z.string().optional(),
})
export type AddSourceInput = z.infer<typeof addSourceSchema>

// --- Indicios (bandeja de ingesta) ---
// Alta manual: captura legal de redes o un indicio a mano. Los canales
// automáticos (correo/web) insertan directo, sin pasar por este esquema.
export const createIndicioSchema = z.object({
  channel: z.enum(['manual', 'redes']).default('manual'),
  title: z.string().trim().min(1, 'Falta el título'),
  content: z.string().optional(),
  url: z.string().optional(),
  sender: z.string().optional(), // perfil oficial (redes) o remitente
  sourceOrg: z.string().optional(), // nombre del organismo (se resuelve a id)
  isOfficial: z.boolean().optional(),
  incidentId: z.string().optional(),
  occurredAt: z.string().optional(),
})
export type CreateIndicioInput = z.infer<typeof createIndicioSchema>

// Dar el visto bueno: verifica y (por defecto) lo promueve a fuente del incidente.
export const verifyIndicioSchema = z.object({
  incidentId: z.string().optional(),
  promote: z.boolean().default(true),
  sourceOrg: z.string().optional(),
  note: z.string().optional(),
})
export type VerifyIndicioInput = z.infer<typeof verifyIndicioSchema>

export const discardIndicioSchema = z.object({
  note: z.string().optional(),
})
export type DiscardIndicioInput = z.infer<typeof discardIndicioSchema>

// --- Afectaciones del mapa operativo (RF-28a) ---
export const markerTypeSchema = z.enum([
  'deslizamiento',
  'socavon',
  'corte_agua',
  'corte_luz',
  'corte_redes',
  'incendio',
  'inundacion',
  'ruta_cortada',
  'albergue',
  'otro',
])
export type MarkerType = z.infer<typeof markerTypeSchema>

export const createMarkerSchema = z.object({
  type: markerTypeSchema,
  title: z.string().trim().min(1, 'Falta el título'),
  description: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  incidentId: z.string().optional(),
})
export type CreateMarkerInput = z.infer<typeof createMarkerSchema>
