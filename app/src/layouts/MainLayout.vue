<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import BrandMark from '@/components/ui/BrandMark.vue'

type NavItem = { section?: string; label?: string; to?: string; icon?: string; adminOnly?: boolean }

const drawer = ref(true)
const router = useRouter()
const session = useSessionStore()

const nav: NavItem[] = [
  { section: 'Monitoreo' },
  { label: 'Incidentes', to: '/incidents', icon: 'warning_amber' },
  { label: 'Bandeja', to: '/bandeja', icon: 'inbox' },
  { label: 'Generar BIE', to: '/bie', icon: 'description' },
  { label: 'Expediente', to: '/expediente', icon: 'folder_open' },
  { section: 'Análisis' },
  { label: 'Estadísticas', to: '/estadisticas', icon: 'insights' },
  { label: 'Mapa', to: '/map', icon: 'map' },
  { label: 'Cámaras', to: '/cameras', icon: 'videocam' },
  { section: 'Configuración' },
  { label: 'Catálogos', to: '/catalogs', icon: 'category' },
  { label: 'Usuarios', to: '/users', icon: 'group', adminOnly: true },
]

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  coordinator: 'Coordinador',
  operator: 'Operador',
  consulta: 'Consulta',
}
function roleLabel(r: string | null): string {
  return r ? (roleLabels[r] ?? r) : ''
}

// Tamaño de letra (A− / A+): escala el contenido y se recuerda entre sesiones.
const ZOOM_KEY = 'centinela.zoom'
const MIN = 0.85
const MAX = 1.5
const STEP = 0.1
const zoom = ref(1)
onMounted(() => {
  const saved = Number(localStorage.getItem(ZOOM_KEY))
  if (saved >= MIN && saved <= MAX) zoom.value = saved
})
const zoomPct = computed(() => Math.round(zoom.value * 100) + '%')
const contentStyle = computed(() => ({ zoom: String(zoom.value) }))
function bumpZoom(dir: number) {
  const next = Math.min(MAX, Math.max(MIN, +(zoom.value + dir * STEP).toFixed(2)))
  zoom.value = next
  localStorage.setItem(ZOOM_KEY, String(next))
}

function logout() {
  session.logout()
  router.push('/login')
}
</script>

<template>
  <q-layout view="hHh Lpr lFf">
    <q-header class="topbar text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" class="lt-md" aria-label="Abrir o cerrar menú" @click="drawer = !drawer" />
        <BrandMark white :size="26" />
        <span class="brand-name q-ml-sm">Centinela</span>
        <span class="brand-sub q-ml-sm gt-xs">Sala de crisis</span>
        <q-space />

        <!-- Tamaño de letra -->
        <div class="tsize gt-xs" role="group" aria-label="Tamaño de letra">
          <q-btn
            dense
            flat
            class="tsize-btn"
            label="A−"
            aria-label="Reducir tamaño de letra"
            :disable="zoom <= MIN"
            @click="bumpZoom(-1)"
          />
          <span class="tsize-val" aria-live="polite">{{ zoomPct }}</span>
          <q-btn
            dense
            flat
            class="tsize-btn tsize-plus"
            label="A+"
            aria-label="Aumentar tamaño de letra"
            :disable="zoom >= MAX"
            @click="bumpZoom(1)"
          />
        </div>

        <span class="region q-mx-md gt-md">Región de Valparaíso</span>
        <div class="userbox gt-xs q-mr-sm">
          <span class="user-name">{{ session.displayName }}</span>
          <span class="user-role">{{ roleLabel(session.role) }}</span>
        </div>
        <q-avatar size="30px" color="grey-9" text-color="white">
          {{ session.initials }}
          <q-tooltip>{{ session.displayName }} · {{ roleLabel(session.role) }}</q-tooltip>
        </q-avatar>
        <q-btn flat dense round icon="logout" class="q-ml-xs" aria-label="Cerrar sesión" @click="logout">
          <q-tooltip>Salir</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawer" show-if-above :width="222" class="sidebar" bordered>
      <nav class="q-pa-sm" aria-label="Navegación principal">
        <template v-for="(it, idx) in nav" :key="idx">
          <div v-if="it.section" class="nav-section">{{ it.section }}</div>
          <q-item v-else-if="!it.adminOnly || session.isAdmin" v-ripple clickable :to="it.to" active-class="nav-active">
            <q-item-section avatar><q-icon :name="it.icon" size="20px" /></q-item-section>
            <q-item-section>{{ it.label }}</q-item-section>
          </q-item>
        </template>
      </nav>
    </q-drawer>

    <q-page-container>
      <div class="content-zoom" :style="contentStyle">
        <router-view />
      </div>
    </q-page-container>
  </q-layout>
</template>

<style scoped>
.topbar {
  background: var(--grafito);
}
.brand-name {
  font-weight: 600;
  font-size: 16px;
}
.brand-sub {
  color: #aeb4c0;
  font-size: 13px;
  font-weight: 400;
}
.region {
  color: #c9cdd4;
  font-size: 13px;
}
.nav-section {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--c-muted);
  font-weight: 600;
  padding: 14px 16px 4px;
}
.sidebar :deep(.q-item) {
  border-radius: 8px;
  margin: 2px 8px;
  color: var(--c-text2);
  font-weight: 500;
  min-height: 42px;
}
.sidebar :deep(.nav-active) {
  color: var(--c-red);
  background: #fdecec;
  box-shadow: inset 3px 0 0 var(--c-red);
}

/* Control de tamaño de letra */
.tsize {
  display: inline-flex;
  align-items: center;
  border: 1px solid #3a4050;
  border-radius: 8px;
  overflow: hidden;
}
.tsize-btn {
  color: #c9cdd4;
  min-height: 26px;
  padding: 0 9px;
  font-weight: 600;
  border-radius: 0;
}
.tsize-plus {
  border-left: 1px solid #3a4050;
}
.tsize-val {
  color: #c9cdd4;
  font-size: 11px;
  min-width: 40px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

/* Usuario en el topbar */
.userbox {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.15;
}
.user-name {
  color: #fff;
  font-size: 13px;
  font-weight: 500;
}
.user-role {
  color: #aeb4c0;
  font-size: 11px;
}
</style>
