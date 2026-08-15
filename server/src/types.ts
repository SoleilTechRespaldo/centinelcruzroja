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
