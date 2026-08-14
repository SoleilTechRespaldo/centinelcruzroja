<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import { ApiError } from '@/services/api'
import BrandMark from '@/components/ui/BrandMark.vue'

const router = useRouter()
const session = useSessionStore()
const email = ref('njerez@cruzroja.cl')
const password = ref('centinela1234')
const loading = ref(false)
const errorMsg = ref('')

const req = (v: unknown) => (!!v && String(v).trim().length > 0) || 'Campo obligatorio'
const isEmail = (v: string) => /.+@.+\..+/.test(v) || 'Correo inválido'

async function ingresar() {
  loading.value = true
  errorMsg.value = ''
  try {
    await session.login(email.value, password.value)
    router.push('/estadisticas')
  } catch (e) {
    errorMsg.value = e instanceof ApiError ? e.message : 'No se pudo iniciar sesión.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <q-card flat bordered class="login-card">
    <div class="text-center">
      <BrandMark :size="52" />
      <h1 class="text-h5 text-weight-bold q-mt-sm">Centinela</h1>
      <div class="text-caption text-muted q-mb-md">Monitoreo Regional · Región de Valparaíso</div>
    </div>
    <q-banner v-if="errorMsg" dense rounded class="bg-red-1 text-red-9 q-mb-sm">{{ errorMsg }}</q-banner>
    <q-form greedy @submit.prevent="ingresar">
      <q-input v-model="email" label="Correo" type="email" outlined dense class="q-mb-sm" :rules="[req, isEmail]" />
      <q-input v-model="password" label="Contraseña" type="password" outlined dense class="q-mb-md" :rules="[req]" />
      <q-btn type="submit" color="primary" unelevated class="full-width" label="Ingresar" :loading="loading" />
    </q-form>
    <div class="text-caption text-muted text-center q-mt-lg">
      Hecho por SoleilTech para<br />Cruz Roja Chilena — Comité Regional Valparaíso
    </div>
  </q-card>
</template>

<style scoped>
.login-card {
  width: 360px;
  max-width: 100%;
  padding: 28px 26px;
  border-radius: 12px;
  background: #fff;
}
</style>
