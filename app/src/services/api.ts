// Cliente HTTP del backend Centinela. La sesión viaja en una cookie HttpOnly que
// el navegador envía sola (credentials: 'include'); el JS nunca ve el token, así
// un XSS no puede robar la sesión (default de seguridad #9). Traduce los códigos
// de error del API a mensajes en español.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8787'

export class ApiError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

const MESSAGES: Record<string, string> = {
  credenciales_invalidas: 'Correo o contraseña incorrectos.',
  usuario_inactivo: 'Este usuario está desactivado.',
  no_autenticado: 'Tu sesión expiró. Ingresa de nuevo.',
  token_invalido_o_expirado: 'Tu sesión expiró. Ingresa de nuevo.',
  sin_permiso: 'No tienes permiso para esta acción.',
  email_ya_registrado: 'Ese correo ya está registrado.',
  no_encontrado: 'No encontrado.',
  no_puedes_cambiar_tu_propio_rol_o_estado: 'No puedes cambiar tu propio rol o estado.',
  sin_conexion: 'No se pudo conectar con el servidor. ¿Está corriendo el backend?',
  pdf_no_disponible: 'El servidor no puede generar PDF (falta LibreOffice o Word). Descarga el Word y conviértelo tú.',
  incidente_requerido: 'Para agregarlo como fuente, elige un incidente.',
  incidente_no_encontrado: 'El incidente elegido no existe.',
  correo_no_configurado: 'El correo aún no está configurado (IMAP_MAILBOXES en el servidor).',
  webs_no_configuradas: 'Las webs oficiales aún no están configuradas (WEB_SOURCES en el servidor).',
  ia_no_configurada: 'La IA no está activada. Se enciende con Ollama (gratis) o una API (AI_PROVIDER).',
  ia_sin_respuesta: 'La IA no devolvió un resultado utilizable. Inténtalo de nuevo.',
  demasiadas_solicitudes: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  archivo_muy_grande: 'El archivo supera el máximo permitido (15 MB).',
}

function errorFrom(status: number, text: string): ApiError {
  let code = 'error'
  try {
    code = (JSON.parse(text) as { error?: string })?.error ?? 'error'
  } catch {
    /* respuesta no-JSON */
  }
  return new ApiError(status, code, MESSAGES[code] ?? `Error del servidor (${status}).`)
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'sin_conexion', MESSAGES.sin_conexion)
  }
  const text = await res.text()
  if (!res.ok) throw errorFrom(res.status, text)
  return (text ? JSON.parse(text) : null) as T
}

// Igual que request(), pero devuelve el binario (ej. el .docx del BIE).
async function requestBlob(method: string, path: string, body?: unknown): Promise<Blob> {
  let res: Response
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'sin_conexion', MESSAGES.sin_conexion)
  }
  if (!res.ok) throw errorFrom(res.status, await res.text())
  return res.blob()
}

// Envía multipart/form-data (archivos). NO fija Content-Type: el navegador pone el boundary.
async function requestForm<T>(path: string, form: FormData): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}/api${path}`, { method: 'POST', credentials: 'include', body: form })
  } catch {
    throw new ApiError(0, 'sin_conexion', MESSAGES.sin_conexion)
  }
  const text = await res.text()
  if (!res.ok) throw errorFrom(res.status, text)
  return (text ? JSON.parse(text) : null) as T
}

// Descarga un binario con la sesión (cookie), ej. archivo de evidencia.
async function getBlob(path: string): Promise<Blob> {
  let res: Response
  try {
    res = await fetch(`${API_URL}/api${path}`, { credentials: 'include' })
  } catch {
    throw new ApiError(0, 'sin_conexion', MESSAGES.sin_conexion)
  }
  if (!res.ok) throw errorFrom(res.status, await res.text())
  return res.blob()
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
  postBlob: (path: string, body?: unknown) => requestBlob('POST', path, body),
  postForm: <T>(path: string, form: FormData) => requestForm<T>(path, form),
  getBlob: (path: string) => getBlob(path),
}
