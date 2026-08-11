<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <q-page class="q-pa-lg">
    <div class="text-h6">Estados de las vistas</div>
    <div class="text-caption text-muted q-mb-md">Patrones reutilizables: vacío · carga · error/offline</div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-4">
        <q-card flat bordered class="q-pa-md">
          <div class="sec-title q-mb-sm">Vacío</div>
          <div class="text-center q-py-md">
            <div class="text-subtitle2">Aún no hay incidentes</div>
            <p class="text-caption text-muted q-mb-md">Crea el primero para empezar a monitorear.</p>
            <q-btn color="primary" unelevated size="sm" icon="add" label="Nuevo incidente" @click="router.push('/incidents/new')" />
          </div>
        </q-card>
      </div>
      <div class="col-12 col-md-4">
        <q-card flat bordered class="q-pa-md">
          <div class="sec-title q-mb-sm">Cargando</div>
          <q-skeleton height="14px" class="q-mb-sm" />
          <q-skeleton height="14px" width="80%" class="q-mb-sm" />
          <q-skeleton height="14px" width="55%" class="q-mb-md" />
          <q-skeleton height="40px" />
        </q-card>
      </div>
      <div class="col-12 col-md-4">
        <q-card flat bordered class="q-pa-md">
          <div class="sec-title q-mb-sm">Error / offline</div>
          <q-banner dense class="err q-mb-sm">No pudimos cargar los datos. <a class="link">Reintentar</a></q-banner>
          <q-banner dense class="warn">Trabajando sin conexión. Los cambios se sincronizarán al reconectar.</q-banner>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.err { background: var(--al-red-bg); color: var(--al-red-t); border-radius: 8px; }
.warn { background: var(--al-yellow-bg); color: var(--al-yellow-t); border-radius: 8px; }
</style>
