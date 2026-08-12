<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useQuasar } from 'quasar'
import AlertBadge from '@/components/ui/AlertBadge.vue'
import type { AlertTone } from '@/types'

interface User { name: string; email: string; role: string; tone: AlertTone; active: boolean; last: string }

const $q = useQuasar()
const users = ref<User[]>([
  { name: 'Nicolás Jerez', email: 'njerez@cruzroja.cl', role: 'Admin', tone: 'red', active: true, last: 'hoy 15:40' },
  { name: 'Ive Manni', email: 'imanni@cruzroja.cl', role: 'Coordinador', tone: 'celeste', active: true, last: 'hoy 12:10' },
  { name: 'Operador Sala', email: 'sala@cruzroja.cl', role: 'Operador', tone: 'yellow', active: true, last: 'ayer 22:05' },
  { name: 'Consulta DEM', email: 'dem@cruzroja.cl', role: 'Consulta', tone: 'gray', active: false, last: '02/08' },
])

const roles = ['Admin', 'Coordinador', 'Operador', 'Consulta']
const roleTone: Record<string, AlertTone> = { Admin: 'red', Coordinador: 'celeste', Operador: 'yellow', Consulta: 'gray' }

// Invitar
const showInvite = ref(false)
const nuevo = reactive<{ name: string; email: string; role: string | null }>({ name: '', email: '', role: null })
const req = (v: unknown) => (!!v && String(v).trim().length > 0) || 'Campo obligatorio'
const isEmail = (v: string) => /.+@.+\..+/.test(v) || 'Correo inválido'

function openInvite() {
  nuevo.name = ''
  nuevo.email = ''
  nuevo.role = null
  showInvite.value = true
}
function invitar() {
  const role = nuevo.role ?? 'Consulta'
  users.value.push({ name: nuevo.name, email: nuevo.email, role, tone: roleTone[role] ?? 'gray', active: true, last: 'nunca' })
  $q.notify({ type: 'positive', message: 'Invitación enviada', caption: `${nuevo.name} · ${role}`, icon: 'mail' })
  showInvite.value = false
}
function editar(u: User) {
  $q.notify({ type: 'info', message: 'Editar usuario', caption: u.name })
}
</script>

<template>
  <q-page class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <div class="text-h6">Usuarios</div>
      <q-space />
      <q-btn color="primary" unelevated size="sm" icon="add" label="Invitar usuario" @click="openInvite" />
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
            <td><button type="button" class="link" @click="editar(u)">editar</button></td>
          </tr>
        </tbody>
      </q-markup-table>
    </q-card>

    <!-- Diálogo: invitar usuario -->
    <q-dialog v-model="showInvite">
      <q-card style="min-width: 360px; max-width: 92vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-subtitle1">Invitar usuario</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup aria-label="Cerrar" />
        </q-card-section>
        <q-form greedy @submit.prevent="invitar">
          <q-card-section class="q-gutter-sm">
            <q-input v-model="nuevo.name" label="Nombre *" outlined dense :rules="[req]" autofocus />
            <q-input v-model="nuevo.email" label="Correo *" type="email" outlined dense :rules="[req, isEmail]" />
            <q-select v-model="nuevo.role" :options="roles" label="Rol *" outlined dense :rules="[req]" />
          </q-card-section>
          <q-card-actions align="right" class="q-pr-md q-pb-md">
            <q-btn type="button" flat label="Cancelar" v-close-popup />
            <q-btn type="submit" color="primary" unelevated label="Enviar invitación" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>
