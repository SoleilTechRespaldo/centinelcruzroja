<script setup lang="ts">
import { useRouter } from 'vue-router'
import AlertBadge from '@/components/ui/AlertBadge.vue'

const router = useRouter()

// Datos de ejemplo (luego vendrán del DataService — mock)
const metrics = [
  { label: 'Eventos activos', value: '3' },
  { label: 'Alerta roja', value: '1', color: 'var(--al-red)' },
  { label: 'Alerta amarilla', value: '2', color: 'var(--al-yellow-t)' },
  { label: 'Comunas afectadas', value: '7' },
]
const metrics2 = [
  { label: 'Personas afectadas', value: '2.350' },
  { label: 'Voluntarios desplegados', value: '72' },
  { label: 'Filiales activadas', value: '6' },
]
const incidents = [
  { code: '2026-0015', evento: 'Sistema frontal', senapred: { t: 'Amarilla', c: 'yellow' }, cr: { t: 'Amarilla', c: 'yellow' }, comunas: 5 },
  { code: '2026-0014', evento: 'Incendio forestal', senapred: { t: 'Roja', c: 'red' }, cr: { t: 'Roja', c: 'red' }, comunas: 2 },
  { code: '2026-0013', evento: 'Marejadas', senapred: { t: 'Preventiva', c: 'celeste' }, cr: { t: 'Verde', c: 'green' }, comunas: 3 },
] as const
</script>

<template>
  <q-page class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <div class="text-h6">Panel de situación</div>
      <q-space />
      <span class="text-caption text-muted q-mr-sm">Actualizado hace 3 min</span>
      <q-btn dense outline size="sm" label="Actualizar" />
    </div>

    <div class="row q-col-gutter-sm q-mb-sm">
      <div v-for="m in metrics" :key="m.label" class="col-6 col-md-3">
        <q-card flat bordered class="q-pa-md">
          <div class="text-caption text-muted">{{ m.label }}</div>
          <div class="text-h5 text-weight-bold" :style="m.color ? { color: m.color } : undefined">{{ m.value }}</div>
        </q-card>
      </div>
    </div>
    <div class="row q-col-gutter-sm q-mb-lg">
      <div v-for="m in metrics2" :key="m.label" class="col-6 col-md-4">
        <q-card flat bordered class="q-pa-md">
          <div class="text-caption text-muted">{{ m.label }}</div>
          <div class="text-h5 text-weight-bold">{{ m.value }}</div>
        </q-card>
      </div>
    </div>

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
          <tr v-for="i in incidents" :key="i.code" class="cursor-pointer" @click="router.push('/incidents')">
            <td class="tabular text-muted">{{ i.code }}</td>
            <td>{{ i.evento }}</td>
            <td><AlertBadge :label="i.senapred.t" :tone="i.senapred.c" /></td>
            <td><AlertBadge :label="i.cr.t" :tone="i.cr.c" /></td>
            <td>{{ i.comunas }}</td>
          </tr>
        </tbody>
      </q-markup-table>
    </q-card>
  </q-page>
</template>
