<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useData } from '@/services/data'
import type { DashboardData } from '@/types'
import { senapredBadge, cruzRojaBadge } from '@/utils/alerts'
import AlertBadge from '@/components/ui/AlertBadge.vue'

const router = useRouter()
const data = useData()
const dash = ref<DashboardData | null>(null)
const loading = ref(true)

async function load() {
  loading.value = true
  dash.value = await data.getDashboard()
  loading.value = false
}
onMounted(load)

// Histórico (mock)
const porTipo = [
  { label: 'Sistema frontal', n: 14, pct: 74 },
  { label: 'Incendio forestal', n: 9, pct: 48 },
  { label: 'Marejadas', n: 7, pct: 37 },
  { label: 'Sismo', n: 6, pct: 32 },
  { label: 'Corte servicios', n: 6, pct: 32 },
]
const porMes = [
  { label: 'Mayo', n: 5, pct: 42 },
  { label: 'Junio', n: 8, pct: 67 },
  { label: 'Julio', n: 12, pct: 100 },
  { label: 'Agosto', n: 10, pct: 83 },
]
</script>

<template>
  <q-page class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <div class="text-h6">Estadísticas</div>
      <q-space />
      <span v-if="dash" class="text-caption text-muted q-mr-sm">Actualizado {{ dash.updatedAgo }}</span>
      <q-btn dense outline size="sm" label="Actualizar" :loading="loading" @click="load" />
    </div>

    <template v-if="dash">
      <div class="sec-title q-mb-sm">Situación actual</div>
      <div class="row q-col-gutter-sm q-mb-sm">
        <div v-for="m in dash.metrics" :key="m.label" class="col-6 col-md-3">
          <q-card flat bordered class="q-pa-md">
            <div class="text-caption text-muted">{{ m.label }}</div>
            <div class="text-h5 text-weight-bold" :style="m.color ? { color: m.color } : undefined">{{ m.value }}</div>
          </q-card>
        </div>
      </div>
      <div class="row q-col-gutter-sm q-mb-lg">
        <div v-for="m in dash.metrics2" :key="m.label" class="col-6 col-md-4">
          <q-card flat bordered class="q-pa-md">
            <div class="text-caption text-muted">{{ m.label }}</div>
            <div class="text-h5 text-weight-bold">{{ m.value }}</div>
          </q-card>
        </div>
      </div>

      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-md-8">
          <q-card flat bordered class="q-pa-md">
            <div class="sec-title q-mb-sm">Incidentes activos</div>
            <q-markup-table flat>
              <thead>
                <tr>
                  <th class="text-left">Código</th>
                  <th class="text-left">Evento</th>
                  <th class="text-left">SENAPRED</th>
                  <th class="text-left">Cruz Roja</th>
                  <th class="text-left">Comunas</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="i in dash.activeIncidents" :key="i.id" class="cursor-pointer" @click="router.push(`/incidents/${i.id}`)">
                  <td class="tabular text-muted">{{ i.code }}</td>
                  <td>{{ i.eventType }}</td>
                  <td><AlertBadge v-bind="senapredBadge(i.alertSenapred)" /></td>
                  <td><AlertBadge v-bind="cruzRojaBadge(i.alertCruzRoja)" /></td>
                  <td>{{ i.comunasCount }}</td>
                </tr>
              </tbody>
            </q-markup-table>
          </q-card>
        </div>
        <div class="col-12 col-md-4">
          <q-card flat bordered class="q-pa-md">
            <div class="sec-title q-mb-sm">Comunas por alerta</div>
            <div class="badges">
              <AlertBadge v-for="c in dash.comunasByAlert" :key="c.name" :label="c.name" :tone="c.tone" />
            </div>
          </q-card>
        </div>
      </div>

      <div class="sec-title q-mb-sm">Histórico 2026</div>
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <q-card flat bordered class="q-pa-md">
            <div class="text-caption text-muted q-mb-md">Eventos por tipo</div>
            <div v-for="b in porTipo" :key="b.label" class="bar-row">
              <span class="bar-label">{{ b.label }}</span>
              <div class="bar-track"><div class="bar-fill" :style="{ width: b.pct + '%', background: 'var(--c-red)' }" /></div>
              <span class="bar-val tabular">{{ b.n }}</span>
            </div>
          </q-card>
        </div>
        <div class="col-12 col-md-6">
          <q-card flat bordered class="q-pa-md">
            <div class="text-caption text-muted q-mb-md">Eventos por mes</div>
            <div v-for="b in porMes" :key="b.label" class="bar-row">
              <span class="bar-label" style="width: 60px">{{ b.label }}</span>
              <div class="bar-track"><div class="bar-fill" :style="{ width: b.pct + '%', background: 'var(--grafito)' }" /></div>
              <span class="bar-val tabular">{{ b.n }}</span>
            </div>
          </q-card>
        </div>
      </div>
    </template>

    <div v-else class="q-gutter-sm">
      <q-skeleton height="80px" />
      <q-skeleton height="200px" />
    </div>
  </q-page>
</template>

<style scoped>
.badges { display: flex; flex-wrap: wrap; gap: 6px; }
.bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 9px; }
.bar-label { width: 120px; font-size: 13px; color: var(--c-text2); }
.bar-track { flex: 1; background: var(--c-surface2); border-radius: 4px; height: 14px; }
.bar-fill { height: 14px; border-radius: 4px; }
.bar-val { width: 22px; text-align: right; font-size: 12px; }
</style>
