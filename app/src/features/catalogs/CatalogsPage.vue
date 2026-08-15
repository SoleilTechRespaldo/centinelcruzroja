<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api, ApiError } from '@/services/api'
import { useSessionStore } from '@/stores/session'
import AlertBadge from '@/components/ui/AlertBadge.vue'

interface CatItem {
  id: string
  name: string
  meta: string
  isActive: boolean
}
type CatKey = 'comunas' | 'tipos' | 'fuentes'
type Catalogs = Record<CatKey, CatItem[]>

const $q = useQuasar()
const session = useSessionStore()

const tab = ref<CatKey>('comunas')
const cat = ref<Catalogs>({ comunas: [], tipos: [], fuentes: [] })
const loading = ref(true)
const error = ref('')
const metaLabels: Record<CatKey, string> = { comunas: 'Provincia', tipos: 'Categoría', fuentes: 'Sitio oficial' }

async function load() {
  loading.value = true
  error.value = ''
  try {
    cat.value = await api.get<Catalogs>('/catalogs')
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'No se pudieron cargar los catálogos.'
  } finally {
    loading.value = false
  }
}
onMounted(load)

const current = computed<CatItem[]>(() => cat.value[tab.value] ?? [])
const metaLabel = computed(() => metaLabels[tab.value])

// --- Alta (admin) ---
const req = (v: unknown) => (!!v && String(v).trim().length > 0) || 'Campo obligatorio'
const saving = ref(false)
const showAdd = ref(false)
const nuevo = reactive({ name: '', meta: '' })
function openAdd() {
  nuevo.name = ''
  nuevo.meta = ''
  showAdd.value = true
}
async function agregar() {
  saving.value = true
  try {
    await api.post(`/catalogs/${tab.value}`, { name: nuevo.name, meta: nuevo.meta || undefined })
    $q.notify({ type: 'positive', message: 'Registro agregado', caption: nuevo.name, icon: 'check_circle' })
    showAdd.value = false
    await load()
  } catch (e) {
    $q.notify({ type: 'negative', message: e instanceof ApiError ? e.message : 'No se pudo agregar' })
  } finally {
    saving.value = false
  }
}
async function toggleActive(it: CatItem) {
  try {
    await api.patch(`/catalogs/${tab.value}/${it.id}`, { isActive: !it.isActive })
    await load()
  } catch (e) {
    $q.notify({ type: 'negative', message: e instanceof ApiError ? e.message : 'No se pudo actualizar' })
  }
}
</script>

<template>
  <q-page class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <h1 class="text-h6">Catálogos</h1>
      <q-space />
      <q-btn v-if="session.isAdmin" color="primary" unelevated size="sm" icon="add" label="Agregar" @click="openAdd" />
    </div>

    <q-banner v-if="error" rounded class="bg-red-1 text-red-9 q-mb-md">
      {{ error }}
      <template #action><q-btn flat label="Reintentar" @click="load" /></template>
    </q-banner>

    <q-tabs v-model="tab" align="left" no-caps class="q-mb-md" active-color="primary" indicator-color="primary">
      <q-tab name="comunas" label="Comunas" />
      <q-tab name="tipos" label="Tipos de evento" />
      <q-tab name="fuentes" label="Fuentes" />
    </q-tabs>

    <q-card flat bordered>
      <q-markup-table flat tabindex="0" :aria-label="`Catálogo: ${tab}`">
        <thead>
          <tr>
            <th class="text-left">Nombre</th>
            <th class="text-left">{{ metaLabel }}</th>
            <th class="text-left">Estado</th>
            <th><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          <template v-if="loading">
            <tr v-for="n in 5" :key="n"><td v-for="c in 4" :key="c"><q-skeleton type="text" /></td></tr>
          </template>
          <template v-else>
            <tr v-for="it in current" :key="it.id">
              <td>{{ it.name }}</td>
              <td class="text-muted">{{ it.meta || '—' }}</td>
              <td><AlertBadge :label="it.isActive ? 'Activo' : 'Inactivo'" :tone="it.isActive ? 'green' : 'gray'" /></td>
              <td>
                <button v-if="session.isAdmin" type="button" class="link" @click="toggleActive(it)">
                  {{ it.isActive ? 'desactivar' : 'activar' }}
                </button>
              </td>
            </tr>
            <tr v-if="current.length === 0">
              <td colspan="4" class="text-center text-muted q-pa-lg">Sin registros.</td>
            </tr>
          </template>
        </tbody>
      </q-markup-table>
    </q-card>

    <div class="text-caption text-muted q-mt-sm">
      Las filiales de Cruz Roja se gestionan por evento (voluntariado); no son un catálogo editable aquí.
    </div>

    <!-- Diálogo: agregar registro (admin) -->
    <q-dialog v-model="showAdd" aria-label="Agregar al catálogo">
      <q-card style="min-width: 340px; max-width: 92vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-subtitle1">Agregar a {{ tab }}</div>
          <q-space />
          <q-btn type="button" icon="close" flat round dense v-close-popup aria-label="Cerrar" />
        </q-card-section>
        <q-form greedy @submit.prevent="agregar">
          <q-card-section class="q-gutter-sm">
            <q-input v-model="nuevo.name" label="Nombre *" outlined dense :rules="[req]" autofocus />
            <q-input v-model="nuevo.meta" :label="metaLabel" outlined dense />
          </q-card-section>
          <q-card-actions align="right" class="q-pr-md q-pb-md">
            <q-btn type="button" flat label="Cancelar" v-close-popup />
            <q-btn type="submit" color="primary" unelevated label="Agregar" :loading="saving" />
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
