<script setup lang="ts">
import { useRouter } from 'vue-router'
import { helpByRoute, guideOrder, workflowSteps } from '@/help/content'

const router = useRouter()

// Mapea cada sección de la guía a su ruta, para poder abrirla desde aquí.
const routeBySection: Record<string, string> = {
  estadisticas: '/estadisticas',
  incidents: '/incidents',
  bandeja: '/bandeja',
  bie: '/bie',
  expediente: '/expediente',
  map: '/map',
  cameras: '/cameras',
  catalogs: '/catalogs',
  users: '/users',
}
const sections = guideOrder.map((k) => ({ key: k, to: routeBySection[k], ...helpByRoute[k] }))

const reglas = [
  'Nada entra al BIE sin visto bueno humano.',
  'Sin dato: usa N/A (no aplica) o “En evaluación” (aplica pero aún sin dato). No inventar.',
  'El BIE nunca lleva teléfonos ni datos sensibles de personas.',
  'Toda cifra lleva fuente y hora.',
]
</script>

<template>
  <q-page class="q-pa-lg">
    <h1 class="text-h6 q-mb-xs">Guía de uso</h1>
    <p class="text-body2 text-muted q-mb-lg" style="max-width: 760px">
      Centinela es una herramienta de <b>apoyo</b> al monitoreo y a la generación del <b>BIE</b> de la Cruz Roja Valparaíso.
      No es oficial, no emite alertas y no publica sola: <b>siempre decide una persona</b>. En cada pantalla tienes el botón
      <q-icon name="help_outline" /> <b>“¿Cómo funciona?”</b> arriba a la derecha.
    </p>

    <!-- Circuito -->
    <div class="sec-title q-mb-sm">El circuito completo</div>
    <div class="row q-col-gutter-sm q-mb-lg">
      <div v-for="s in workflowSteps" :key="s.n" class="col-12 col-sm-6 col-md-4">
        <q-card flat bordered class="q-pa-md full-height step">
          <div class="step-n">{{ s.n }}</div>
          <div class="step-title">{{ s.title }}</div>
          <div class="step-text">{{ s.text }}</div>
        </q-card>
      </div>
    </div>

    <!-- Pantallas -->
    <div class="sec-title q-mb-sm">Las pantallas</div>
    <div class="row q-col-gutter-sm q-mb-lg">
      <div v-for="s in sections" :key="s.key" class="col-12 col-md-6">
        <q-card flat bordered class="q-pa-md full-height">
          <div class="row items-center q-mb-xs">
            <div class="text-subtitle2">{{ s.title }}</div>
            <q-space />
            <q-btn dense flat size="sm" color="primary" label="Abrir" @click="router.push(s.to)" />
          </div>
          <div class="text-body2 text-muted q-mb-sm">{{ s.intro }}</div>
          <ul v-if="s.bullets" class="guide-list">
            <li v-for="(b, i) in s.bullets" :key="i">{{ b }}</li>
          </ul>
        </q-card>
      </div>
    </div>

    <!-- Reglas de oro -->
    <q-card flat bordered class="q-pa-md reglas">
      <div class="sec-title q-mb-sm">Reglas de oro</div>
      <ul class="guide-list">
        <li v-for="(r, i) in reglas" :key="i">{{ r }}</li>
      </ul>
    </q-card>
  </q-page>
</template>

<style scoped>
.full-height {
  height: 100%;
}
.step {
  position: relative;
}
.step-n {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--c-red);
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}
.step-title {
  font-weight: 600;
  margin-bottom: 4px;
}
.step-text {
  font-size: 13px;
  color: var(--c-text2);
  line-height: 1.45;
}
.guide-list {
  margin: 0;
  padding-left: 18px;
}
.guide-list li {
  margin-bottom: 6px;
  color: var(--c-text2);
  line-height: 1.45;
}
.reglas {
  background: var(--c-bg2, #f7f8fa);
}
</style>
