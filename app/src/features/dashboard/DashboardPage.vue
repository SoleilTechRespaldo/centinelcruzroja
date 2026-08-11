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
</script>

<template>
  <q-page class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <div class="text-h6">Panel de situación</div>
      <q-space />
      <span v-if="dash" class="text-caption text-muted q-mr-sm">Actualizado {{ dash.updatedAgo }}</span>
      <q-btn dense outline size="sm" label="Actualizar" :loading="loading" @click="load" />
    </div>

    <template v-if="dash">
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

      <div class="row q-col-gutter-md">
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
            <div class="map-placeholder q-mt-md">
              Aquí irá el <b>mapa por comuna</b><br /><span class="text-caption">coloreado por alerta · descargable</span>
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
.map-placeholder {
  border: 1px dashed var(--c-border);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  color: var(--c-text2);
}
</style>
