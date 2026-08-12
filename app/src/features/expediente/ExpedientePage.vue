<script setup lang="ts">
import { ref } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
function exportar() {
  $q.notify({ type: 'ongoing', message: 'Exportando expediente…', timeout: 900 })
}

const conclusiones = ref(
  'Coordinación oportuna con COGRID. Reforzar stock de impermeables y botas. La filial Quintero requiere acceso alternativo ante inundación del ingreso.',
)

const metrics = [
  { label: 'Duración', value: '3 días' },
  { label: 'BIE emitidos', value: '3' },
  { label: 'Evidencias', value: '14' },
  { label: 'Fuentes', value: '9' },
  { label: 'Comunas', value: '5' },
]
const timeline = [
  { at: '08/08 · 09:05', text: 'ATP SENAPRED' },
  { at: '08/08 · 14:00', text: 'Alerta Amarilla (5 comunas)' },
  { at: '09/08 · 12:00', text: 'BIE v2 aprobado' },
  { at: '11/08 · 10:00', text: 'Cierre del evento' },
]
</script>

<template>
  <q-page class="q-pa-lg">
    <div class="row items-start q-mb-md">
      <div>
        <div class="text-caption tabular text-muted">Expediente · 2026-0015</div>
        <div class="text-h6">Sistema frontal zona centro</div>
      </div>
      <q-space />
      <q-btn dense outline size="sm" label="Exportar expediente" @click="exportar" />
    </div>

    <div class="row q-col-gutter-sm q-mb-md">
      <div v-for="m in metrics" :key="m.label" class="col">
        <q-card flat bordered class="q-pa-md">
          <div class="text-caption text-muted">{{ m.label }}</div>
          <div class="text-subtitle1 text-weight-bold">{{ m.value }}</div>
        </q-card>
      </div>
    </div>

    <q-card flat bordered class="q-pa-md q-mb-md">
      <div class="sec-title q-mb-sm">Resumen</div>
      <p class="q-mb-none">Sistema frontal (08–11/08) con Alerta Amarilla en 5 comunas; 2.350 afectados, 72 voluntarios de 6 filiales. Evento cerrado el 11/08.</p>
    </q-card>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-card flat bordered class="q-pa-md">
          <div class="sec-title q-mb-sm">Cronología completa</div>
          <q-timeline color="negative">
            <q-timeline-entry v-for="(t, i) in timeline" :key="i" :subtitle="t.at">{{ t.text }}</q-timeline-entry>
          </q-timeline>
        </q-card>
      </div>
      <div class="col-12 col-md-6">
        <q-card flat bordered class="q-pa-md">
          <div class="sec-title q-mb-sm">Conclusiones y lecciones aprendidas</div>
          <q-input v-model="conclusiones" type="textarea" outlined autogrow />
        </q-card>
      </div>
    </div>
  </q-page>
</template>
