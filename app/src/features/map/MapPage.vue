<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useQuasar } from 'quasar'
import { api, ApiError } from '@/services/api'
import { useSessionStore } from '@/stores/session'
import AlertBadge from '@/components/ui/AlertBadge.vue'
import type { AlertTone } from '@/types'

const $q = useQuasar()
const session = useSessionStore()
const canEdit = computed(() => ['operator', 'coordinator', 'admin'].includes(session.role ?? ''))

type MarkerType =
  | 'deslizamiento'
  | 'socavon'
  | 'corte_agua'
  | 'corte_luz'
  | 'corte_redes'
  | 'incendio'
  | 'inundacion'
  | 'ruta_cortada'
  | 'albergue'
  | 'otro'
interface Marker {
  id: string
  type: MarkerType
  title: string
  description: string | null
  lat: number
  lng: number
  incidentId: string | null
  incidentCode: string | null
}
interface IncidentOpt {
  id: string
  code: string
  title: string
}

const typeMeta: Record<MarkerType, { label: string; color: string; emoji: string }> = {
  deslizamiento: { label: 'Deslizamiento', color: '#8B5E3C', emoji: '⛰️' },
  socavon: { label: 'Socavón', color: '#6B7280', emoji: '🕳️' },
  corte_agua: { label: 'Corte de agua', color: '#0EA5E9', emoji: '💧' },
  corte_luz: { label: 'Corte de luz', color: '#E5A400', emoji: '⚡' },
  corte_redes: { label: 'Corte de redes', color: '#7C3AED', emoji: '📶' },
  incendio: { label: 'Incendio', color: '#DC2626', emoji: '🔥' },
  inundacion: { label: 'Inundación', color: '#1D4ED8', emoji: '🌊' },
  ruta_cortada: { label: 'Ruta cortada', color: '#B45309', emoji: '🚧' },
  albergue: { label: 'Albergue', color: '#059669', emoji: '🏠' },
  otro: { label: 'Otro', color: '#374151', emoji: '📍' },
}
const allTypes = Object.keys(typeMeta) as MarkerType[]
const typeOptions = allTypes.map((t) => ({ label: `${typeMeta[t].emoji} ${typeMeta[t].label}`, value: t }))

interface ComunaPoint {
  name: string
  lat: number
  lng: number
  color: string
  alert: string
  tone: AlertTone
}
const comunas: ComunaPoint[] = [
  { name: 'Valparaíso', lat: -33.045, lng: -71.62, color: '#C1121F', alert: 'Roja', tone: 'red' },
  { name: 'Viña del Mar', lat: -33.02, lng: -71.55, color: '#0EA5E9', alert: 'Preventiva', tone: 'celeste' },
  { name: 'Quilpué', lat: -33.05, lng: -71.44, color: '#E5A400', alert: 'Amarilla', tone: 'yellow' },
  { name: 'Villa Alemana', lat: -33.04, lng: -71.37, color: '#E5A400', alert: 'Amarilla', tone: 'yellow' },
  { name: 'Concón', lat: -32.92, lng: -71.52, color: '#1F8A54', alert: 'Sin alerta', tone: 'green' },
  { name: 'Quintero', lat: -32.79, lng: -71.53, color: '#1F8A54', alert: 'Sin alerta', tone: 'green' },
  { name: 'Quillota', lat: -32.88, lng: -71.25, color: '#1F8A54', alert: 'Sin alerta', tone: 'green' },
]

const markers = ref<Marker[]>([])
const enabled = reactive(Object.fromEntries(allTypes.map((t) => [t, true])) as Record<MarkerType, boolean>)
const counts = computed(() => {
  const c = Object.fromEntries(allTypes.map((t) => [t, 0])) as Record<MarkerType, number>
  for (const m of markers.value) c[m.type]++
  return c
})

const mapEl = ref<HTMLElement | null>(null)
const big = ref(false)
const addMode = ref(false)
let map: L.Map | null = null
let markerLayer: L.LayerGroup | null = null

const incidentes = ref<IncidentOpt[]>([])
const incidentOptions = computed(() => incidentes.value.map((i) => ({ label: `${i.code} · ${i.title}`, value: i.id })))

function iconFor(type: MarkerType) {
  const m = typeMeta[type]
  return L.divIcon({
    className: 'mk-wrap',
    html: `<span class="mk-pin" style="background:${m.color}">${m.emoji}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -12],
  })
}
function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string)
}
function renderMarkers() {
  if (!markerLayer) return
  markerLayer.clearLayers()
  for (const m of markers.value) {
    if (!enabled[m.type]) continue
    const meta = typeMeta[m.type]
    const del = canEdit.value
      ? `<div style="margin-top:6px"><button class="mk-del" data-id="${m.id}" style="color:#C1121F;background:none;border:none;cursor:pointer;padding:0;font:inherit">eliminar</button></div>`
      : ''
    const desc = m.description ? `<br>${escapeHtml(m.description)}` : ''
    const inc = m.incidentCode ? ` · ${m.incidentCode}` : ''
    const html = `<b>${meta.emoji} ${escapeHtml(m.title)}</b><br><span style="color:#666">${meta.label}${inc}</span>${desc}${del}`
    L.marker([m.lat, m.lng], { icon: iconFor(m.type) })
      .addTo(markerLayer)
      .bindPopup(html)
  }
}

async function loadMarkers() {
  try {
    markers.value = (await api.get<{ items: Marker[] }>('/markers')).items
    renderMarkers()
  } catch {
    /* silencioso */
  }
}
async function loadIncidentes() {
  try {
    incidentes.value = (await api.get<{ items: IncidentOpt[] }>('/incidents')).items
  } catch {
    /* silencioso */
  }
}

// --- Agregar afectación ---
const showAdd = ref(false)
const saving = ref(false)
const req = (v: unknown) => (!!v && String(v).trim().length > 0) || 'Campo obligatorio'
const nuevo = reactive({ type: 'otro' as MarkerType, title: '', description: '', incidentId: '' as string | null, lat: 0, lng: 0 })
function openAddAt(lat: number, lng: number) {
  nuevo.type = 'otro'
  nuevo.title = ''
  nuevo.description = ''
  nuevo.incidentId = null
  nuevo.lat = lat
  nuevo.lng = lng
  showAdd.value = true
}
async function agregar() {
  saving.value = true
  try {
    await api.post('/markers', {
      type: nuevo.type,
      title: nuevo.title,
      description: nuevo.description || undefined,
      incidentId: nuevo.incidentId || undefined,
      lat: nuevo.lat,
      lng: nuevo.lng,
    })
    $q.notify({ type: 'positive', message: 'Afectación agregada', icon: 'add_location_alt' })
    showAdd.value = false
    addMode.value = false
    await loadMarkers()
  } catch (e) {
    $q.notify({ type: 'negative', message: e instanceof ApiError ? e.message : 'No se pudo agregar' })
  } finally {
    saving.value = false
  }
}
async function eliminarMarker(id: string) {
  try {
    await api.del(`/markers/${id}`)
    $q.notify({ type: 'info', message: 'Afectación eliminada' })
    await loadMarkers()
  } catch (e) {
    $q.notify({ type: 'negative', message: e instanceof ApiError ? e.message : 'No se pudo eliminar' })
  }
}
function toggleType(t: MarkerType) {
  enabled[t] = !enabled[t]
  renderMarkers()
}

onMounted(async () => {
  if (!mapEl.value) return
  map = L.map(mapEl.value).setView([-33.0, -71.5], 9)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(map)
  for (const c of comunas) {
    L.circleMarker([c.lat, c.lng], { radius: 9, color: c.color, fillColor: c.color, fillOpacity: 0.3, weight: 2 })
      .addTo(map)
      .bindPopup(`<b>${c.name}</b><br>Alerta: ${c.alert}`)
  }
  markerLayer = L.layerGroup().addTo(map)
  map.on('click', (e: L.LeafletMouseEvent) => {
    if (addMode.value) openAddAt(e.latlng.lat, e.latlng.lng)
  })
  map.on('popupopen', (e: L.PopupEvent) => {
    const el = e.popup.getElement()?.querySelector('.mk-del') as HTMLElement | null
    if (el)
      el.onclick = () => {
        map?.closePopup()
        if (el.dataset.id) eliminarMarker(el.dataset.id)
      }
  })
  await Promise.all([loadMarkers(), loadIncidentes()])
  setTimeout(() => map?.invalidateSize(), 150)
})
onBeforeUnmount(() => {
  map?.remove()
  map = null
})

async function toggleBig() {
  big.value = !big.value
  await nextTick()
  setTimeout(() => map?.invalidateSize(), 80)
}
</script>

<template>
  <q-page class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <h1 class="text-h6">Mapa operativo</h1>
      <q-space />
      <q-btn
        v-if="canEdit"
        dense
        size="sm"
        :color="addMode ? 'primary' : undefined"
        :outline="!addMode"
        :unelevated="addMode"
        icon="add_location_alt"
        :label="addMode ? 'Clic en el mapa para ubicar…' : 'Agregar afectación'"
        class="q-mr-sm"
        @click="addMode = !addMode"
      />
      <q-btn
        dense
        outline
        size="sm"
        :icon="big ? 'close_fullscreen' : 'open_in_full'"
        :label="big ? 'Reducir' : 'Ampliar'"
        @click="toggleBig"
      />
    </div>

    <div class="row q-col-gutter-md">
      <div :class="big ? 'col-12' : 'col-12 col-md-8'">
        <q-card flat bordered class="q-pa-md">
          <q-banner v-if="addMode" dense rounded class="bg-blue-1 text-blue-9 q-mb-sm">
            Haz clic en el punto del mapa donde ocurrió la afectación.
          </q-banner>
          <div
            ref="mapEl"
            class="lmap"
            :class="{ 'add-mode': addMode }"
            role="application"
            aria-label="Mapa operativo de la Región de Valparaíso con afectaciones georreferenciadas"
            :style="{ height: big ? '78vh' : '420px' }"
          />
          <div class="text-caption text-muted q-mt-sm">
            <b>Leaflet + OpenStreetMap</b> (gratis, sin API key) · comunas por alerta (referencia) + afectaciones · apoyo, no oficial
          </div>
        </q-card>
      </div>

      <div v-if="!big" class="col-12 col-md-4">
        <q-card flat bordered class="q-pa-md">
          <div class="sec-title q-mb-xs">Capas</div>
          <div class="text-caption text-muted q-mb-sm">Muestra u oculta afectaciones por tipo.</div>
          <div class="column" style="gap: 2px">
            <button
              v-for="t in allTypes"
              :key="t"
              type="button"
              class="layer-row"
              :class="{ off: !enabled[t] }"
              :aria-pressed="enabled[t]"
              @click="toggleType(t)"
            >
              <span class="layer-dot" :style="{ background: typeMeta[t].color }">{{ typeMeta[t].emoji }}</span>
              <span class="layer-label">{{ typeMeta[t].label }}</span>
              <q-space />
              <span class="layer-count">{{ counts[t] }}</span>
              <q-icon :name="enabled[t] ? 'visibility' : 'visibility_off'" size="16px" class="q-ml-xs" />
            </button>
          </div>

          <q-separator class="q-my-md" />
          <div class="sec-title q-mb-sm">Comunas por alerta</div>
          <div class="column items-start" style="gap: 6px">
            <AlertBadge v-for="c in comunas" :key="c.name" :label="c.name" :tone="c.tone" />
          </div>
        </q-card>
      </div>
    </div>

    <!-- Agregar afectación -->
    <q-dialog v-model="showAdd" aria-label="Agregar afectación">
      <q-card style="min-width: 360px; max-width: 92vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-subtitle1">Agregar afectación</div>
          <q-space />
          <q-btn v-close-popup type="button" icon="close" flat round dense aria-label="Cerrar" />
        </q-card-section>
        <q-form greedy @submit.prevent="agregar">
          <q-card-section class="q-gutter-sm">
            <q-select v-model="nuevo.type" :options="typeOptions" label="Tipo *" outlined dense emit-value map-options />
            <q-input v-model="nuevo.title" label="Título *" outlined dense :rules="[req]" autofocus />
            <q-input v-model="nuevo.description" label="Detalle (opcional)" outlined dense type="textarea" autogrow />
            <q-select
              v-model="nuevo.incidentId"
              :options="incidentOptions"
              label="Incidente (opcional)"
              outlined
              dense
              emit-value
              map-options
              clearable
            />
            <div class="text-caption text-muted">Ubicación: {{ nuevo.lat.toFixed(4) }}, {{ nuevo.lng.toFixed(4) }}</div>
          </q-card-section>
          <q-card-actions align="right" class="q-pr-md q-pb-md">
            <q-btn v-close-popup type="button" flat label="Cancelar" />
            <q-btn type="submit" color="primary" unelevated label="Agregar" :loading="saving" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped>
.lmap {
  border-radius: 8px;
  border: 1px solid var(--c-border);
  z-index: 0;
}
.lmap.add-mode :deep(.leaflet-grab),
.lmap.add-mode :deep(.leaflet-interactive) {
  cursor: crosshair;
}
.layer-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 6px;
  border: none;
  background: none;
  border-radius: 6px;
  cursor: pointer;
  font: inherit;
  color: var(--c-text);
  text-align: left;
}
.layer-row:hover {
  background: var(--c-bg2, #f4f5f7);
}
.layer-row.off {
  opacity: 0.45;
}
.layer-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex: 0 0 auto;
}
.layer-label {
  font-size: 13px;
}
.layer-count {
  font-variant-numeric: tabular-nums;
  color: var(--c-muted);
  font-size: 12px;
}
:deep(.mk-pin) {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}
</style>
