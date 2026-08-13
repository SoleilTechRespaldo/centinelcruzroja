<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useData } from '@/services/data'
import type { IncidentSummary } from '@/types'
import { senapredBadge, cruzRojaBadge, statusLabel } from '@/utils/alerts'
import AlertBadge from '@/components/ui/AlertBadge.vue'

const router = useRouter()
const data = useData()
const rows = ref<IncidentSummary[]>([])
const loading = ref(true)
const error = ref(false)

async function load() {
  loading.value = true
  error.value = false
  try {
    rows.value = await data.listIncidents()
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>

<template>
  <q-page class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <h1 class="text-h6">Incidentes</h1>
      <q-space />
      <q-btn color="primary" unelevated size="sm" icon="add" label="Nuevo incidente" @click="router.push('/incidents/new')" />
    </div>

    <q-banner v-if="error" rounded class="bg-red-1 text-red-9 q-mb-md">
      No se pudieron cargar los incidentes.
      <template #action><q-btn flat label="Reintentar" @click="load" /></template>
    </q-banner>

    <q-card flat bordered>
      <q-markup-table flat tabindex="0" aria-label="Lista de incidentes">
        <thead>
          <tr>
            <th class="text-left">Código</th>
            <th class="text-left">Título</th>
            <th class="text-left">Tipo</th>
            <th class="text-left">Estado</th>
            <th class="text-left">SENAPRED</th>
            <th class="text-left">Cruz Roja</th>
            <th class="text-left">Inicio</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="loading">
            <tr v-for="n in 4" :key="n">
              <td v-for="c in 7" :key="c"><q-skeleton type="text" /></td>
            </tr>
          </template>
          <template v-else>
            <tr v-for="r in rows" :key="r.id" class="cursor-pointer" @click="router.push(`/incidents/${r.id}`)">
              <td class="tabular text-muted">{{ r.code }}</td>
              <td>{{ r.title }}</td>
              <td>{{ r.eventType }}</td>
              <td><AlertBadge :label="statusLabel(r.status)" tone="gray" /></td>
              <td><AlertBadge v-bind="senapredBadge(r.alertSenapred)" /></td>
              <td><AlertBadge v-bind="cruzRojaBadge(r.alertCruzRoja)" /></td>
              <td class="tabular text-muted">{{ r.startedAt }}</td>
            </tr>
            <tr v-if="rows.length === 0">
              <td colspan="7" class="text-center text-muted q-pa-lg">Aún no hay incidentes.</td>
            </tr>
          </template>
        </tbody>
      </q-markup-table>
    </q-card>
  </q-page>
</template>
