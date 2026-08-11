<script setup lang="ts">
import { ref } from 'vue'
import AlertBadge from '@/components/ui/AlertBadge.vue'

const tab = ref('filiales')
const filiales = [
  { filial: 'Filial Valparaíso', comuna: 'Valparaíso', activa: true },
  { filial: 'Filial Viña del Mar', comuna: 'Viña del Mar', activa: true },
  { filial: 'Filial Quilpué', comuna: 'Quilpué', activa: true },
  { filial: 'Filial Quillota', comuna: 'Quillota', activa: false },
]
</script>

<template>
  <q-page class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <div class="text-h6">Catálogos</div>
      <q-space />
      <q-btn color="primary" unelevated size="sm" icon="add" label="Agregar" />
    </div>

    <q-tabs v-model="tab" align="left" no-caps class="text-grey-8 q-mb-md" active-color="primary" indicator-color="primary">
      <q-tab name="filiales" label="Filiales" />
      <q-tab name="comunas" label="Comunas" />
      <q-tab name="tipos" label="Tipos de evento" />
      <q-tab name="fuentes" label="Fuentes" />
    </q-tabs>

    <q-card flat bordered>
      <q-markup-table flat>
        <thead>
          <tr><th class="text-left">Filial</th><th class="text-left">Comuna</th><th class="text-left">Estado</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="f in filiales" :key="f.filial">
            <td>{{ f.filial }}</td>
            <td>{{ f.comuna }}</td>
            <td><AlertBadge :label="f.activa ? 'Activa' : 'Inactiva'" :tone="f.activa ? 'green' : 'gray'" /></td>
            <td><a class="link">editar</a></td>
          </tr>
        </tbody>
      </q-markup-table>
    </q-card>
  </q-page>
</template>
