import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Role } from '@/types'

export const useSessionStore = defineStore('session', () => {
  const isAuthenticated = ref(false)
  const displayName = ref('Nicolás Jerez')
  const initials = ref('NJ')
  const role = ref<Role>('admin')

  function login(_email: string) {
    // Demo (mock): cualquier credencial entra. La auth real irá en el backend.
    isAuthenticated.value = true
  }

  function logout() {
    isAuthenticated.value = false
  }

  return { isAuthenticated, displayName, initials, role, login, logout }
})
