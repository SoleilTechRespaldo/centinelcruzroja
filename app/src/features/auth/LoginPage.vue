<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BrandMark from '@/components/ui/BrandMark.vue'

const router = useRouter()
const email = ref('operador@cruzroja.cl')
const password = ref('claveDemo')

function ingresar() {
  router.push('/dashboard')
}
</script>

<template>
  <q-card flat bordered class="login-card">
    <div class="text-center">
      <BrandMark :size="52" />
      <div class="text-h5 text-weight-bold q-mt-sm">Centinela</div>
      <div class="text-caption text-muted q-mb-md">Monitoreo Regional · Región de Valparaíso</div>
    </div>
    <q-input v-model="email" label="Correo" outlined dense class="q-mb-sm" />
    <q-input v-model="password" label="Contraseña" type="password" outlined dense class="q-mb-md" />
    <q-btn color="primary" unelevated class="full-width" label="Ingresar" @click="ingresar" />
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
