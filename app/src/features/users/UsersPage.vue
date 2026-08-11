<script setup lang="ts">
import AlertBadge from '@/components/ui/AlertBadge.vue'
import type { AlertTone } from '@/types'

const users: { name: string; email: string; role: string; tone: AlertTone; active: boolean; last: string }[] = [
  { name: 'Nicolás Jerez', email: 'njerez@cruzroja.cl', role: 'Admin', tone: 'red', active: true, last: 'hoy 15:40' },
  { name: 'Ive Manni', email: 'imanni@cruzroja.cl', role: 'Coordinador', tone: 'celeste', active: true, last: 'hoy 12:10' },
  { name: 'Operador Sala', email: 'sala@cruzroja.cl', role: 'Operador', tone: 'yellow', active: true, last: 'ayer 22:05' },
  { name: 'Consulta DEM', email: 'dem@cruzroja.cl', role: 'Consulta', tone: 'gray', active: false, last: '02/08' },
]
</script>

<template>
  <q-page class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <div class="text-h6">Usuarios</div>
      <q-space />
      <q-btn color="primary" unelevated size="sm" icon="add" label="Invitar usuario" />
    </div>

    <q-card flat bordered>
      <q-markup-table flat>
        <thead>
          <tr>
            <th class="text-left">Nombre</th>
            <th class="text-left">Correo</th>
            <th class="text-left">Rol</th>
            <th class="text-left">Estado</th>
            <th class="text-left">Último ingreso</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.email">
            <td>{{ u.name }}</td>
            <td>{{ u.email }}</td>
            <td><AlertBadge :label="u.role" :tone="u.tone" /></td>
            <td><AlertBadge :label="u.active ? 'Activo' : 'Inactivo'" :tone="u.active ? 'green' : 'gray'" /></td>
            <td class="tabular text-muted">{{ u.last }}</td>
            <td><a class="link">editar</a></td>
          </tr>
        </tbody>
      </q-markup-table>
    </q-card>
  </q-page>
</template>
