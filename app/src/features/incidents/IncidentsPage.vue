<script setup lang="ts">
import AlertBadge from '@/components/ui/AlertBadge.vue'

const rows = [
  { code: '2026-0015', titulo: 'Sistema frontal zona centro', tipo: 'Sistema frontal', estado: 'Activo', senapred: { t: 'Amarilla', c: 'yellow' }, cr: { t: 'Amarilla', c: 'yellow' }, inicio: '08/08 14:00' },
  { code: '2026-0014', titulo: 'Incendio sector Las Tablas', tipo: 'Incendio forestal', estado: 'Activo', senapred: { t: 'Roja', c: 'red' }, cr: { t: 'Roja', c: 'red' }, inicio: '07/08 11:20' },
  { code: '2026-0013', titulo: 'Marejadas litoral', tipo: 'Marejada', estado: 'Activo', senapred: { t: 'ATP', c: 'celeste' }, cr: { t: 'Verde', c: 'green' }, inicio: '06/08 09:00' },
] as const
</script>

<template>
  <q-page class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <div class="text-h6">Incidentes</div>
      <q-space />
      <q-btn color="primary" unelevated size="sm" icon="add" label="Nuevo incidente" />
    </div>

    <q-card flat bordered class="q-pa-none">
      <q-markup-table flat>
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
          <tr v-for="r in rows" :key="r.code" class="cursor-pointer">
            <td class="tabular text-muted">{{ r.code }}</td>
            <td>{{ r.titulo }}</td>
            <td>{{ r.tipo }}</td>
            <td><AlertBadge :label="r.estado" tone="gray" /></td>
            <td><AlertBadge :label="r.senapred.t" :tone="r.senapred.c" /></td>
            <td><AlertBadge :label="r.cr.t" :tone="r.cr.c" /></td>
            <td class="tabular text-muted">{{ r.inicio }}</td>
          </tr>
        </tbody>
      </q-markup-table>
    </q-card>
  </q-page>
</template>
