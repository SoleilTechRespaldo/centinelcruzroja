// Contenido de ayuda/tutorial, centralizado. Lo usa HelpButton (panel por pantalla)
// y GuidePage (guía general). Editar aquí actualiza ambos. Texto sencillo, sin tecnicismos.

export interface HelpButtonDoc {
  label: string
  desc: string
}
export interface HelpTopic {
  title: string
  intro: string
  bullets?: string[]
  buttons?: HelpButtonDoc[]
}

// Ayuda por nombre de ruta (ver router). Las rutas sin entrada propia usan un alias.
export const helpByRoute: Record<string, HelpTopic> = {
  estadisticas: {
    title: 'Estadísticas',
    intro: 'Panel de situación de la región: cómo está todo ahora de un vistazo.',
    bullets: [
      'Tarjetas con los números actuales (incidentes, comunas en alerta, etc.).',
      'Tabla de incidentes activos: haz clic en una fila para abrir ese incidente.',
      'Comunas por alerta: el color indica el nivel.',
    ],
    buttons: [{ label: 'Actualizar', desc: 'Vuelve a cargar los números más recientes.' }],
  },
  incidents: {
    title: 'Incidentes',
    intro: 'El listado de eventos. Un "incidente" es el contenedor de todo lo que pasa en un evento (un incendio, un sistema frontal, un sismo…).',
    bullets: [
      'Cada incidente tiene código (ej. 2026-0014), tipo, comunas y nivel de alerta.',
      'Haz clic en uno para ver su detalle, sus fuentes y generar su BIE.',
      'Para hacer un BIE, primero necesitas un incidente.',
    ],
    buttons: [{ label: 'Nuevo incidente', desc: 'Crea un evento nuevo (tipo, comunas, alertas).' }],
  },
  bandeja: {
    title: 'Bandeja de indicios',
    intro: 'Aquí llega el material a revisar (por correo, webs oficiales, captura de redes o carga manual). Nada entra al BIE sin tu visto bueno.',
    bullets: [
      'Pestañas: Por verificar · Verificadas · Descartadas.',
      'La IA es una ayuda: sugiere resumen, tipo y comunas. Siempre la revisas tú.',
      'Las redes entran solo por captura humana (enlace + captura) y quedan fuera del BIE hasta tu visto bueno.',
    ],
    buttons: [
      { label: 'Revisar correo', desc: 'Lee ahora los buzones configurados (solo admin).' },
      { label: 'Revisar webs', desc: 'Lee ahora los feeds oficiales configurados (solo admin).' },
      { label: 'Capturar de redes', desc: 'Registra un post oficial: enlace + descripción (+ captura opcional).' },
      { label: 'ver', desc: 'Abre el detalle del indicio y el “Apoyo IA”.' },
      { label: 'Analizar con IA / Reanalizar', desc: 'Pide a la IA un resumen y clasificación. Dice “Reanalizar” si ya se hizo antes.' },
      { label: 'verificar', desc: 'Le das el visto bueno: eliges incidente, organismo y nota. Puede agregarse como fuente.' },
      { label: 'descartar', desc: 'Lo sacas de la bandeja (con motivo opcional) si no aplica.' },
    ],
  },
  bie: {
    title: 'Generar BIE',
    intro: 'El formulario del BIE / Monitoreo Regional. Se autollena desde el incidente y sus fuentes verificadas; tú ajustas y completas.',
    bullets: [
      'Secciones: datos oficiales, afectación, los 16 títulos, acciones Cruz Roja, necesidades y firma.',
      'N/A = no aplica a este evento · “En evaluación” = aplica pero aún sin dato. No inventar.',
      '“Elaborado por” eres tú; “Autorizado por” es fijo (Ive Manni).',
    ],
    buttons: [
      { label: 'Guardar borrador', desc: 'Guarda una versión en el sistema (queda en la lista de versiones).' },
      { label: 'Enviar a aprobación', desc: 'Guarda una versión para que un coordinador/admin la apruebe.' },
      { label: 'Aprobar', desc: 'Solo coordinador/admin: marca la versión como aprobada.' },
      { label: 'Ver completo', desc: 'Vista previa del BIE a página completa.' },
      { label: 'Word / PDF', desc: 'Descarga el BIE con el formato y logos oficiales.' },
    ],
  },
  expediente: {
    title: 'Expediente',
    intro: 'El archivo de un evento ya cerrado: su historia completa para aprender de él.',
    bullets: [
      'Resumen, métricas (duración, BIE emitidos, evidencias…), cronología y lecciones aprendidas.',
      'Sirve para revisar qué se hizo y qué mejorar la próxima vez.',
    ],
    buttons: [{ label: 'Exportar expediente', desc: 'Descarga el expediente completo del evento.' }],
  },
  map: {
    title: 'Mapa operativo',
    intro: 'Mapa de la región para ubicar afectaciones (incendios, inundaciones, cortes de agua/luz, albergues, etc.).',
    bullets: [
      'Cada punto es una afectación, con su tipo y color.',
      'Puedes ligar una afectación a un incidente.',
    ],
    buttons: [
      { label: 'Agregar afectación', desc: 'Actívalo y haz clic en el mapa para ubicar y describir el punto.' },
      { label: 'Capas', desc: 'Muestra u oculta afectaciones por tipo.' },
      { label: 'Ampliar', desc: 'Ve el mapa en pantalla grande.' },
    ],
  },
  cameras: {
    title: 'Cámaras en vivo',
    intro: 'Transmisiones públicas de YouTube por zona, como apoyo visual de lo que ocurre.',
    bullets: ['Son enlaces públicos; no se descargan ni se redistribuyen los videos.'],
    buttons: [{ label: 'Agregar cámara', desc: 'Pega un enlace público de YouTube de una zona.' }],
  },
  catalogs: {
    title: 'Catálogos',
    intro: 'Las listas maestras que alimentan los menús del sistema, para no dejarlas fijas en el código.',
    bullets: [
      'Comunas (las 38 + provincia), Tipos de evento y Fuentes (organismos oficiales).',
      'Ejemplo: al crear un incidente, las comunas y tipos salen de aquí.',
      'Las filiales de Cruz Roja no van aquí; se manejan por evento.',
    ],
    buttons: [
      { label: 'Agregar', desc: 'Añade un registro a la lista activa (solo admin).' },
      { label: 'activar / desactivar', desc: 'Habilita o deshabilita un registro sin borrarlo.' },
    ],
  },
  users: {
    title: 'Usuarios',
    intro: 'Alta de personas y su rol. No hay auto-registro: el administrador agrega a cada quien por correo.',
    bullets: [
      'Roles: Administrador, Coordinador, Operador y Consulta (solo lectura).',
      'Antes del uso real, reemplaza los usuarios de demo por personas reales.',
    ],
    buttons: [{ label: 'Agregar usuario', desc: 'Crea una persona con correo y rol (solo admin).' }],
  },
}

// Rutas que reutilizan la ayuda de otra (detalle/alta comparten la de la lista).
const aliases: Record<string, string> = {
  'incident-new': 'incidents',
  'incident-detail': 'incidents',
  'bie-preview': 'bie',
}

export function helpForRoute(routeName: string | null | undefined): HelpTopic | null {
  if (!routeName) return null
  const key = aliases[routeName] ?? routeName
  return helpByRoute[key] ?? null
}

// Orden en que se muestran las pantallas en la Guía general.
export const guideOrder: string[] = [
  'estadisticas',
  'incidents',
  'bandeja',
  'bie',
  'expediente',
  'map',
  'cameras',
  'catalogs',
  'users',
]

// Pasos del circuito completo (para la Guía general).
export const workflowSteps: { n: number; title: string; text: string }[] = [
  { n: 1, title: 'Crea o elige un Incidente', text: 'El contenedor del evento. Sin incidente no hay BIE.' },
  { n: 2, title: 'Llega material a la Bandeja', text: 'Por correo, webs, captura de redes o manual. La IA ayuda a resumir y clasificar.' },
  { n: 3, title: 'Revisa cada indicio', text: 'Verifica (visto bueno) y márcalo como fuente del incidente, o descártalo.' },
  { n: 4, title: 'Genera el BIE', text: 'Se autollena desde el incidente y sus fuentes. Ajustas y completas lo que falte.' },
  { n: 5, title: 'Aprobación', text: 'Guardas borrador o envías a aprobación; un coordinador/admin aprueba.' },
  { n: 6, title: 'Descarga', text: 'Word o PDF con el formato y logos oficiales.' },
  { n: 7, title: 'Expediente', text: 'Al cerrar el evento queda su archivo: cronología y lecciones aprendidas.' },
]
