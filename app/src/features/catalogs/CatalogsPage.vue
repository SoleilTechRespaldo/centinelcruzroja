<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useQuasar } from 'quasar'
import AlertBadge from '@/components/ui/AlertBadge.vue'

const $q = useQuasar()
const tab = ref('filiales')

type CatItem = { nombre: string; meta: string; activa: boolean }
const catalogos = reactive<Record<string, { metaLabel: string; items: CatItem[] }>>({
  filiales: {
    metaLabel: 'Comuna',
    items: [
      { nombre: 'Filial Valparaíso', meta: 'Valparaíso', activa: true },
      { nombre: 'Filial Viña del Mar', meta: 'Viña del Mar', activa: true },
      { nombre: 'Filial Quilpué', meta: 'Quilpué', activa: true },
      { nombre: 'Filial Quillota', meta: 'Quillota', activa: false },
    ],
  },
  comunas: {
    metaLabel: 'Provincia',
    items: [
      { nombre: 'Valparaíso', meta: 'Valparaíso', activa: true },
      { nombre: 'Viña del Mar', meta: 'Valparaíso', activa: true },
      { nombre: 'Quilpué', meta: 'Marga Marga', activa: true },
      { nombre: 'Los Andes', meta: 'Los Andes', activa: true },
    ],
  },
  tipos: {
    metaLabel: 'Categoría',
    items: [
      { nombre: 'Sistema frontal', meta: 'Meteorológico', activa: true },
      { nombre: 'Incendio forestal', meta: 'Incendios', activa: true },
      { nombre: 'Sismo', meta: 'Geológico', activa: true },
      { nombre: 'Marejadas', meta: 'Costero', activa: true },
    ],
  },
  fuentes: {
    metaLabel: 'Tipo',
    items: [
      { nombre: 'SENAPRED', meta: 'Organismo oficial', activa: true },
      { nombre: 'DMC', meta: 'Meteorología', activa: true },
      { nombre: 'DGA', meta: 'Hidrología', activa: true },
      { nombre: 'CONAF', meta: 'Incendios', activa: true },
    ],
  },
})
const current = computed(() => catalogos[tab.value])

// Alta
const showAdd = ref(false)
const nuevo = reactive({ nombre: '', meta: '' })
const req = (v: unknown) => (!!v && String(v).trim().length > 0) || 'Campo obligatorio'

function openAdd() {
  nuevo.nombre = ''
  nuevo.meta = ''
  showAdd.value = true
}
function agregar() {
  current.value.items.push({ nombre: nuevo.nombre, meta: nuevo.meta, activa: true })
  $q.notify({ type: 'positive', message: 'Registro agregado', caption: nuevo.nombre, icon: 'check_circle' })
  showAdd.value = false
}
function editar(it: CatItem) {
  $q.notify({ type: 'info', message: 'Editar', caption: it.nombre })
}
</script>

<template>
  <q-page class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <h1 class="text-h6">Catálogos</h1>
      <q-space />
      <q-btn color="primary" unelevated size="sm" icon="add" label="Agregar" @click="openAdd" />
    </div>

    <q-tabs v-model="tab" align="left" no-caps class="text-grey-8 q-mb-md" active-color="primary" indicator-color="primary">
      <q-tab name="filiales" label="Filiales" />
      <q-tab name="comunas" label="Comunas" />
      <q-tab name="tipos" label="Tipos de evento" />
      <q-tab name="fuentes" label="Fuentes" />
    </q-tabs>

    <q-card flat bordered>
      <q-markup-table flat tabindex="0" :aria-label="`Catálogo: ${tab}`">
        <thead>
          <tr>
            <th class="text-left">Nombre</th>
            <th class="text-left">{{ current.metaLabel }}</th>
            <th class="text-left">Estado</th>
            <th><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(it, i) in current.items" :key="i">
            <td>{{ it.nombre }}</td>
            <td>{{ it.meta }}</td>
            <td><AlertBadge :label="it.activa ? 'Activa' : 'Inactiva'" :tone="it.activa ? 'green' : 'gray'" /></td>
            <td><button type="button" class="link" @click="editar(it)">editar</button></td>
          </tr>
        </tbody>
      </q-markup-table>
    </q-card>

    <!-- Diálogo: agregar registro -->
    <q-dialog v-model="showAdd" aria-label="Agregar registro al catálogo">
      <q-card style="min-width: 340px; max-width: 92vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-subtitle1">Agregar a {{ tab }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup aria-label="Cerrar" />
        </q-card-section>
        <q-form greedy @submit.prevent="agregar">
          <q-card-section class="q-gutter-sm">
            <q-input v-model="nuevo.nombre" label="Nombre *" outlined dense :rules="[req]" autofocus />
            <q-input v-model="nuevo.meta" :label="current.metaLabel" outlined dense />
          </q-card-section>
          <q-card-actions align="right" class="q-pr-md q-pb-md">
            <q-btn type="button" flat label="Cancelar" v-close-popup />
            <q-btn type="submit" color="primary" unelevated label="Agregar" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped>
/* Pestañas inactivas con contraste AA (WCAG 1.4.3) */
:deep(.q-tab--inactive) { opacity: 1; }
:deep(.q-tab--inactive .q-tab__label) { color: var(--c-text2); }
</style>
