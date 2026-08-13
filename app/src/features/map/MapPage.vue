<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { AlertTone } from '@/types'
import AlertBadge from '@/components/ui/AlertBadge.vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
function exportar(fmt: 'PNG' | 'PDF') {
  $q.notify({ type: 'ongoing', message: `Exportando mapa (${fmt})…`, timeout: 900 })
}

interface ComunaPoint { name: string; lat: number; lng: number; color: string; alert: string; tone: AlertTone }

const comunas: ComunaPoint[] = [
  { name: 'Valparaíso', lat: -33.045, lng: -71.62, color: '#C1121F', alert: 'Roja', tone: 'red' },
  { name: 'Viña del Mar', lat: -33.02, lng: -71.55, color: '#0EA5E9', alert: 'Preventiva', tone: 'celeste' },
  { name: 'Quilpué', lat: -33.05, lng: -71.44, color: '#E5A400', alert: 'Amarilla', tone: 'yellow' },
  { name: 'Villa Alemana', lat: -33.04, lng: -71.37, color: '#E5A400', alert: 'Amarilla', tone: 'yellow' },
  { name: 'Concón', lat: -32.92, lng: -71.52, color: '#1F8A54', alert: 'Sin alerta', tone: 'green' },
  { name: 'Quintero', lat: -32.79, lng: -71.53, color: '#1F8A54', alert: 'Sin alerta', tone: 'green' },
  { name: 'Quillota', lat: -32.88, lng: -71.25, color: '#1F8A54', alert: 'Sin alerta', tone: 'green' },
]

const mapEl = ref<HTMLElement | null>(null)
const big = ref(false)
let map: L.Map | null = null

onMounted(() => {
  if (!mapEl.value) return
  map = L.map(mapEl.value).setView([-33.0, -71.5], 9)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(map)
  for (const c of comunas) {
    L.circleMarker([c.lat, c.lng], { radius: 11, color: c.color, fillColor: c.color, fillOpacity: 0.65, weight: 2 })
      .addTo(map)
      .bindPopup(`<b>${c.name}</b><br>Alerta: ${c.alert}`)
  }
  L.polygon([[-33.06, -71.61], [-33.09, -71.57], [-33.05, -71.55], [-33.03, -71.59]], { color: '#E4661E', fillColor: '#E4661E', fillOpacity: 0.35, weight: 2 })
    .addTo(map).bindPopup('<b>Zona estimada — Incendio</b><br>Aproximada · no oficial')
  L.polygon([[-32.95, -71.55], [-32.93, -71.50], [-32.90, -71.53], [-32.92, -71.58]], { color: '#1D4ED8', fillColor: '#1D4ED8', fillOpacity: 0.30, weight: 2 })
    .addTo(map).bindPopup('<b>Zona estimada — Inundación</b><br>Aproximada · no oficial')
  setTimeout(() => map?.invalidateSize(), 150)
})

onBeforeUnmount(() => { map?.remove(); map = null })

async function toggleBig() {
  big.value = !big.value
  await nextTick()
  setTimeout(() => map?.invalidateSize(), 80)
}
</script>

<template>
  <q-page class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <h1 class="text-h6">Mapa por comuna</h1>
      <q-space />
      <q-btn dense outline size="sm" :icon="big ? 'close_fullscreen' : 'open_in_full'" :label="big ? 'Reducir' : 'Ampliar'" @click="toggleBig" />
      <q-btn dense outline size="sm" label="PNG" class="q-ml-sm" @click="exportar('PNG')" />
      <q-btn dense outline size="sm" label="PDF" class="q-ml-sm" @click="exportar('PDF')" />
    </div>

    <div class="row q-col-gutter-md">
      <div :class="big ? 'col-12' : 'col-12 col-md-8'">
        <q-card flat bordered class="q-pa-md">
          <div class="badges q-mb-sm">
            <AlertBadge label="Roja" tone="red" />
            <AlertBadge label="Preventiva" tone="celeste" />
            <AlertBadge label="Amarilla" tone="yellow" />
            <AlertBadge label="Sin alerta" tone="green" />
          </div>
          <div ref="mapEl" class="lmap" role="application" aria-label="Mapa de comunas de la Región de Valparaíso por nivel de alerta" :style="{ height: big ? '78vh' : '380px' }" />
          <div class="text-caption text-muted q-mt-sm">
            Mapa real con <b>Leaflet + OpenStreetMap</b> (gratis, sin API key) · comunas por alerta · apoyo, no oficial
          </div>
          <div class="zone-legend q-mt-xs">
            <span class="text-caption text-weight-medium">Zonas estimadas:</span>
            <span class="zl"><i style="background:#e4661e" />Incendio</span>
            <span class="zl"><i style="background:#1d4ed8" />Inundación</span>
            <span class="text-caption text-muted">· Lluvia: capa de radar</span>
          </div>
        </q-card>
      </div>
      <div v-if="!big" class="col-12 col-md-4">
        <q-card flat bordered class="q-pa-md">
          <div class="sec-title q-mb-sm">Comunas por alerta</div>
          <div class="column items-start" style="gap: 6px">
            <AlertBadge v-for="c in comunas" :key="c.name" :label="c.name" :tone="c.tone" />
          </div>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.lmap { border-radius: 8px; border: 1px solid var(--c-border); z-index: 0; }
.badges { display: flex; flex-wrap: wrap; gap: 10px; }
.zone-legend { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.zl { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--c-text2); }
.zl i { width: 12px; height: 12px; border-radius: 3px; opacity: 0.5; display: inline-block; }
</style>
