import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Role } from '@/types'
import { api, setToken, getToken } from '@/services/api'

interface SessionUser {
  id: string
  email: string
  role: Role
  displayName: string
}

const USER_KEY = 'centinela.user'

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

  // Login real contra el backend (JWT). Lanza ApiError si falla.
  async function login(email: string, password: string) {
    const res = await api.post<{ token: string; user: SessionUser }>('/auth/login', { email, password })
    setToken(res.token)
    user.value = res.user
    localStorage.setItem(USER_KEY, JSON.stringify(res.user))
  }

  function logout() {
    setToken(null)
    localStorage.removeItem(USER_KEY)
    user.value = null
  }

  // Restaura la sesión desde localStorage al recargar la página.
  function restore() {
    const token = getToken()
    const raw = localStorage.getItem(USER_KEY)
    if (token && raw) {
      try {
        user.value = JSON.parse(raw)
      } catch {
        logout()
      }
    }
  }

  return { user, isAuthenticated, displayName, initials, role, isAdmin, login, logout, restore }
})
