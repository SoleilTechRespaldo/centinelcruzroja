<script setup lang="ts">
import { useQuasar } from 'quasar'

const $q = useQuasar()
function agregarCamara() {
  $q.notify({ type: 'info', message: 'Agregar cámara', caption: 'Pega un enlace público de YouTube' })
}

const cams = [
  { zone: 'Bahía de Valparaíso', src: 'Puerto · fuente pública YouTube', live: true },
  { zone: 'Borde costero Viña del Mar', src: 'Playa · fuente pública YouTube', live: true },
  { zone: 'Quintero — zona industrial', src: 'Sin señal ahora · reintentar', live: false },
]
</script>

<template>
  <q-page class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <div>
        <h1 class="text-h6">Cámaras en vivo</h1>
        <div class="text-caption text-muted">Transmisiones curadas de YouTube por zona · embed oficial</div>
      </div>
      <q-space />
      <q-btn color="primary" unelevated size="sm" icon="add" label="Agregar cámara" @click="agregarCamara" />
    </div>

    <div class="row q-col-gutter-md">
      <div v-for="c in cams" :key="c.zone" class="col-12 col-sm-6 col-md-4">
        <q-card flat bordered>
          <div class="cam" role="img" :aria-label="c.live ? 'Transmisión en vivo — ' + c.zone : c.zone + ' — sin señal'">
            <q-badge :color="c.live ? 'negative' : 'grey'" class="cam-badge">{{ c.live ? 'EN VIVO' : 'OFFLINE' }}</q-badge>
            <span>{{ c.live ? '▶ transmisión en vivo (YouTube)' : '▶ sin señal' }}</span>
          </div>
          <div class="q-pa-sm">
            <div class="text-weight-medium">{{ c.zone }}</div>
            <div class="text-caption text-muted">{{ c.src }}</div>
          </div>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-4">
        <q-card
          flat
          bordered
          class="cam-add cursor-pointer"
          role="button"
          tabindex="0"
          @click="agregarCamara"
          @keydown.enter.prevent="agregarCamara"
          @keydown.space.prevent="agregarCamara"
          >+ Agregar cámara (link de YouTube)</q-card
        >
      </div>
    </div>

    <div class="text-caption text-muted q-mt-md">
      Catálogo curado por el operador. Descubrimiento opcional vía YouTube Data API (cuota gratuita). No se descargan ni redistribuyen los
      streams.
    </div>
  </q-page>
</template>

<style scoped>
.cam {
  position: relative;
  background: #0b0b0b;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8a93a0;
  font-size: 13px;
}
.cam-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  font-weight: 600;
}
.cam-add {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 190px;
  color: var(--c-text2);
  border-style: dashed;
}
</style>
