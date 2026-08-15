import type { AlertSenapred, AlertCruzRoja, AlertTone, IncidentStatus } from '@/types'

export function senapredBadge(a: AlertSenapred): { label: string; tone: AlertTone } {
  switch (a) {
    case 'none':
      return { label: 'Sin alerta', tone: 'gray' }
    case 'atp':
      return { label: 'Preventiva', tone: 'celeste' }
    case 'yellow':
      return { label: 'Amarilla', tone: 'yellow' }
    case 'red':
      return { label: 'Roja', tone: 'red' }
  }
}

export function cruzRojaBadge(a: AlertCruzRoja): { label: string; tone: AlertTone } {
  switch (a) {
    case 'green':
      return { label: 'Verde', tone: 'green' }
    case 'yellow':
      return { label: 'Amarilla', tone: 'yellow' }
    case 'red':
      return { label: 'Roja', tone: 'red' }
  }
}

export function statusLabel(s: IncidentStatus): string {
  switch (s) {
    case 'monitoring':
      return 'Monitoreo'
    case 'active':
      return 'Activo'
    case 'closed':
      return 'Cerrado'
  }
}
