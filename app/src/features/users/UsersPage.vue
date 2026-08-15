<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api, ApiError } from '@/services/api'
import { useSessionStore } from '@/stores/session'
import AlertBadge from '@/components/ui/AlertBadge.vue'
import type { AlertTone, Role } from '@/types'

interface ApiUser {
  id: string
  email: string
  displayName: string
  role: Role
  isActive: boolean
  lastLoginAt: number | null
  createdAt: number
}

const $q = useQuasar()
const session = useSessionStore()

const roles: Role[] = ['admin', 'coordinator', 'operator', 'consulta']
const roleLabel: Record<Role, string> = { admin: 'Admin', coordinator: 'Coordinador', operator: 'Operador', consulta: 'Consulta' }
const roleTone: Record<Role, AlertTone> = { admin: 'red', coordinator: 'celeste', operator: 'yellow', consulta: 'gray' }
const roleOptions = roles.map((r) => ({ label: roleLabel[r], value: r }))

function fmtDate(unix: number | null): string {
  if (!unix) return 'nunca'
  return new Date(unix * 1000).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const users = ref<ApiUser[]>([])
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get<{ items: ApiUser[] }>('/users')
    users.value = res.items
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'No se pudieron cargar los usuarios.'
  } finally {
    loading.value = false
  }
}
onMounted(load)

// --- Reglas ---
const req = (v: unknown) => (!!v && String(v).trim().length > 0) || 'Campo obligatorio'
const isEmail = (v: string) => /.+@.+\..+/.test(v) || 'Correo inválido'
const minPass = (v: string) => String(v ?? '').length >= 8 || 'Mínimo 8 caracteres'
const saving = ref(false)

// --- Invitar (crear) ---
const showInvite = ref(false)
const nuevo = reactive<{ displayName: string; email: string; role: Role | null; password: string }>({
  displayName: '',
  email: '',
  role: null,
  password: '',
})
function openInvite() {
  nuevo.displayName = ''
  nuevo.email = ''
  nuevo.role = null
  nuevo.password = ''
  showInvite.value = true
}
async function invitar() {
  saving.value = true
  try {
    await api.post('/users', { displayName: nuevo.displayName, email: nuevo.email, role: nuevo.role, password: nuevo.password })
    $q.notify({ type: 'positive', message: 'Usuario agregado', caption: nuevo.email, icon: 'person_add' })
    showInvite.value = false
    await load()
  } catch (e) {
    $q.notify({ type: 'negative', message: e instanceof ApiError ? e.message : 'No se pudo agregar el usuario' })
  } finally {
    saving.value = false
  }
}

// --- Editar (rol + activo) ---
const showEdit = ref(false)
const editing = ref<ApiUser | null>(null)
const editRole = ref<Role>('consulta')
const editActive = ref(true)
const newPass = ref('')
const resetting = ref(false)
function openEdit(u: ApiUser) {
  editing.value = u
  editRole.value = u.role
  editActive.value = u.isActive
  newPass.value = ''
  showEdit.value = true
}
// Recuperación de contraseña (opción admin): fija una clave nueva y se la entrega al usuario.
function sugerirClave() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const arr = new Uint32Array(12)
  crypto.getRandomValues(arr)
  newPass.value = Array.from(arr, (n) => abc[n % abc.length]).join('')
}
async function restablecerClave() {
  if (!editing.value || newPass.value.length < 8) return
  resetting.value = true
  try {
    await api.post(`/users/${editing.value.id}/password`, { password: newPass.value })
    $q.notify({
      type: 'positive',
      message: 'Contraseña restablecida',
      caption: 'Entrégasela al usuario de forma segura.',
      icon: 'lock_reset',
    })
    newPass.value = ''
  } catch (e) {
    $q.notify({ type: 'negative', message: e instanceof ApiError ? e.message : 'No se pudo restablecer' })
  } finally {
    resetting.value = false
  }
}
async function guardarEdit() {
  if (!editing.value) return
  saving.value = true
  try {
    await api.patch(`/users/${editing.value.id}`, { role: editRole.value, isActive: editActive.value })
    $q.notify({ type: 'positive', message: 'Usuario actualizado', caption: editing.value.email })
    showEdit.value = false
    await load()
  } catch (e) {
    $q.notify({ type: 'negative', message: e instanceof ApiError ? e.message : 'No se pudo actualizar' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <q-page class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <h1 class="text-h6">Usuarios</h1>
      <q-space />
      <q-btn color="primary" unelevated size="sm" icon="add" label="Invitar usuario" @click="openInvite" />
    </div>

    <q-banner v-if="error" rounded class="bg-red-1 text-red-9 q-mb-md">
      {{ error }}
      <template #action><q-btn flat label="Reintentar" @click="load" /></template>
    </q-banner>

    <div class="text-caption text-muted q-mb-sm">
      No hay auto-registro: el administrador agrega usuarios por correo y les asigna un rol.
    </div>

    <q-card flat bordered>
      <q-markup-table flat tabindex="0" aria-label="Usuarios">
        <thead>
          <tr>
            <th class="text-left">Nombre</th>
            <th class="text-left">Correo</th>
            <th class="text-left">Rol</th>
            <th class="text-left">Estado</th>
            <th class="text-left">Último ingreso</th>
            <th><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          <template v-if="loading">
            <tr v-for="n in 4" :key="n">
              <td v-for="c in 6" :key="c"><q-skeleton type="text" /></td>
            </tr>
          </template>
          <template v-else>
            <tr v-for="u in users" :key="u.id">
              <td>{{ u.displayName }}</td>
              <td>{{ u.email }}</td>
              <td><AlertBadge :label="roleLabel[u.role]" :tone="roleTone[u.role]" /></td>
              <td><AlertBadge :label="u.isActive ? 'Activo' : 'Inactivo'" :tone="u.isActive ? 'green' : 'gray'" /></td>
              <td class="tabular text-muted">{{ fmtDate(u.lastLoginAt) }}</td>
              <td>
                <button
                  type="button"
                  class="link"
                  :disabled="u.id === session.user?.id"
                  :title="u.id === session.user?.id ? 'No puedes editarte a ti mismo' : ''"
                  @click="openEdit(u)"
                >
                  editar
                </button>
              </td>
            </tr>
            <tr v-if="users.length === 0">
              <td colspan="6" class="text-center text-muted q-pa-lg">Aún no hay usuarios.</td>
            </tr>
          </template>
        </tbody>
      </q-markup-table>
    </q-card>

    <!-- Invitar usuario -->
    <q-dialog v-model="showInvite" aria-label="Invitar usuario">
      <q-card style="min-width: 360px; max-width: 92vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-subtitle1">Invitar usuario</div>
          <q-space />
          <q-btn type="button" icon="close" flat round dense v-close-popup aria-label="Cerrar" />
        </q-card-section>
        <q-form greedy @submit.prevent="invitar">
          <q-card-section class="q-gutter-sm">
            <q-input v-model="nuevo.displayName" label="Nombre *" outlined dense :rules="[req]" autofocus />
            <q-input v-model="nuevo.email" label="Correo *" type="email" outlined dense :rules="[req, isEmail]" />
            <q-select v-model="nuevo.role" :options="roleOptions" label="Rol *" outlined dense emit-value map-options :rules="[req]" />
            <q-input
              v-model="nuevo.password"
              label="Clave inicial *"
              type="text"
              outlined
              dense
              :rules="[req, minPass]"
              hint="Se la entregas al usuario; luego la puede cambiar."
            />
          </q-card-section>
          <q-card-actions align="right" class="q-pr-md q-pb-md">
            <q-btn type="button" flat label="Cancelar" v-close-popup />
            <q-btn type="submit" color="primary" unelevated label="Agregar usuario" :loading="saving" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- Editar usuario -->
    <q-dialog v-model="showEdit" aria-label="Editar usuario">
      <q-card style="min-width: 340px; max-width: 92vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-subtitle1">Editar usuario</div>
          <q-space />
          <q-btn type="button" icon="close" flat round dense v-close-popup aria-label="Cerrar" />
        </q-card-section>
        <q-card-section class="q-gutter-sm">
          <div class="text-body2">
            {{ editing?.displayName }} <span class="text-muted">· {{ editing?.email }}</span>
          </div>
          <q-select v-model="editRole" :options="roleOptions" label="Rol" outlined dense emit-value map-options />
          <q-toggle v-model="editActive" :label="editActive ? 'Activo (puede ingresar)' : 'Inactivo (no puede ingresar)'" />

          <q-separator class="q-my-sm" />
          <div class="text-caption text-muted">Recuperar contraseña: el administrador fija una clave nueva y se la entrega al usuario.</div>
          <q-input
            v-model="newPass"
            label="Nueva contraseña"
            type="text"
            outlined
            dense
            hint="Mínimo 8 caracteres. Queda visible para que la copies."
            :rules="[(v: string) => !v || v.length >= 8 || 'Mínimo 8 caracteres']"
          >
            <template #append>
              <q-btn flat dense no-caps size="sm" icon="casino" label="Generar" @click="sugerirClave" />
            </template>
          </q-input>
          <div class="row justify-end">
            <q-btn
              type="button"
              outline
              size="sm"
              color="primary"
              icon="lock_reset"
              label="Restablecer contraseña"
              :loading="resetting"
              :disable="newPass.length < 8"
              @click="restablecerClave"
            />
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pr-md q-pb-md">
          <q-btn type="button" flat label="Cancelar" v-close-popup />
          <q-btn type="button" color="primary" unelevated label="Guardar" :loading="saving" @click="guardarEdit" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>
