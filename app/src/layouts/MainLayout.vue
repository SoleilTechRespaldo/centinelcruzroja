<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import BrandMark from '@/components/ui/BrandMark.vue'

type NavItem = { section?: string; label?: string; to?: string; icon?: string }

const drawer = ref(true)
const router = useRouter()
const session = useSessionStore()

const nav: NavItem[] = [
  { section: 'Monitoreo' },
  { label: 'Incidentes', to: '/incidents', icon: 'warning_amber' },
  { label: 'Generar BIE', to: '/bie', icon: 'description' },
  { label: 'Expediente', to: '/expediente', icon: 'folder_open' },
  { section: 'Análisis' },
  { label: 'Estadísticas', to: '/estadisticas', icon: 'insights' },
  { label: 'Mapa', to: '/map', icon: 'map' },
  { label: 'Cámaras', to: '/cameras', icon: 'videocam' },
  { section: 'Configuración' },
  { label: 'Catálogos', to: '/catalogs', icon: 'category' },
  { label: 'Usuarios', to: '/users', icon: 'group' },
]

function logout() {
  session.logout()
  router.push('/login')
}
</script>

<template>
  <q-layout view="hHh Lpr lFf">
    <q-header class="topbar text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" class="lt-md" @click="drawer = !drawer" />
        <BrandMark white :size="26" />
        <span class="brand-name q-ml-sm">Centinela</span>
        <span class="brand-sub q-ml-sm gt-xs">Sala de crisis</span>
        <q-space />
        <span class="region q-mr-md gt-xs">Región de Valparaíso</span>
        <q-avatar size="30px" color="grey-9" text-color="white">{{ session.initials }}</q-avatar>
        <q-btn flat dense round icon="logout" class="q-ml-xs" @click="logout">
          <q-tooltip>Salir</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawer" show-if-above :width="222" class="sidebar" bordered>
      <q-list padding>
        <template v-for="(it, idx) in nav" :key="idx">
          <div v-if="it.section" class="nav-section">{{ it.section }}</div>
          <q-item v-else v-ripple clickable :to="it.to" active-class="nav-active">
            <q-item-section avatar><q-icon :name="it.icon" size="20px" /></q-item-section>
            <q-item-section>{{ it.label }}</q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style scoped>
.topbar { background: var(--grafito); }
.brand-name { font-weight: 600; font-size: 16px; }
.brand-sub { color: #aeb4c0; font-size: 13px; font-weight: 400; }
.region { color: #c9cdd4; font-size: 13px; }
.nav-section { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--c-muted); font-weight: 600; padding: 14px 16px 4px; }
.sidebar :deep(.q-item) { border-radius: 8px; margin: 2px 8px; color: var(--c-text2); font-weight: 500; min-height: 42px; }
.sidebar :deep(.nav-active) { color: var(--c-red); background: #fdecec; }
</style>
