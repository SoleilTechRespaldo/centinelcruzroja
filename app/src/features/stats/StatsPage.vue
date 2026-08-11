<script setup lang="ts">
const kpis = [
  { label: 'Eventos 2026', value: '42' },
  { label: 'Alertas rojas', value: '7', color: 'var(--al-red)' },
  { label: 'BIE emitidos', value: '156' },
  { label: 'Comuna + eventos', value: 'Valparaíso' },
]
const porTipo = [
  { label: 'Sistema frontal', n: 14, pct: 74 },
  { label: 'Incendio forestal', n: 9, pct: 48 },
  { label: 'Marejadas', n: 7, pct: 37 },
  { label: 'Sismo', n: 6, pct: 32 },
  { label: 'Corte servicios', n: 6, pct: 32 },
]
const porMes = [
  { label: 'Marzo', n: 4, pct: 33 },
  { label: 'Abril', n: 3, pct: 25 },
  { label: 'Mayo', n: 5, pct: 42 },
  { label: 'Junio', n: 8, pct: 67 },
  { label: 'Julio', n: 12, pct: 100 },
  { label: 'Agosto', n: 10, pct: 83 },
]
</script>

<template>
  <q-page class="q-pa-lg">
    <div class="text-h6 q-mb-md">Estadísticas</div>

    <div class="row q-col-gutter-sm q-mb-md">
      <div v-for="k in kpis" :key="k.label" class="col-6 col-md-3">
        <q-card flat bordered class="q-pa-md">
          <div class="text-caption text-muted">{{ k.label }}</div>
          <div class="text-h6 text-weight-bold" :style="k.color ? { color: k.color } : undefined">{{ k.value }}</div>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-card flat bordered class="q-pa-md">
          <div class="sec-title q-mb-md">Eventos por tipo</div>
          <div v-for="b in porTipo" :key="b.label" class="bar-row">
            <span class="bar-label">{{ b.label }}</span>
            <div class="bar-track"><div class="bar-fill" :style="{ width: b.pct + '%', background: 'var(--c-red)' }" /></div>
            <span class="bar-val tabular">{{ b.n }}</span>
          </div>
        </q-card>
      </div>
      <div class="col-12 col-md-6">
        <q-card flat bordered class="q-pa-md">
          <div class="sec-title q-mb-md">Eventos por mes</div>
          <div v-for="b in porMes" :key="b.label" class="bar-row">
            <span class="bar-label" style="width: 60px">{{ b.label }}</span>
            <div class="bar-track"><div class="bar-fill" :style="{ width: b.pct + '%', background: 'var(--grafito)' }" /></div>
            <span class="bar-val tabular">{{ b.n }}</span>
          </div>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 9px; }
.bar-label { width: 120px; font-size: 13px; color: var(--c-text2); }
.bar-track { flex: 1; background: var(--c-surface2); border-radius: 4px; height: 14px; }
.bar-fill { height: 14px; border-radius: 4px; }
.bar-val { width: 22px; text-align: right; font-size: 12px; }
</style>
