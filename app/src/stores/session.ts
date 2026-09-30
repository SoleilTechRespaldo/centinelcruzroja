import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Role } from '@/types'
import { api } from '@/services/api'

interface SessionUser {
  id: string
  email: string
  role: Role
  displayName: string
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

export const useSessionStore = defineStore('session', () => {
  const user = ref<SessionUser | null>(null)

  const isAuthenticated = computed(() => !!user.value)
  const displayName = computed(() => user.value?.displayName ?? '')
  const initials = computed(() => initialsOf(user.value?.displayName ?? ''))
  const role = computed<Role | null>(() => user.value?.role ?? null)
  const isAdmin = computed(() => user.value?.role === 'admin')

  // Login real: el backend deja una cookie de sesión HttpOnly; aquí solo guardamos
  // el usuario para la UI. Lanza ApiError si falla.
  async function login(email: string, password: string) {
    const res = await api.post<{ user: SessionUser }>('/auth/login', { email, password })
    user.value = res.user
  }

  async function logout() {
    user.value = null // limpia el estado de inmediato (el guard ve la sesión cerrada)
    try {
      await api.post('/auth/logout') // borra la cookie en el servidor
    } catch {
      /* si el servidor no responde, la cookie caduca sola */
    }
  }

  // Restaura la sesión al recargar: valida la cookie contra /auth/me.
  async function restore() {
    try {
      const res = await api.get<{ user: SessionUser }>('/auth/me')
      user.value = res.user
    } catch {
      user.value = null
    }
  }

  return { user, isAuthenticated, displayName, initials, role, isAdmin, login, logout, restore }
})
