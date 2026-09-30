// Cliente HTTP del backend Centinela. Guarda el JWT en localStorage y lo envía
// como Bearer. Traduce los códigos de error del API a mensajes en español.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8787'
const TOKEN_KEY = 'centinela.token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(t: string | null): void {
  if (t) localStorage.setItem(TOKEN_KEY, t)
  else localStorage.removeItem(TOKEN_KEY)
}

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

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'sin_conexion', MESSAGES.sin_conexion)
  }

  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    const code = (data && data.error) || 'error'
    throw new ApiError(res.status, code, MESSAGES[code] ?? `Error del servidor (${res.status}).`)
  }
  return data as T
}

// Igual que request(), pero devuelve el binario (ej. el .docx del BIE).
async function requestBlob(method: string, path: string, body?: unknown): Promise<Blob> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  let res: Response
  try {
    res = await fetch(`${API_URL}/api${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  } catch {
    throw new ApiError(0, 'sin_conexion', MESSAGES.sin_conexion)
  }
  if (!res.ok) {
    const text = await res.text()
    let code = 'error'
    try {
      code = (JSON.parse(text) as { error?: string })?.error ?? 'error'
    } catch {
      /* respuesta no-JSON */
    }
    throw new ApiError(res.status, code, MESSAGES[code] ?? `Error del servidor (${res.status}).`)
  }
  return res.blob()
}

// Envía multipart/form-data (archivos). NO fija Content-Type: el navegador pone el boundary.
async function requestForm<T>(path: string, form: FormData): Promise<T> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  let res: Response
  try {
    res = await fetch(`${API_URL}/api${path}`, { method: 'POST', headers, body: form })
  } catch {
    throw new ApiError(0, 'sin_conexion', MESSAGES.sin_conexion)
  }
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    const code = (data && data.error) || 'error'
    throw new ApiError(res.status, code, MESSAGES[code] ?? `Error del servidor (${res.status}).`)
  }
  return data as T
}

// Descarga un binario con autenticación (ej. archivo de evidencia).
async function getBlob(path: string): Promise<Blob> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  let res: Response
  try {
    res = await fetch(`${API_URL}/api${path}`, { headers })
  } catch {
    throw new ApiError(0, 'sin_conexion', MESSAGES.sin_conexion)
  }
  if (!res.ok) {
    const text = await res.text()
    let code = 'error'
    try {
      code = (JSON.parse(text) as { error?: string })?.error ?? 'error'
    } catch {
      /* respuesta no-JSON */
    }
    throw new ApiError(res.status, code, MESSAGES[code] ?? `Error del servidor (${res.status}).`)
  }
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
