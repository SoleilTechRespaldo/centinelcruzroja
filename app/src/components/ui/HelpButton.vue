<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { helpForRoute } from '@/help/content'

const route = useRoute()
const router = useRouter()
const open = ref(false)
const topic = computed(() => helpForRoute(route.name as string | undefined))

function verGuia() {
  open.value = false
  router.push('/ayuda')
}
</script>

<template>
  <q-btn dense flat round icon="help_outline" class="help-trigger" aria-label="¿Cómo funciona esta pantalla?" @click="open = true">
    <q-tooltip>¿Cómo funciona?</q-tooltip>
  </q-btn>

  <q-dialog v-model="open" position="right" aria-label="Ayuda de la pantalla">
    <q-card class="help-panel">
      <q-card-section class="row items-center q-pb-sm help-head">
        <q-icon name="help_outline" color="primary" size="22px" class="q-mr-sm" />
        <div class="text-subtitle1">{{ topic ? topic.title : 'Ayuda' }}</div>
        <q-space />
        <q-btn v-close-popup dense flat round icon="close" aria-label="Cerrar ayuda" />
      </q-card-section>

      <q-separator />

      <q-card-section v-if="topic" class="help-body">
        <p class="help-intro">{{ topic.intro }}</p>

        <template v-if="topic.bullets && topic.bullets.length">
          <div class="help-sub">En resumen</div>
          <ul class="help-list">
            <li v-for="(b, i) in topic.bullets" :key="i">{{ b }}</li>
          </ul>
        </template>

        <template v-if="topic.buttons && topic.buttons.length">
          <div class="help-sub">Qué hace cada botón</div>
          <div v-for="(btn, i) in topic.buttons" :key="i" class="help-btn-row">
            <span class="help-btn-name">{{ btn.label }}</span>
            <span class="help-btn-desc">{{ btn.desc }}</span>
          </div>
        </template>
      </q-card-section>

      <q-card-section v-else class="help-body text-muted">
        No hay una ayuda específica para esta pantalla todavía. Revisa la guía general.
      </q-card-section>

      <q-separator />
      <q-card-actions align="between" class="q-px-md q-py-sm">
        <span class="text-caption text-muted">Apoyo, no oficial · humano al centro</span>
        <q-btn dense flat color="primary" icon="menu_book" label="Guía completa" @click="verGuia" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.help-panel {
  width: 380px;
  max-width: 94vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  border-radius: 0;
}
.help-head {
  flex: 0 0 auto;
}
.help-body {
  flex: 1 1 auto;
  overflow-y: auto;
}
.help-intro {
  color: var(--c-text2);
  margin: 0 0 12px;
  line-height: 1.5;
}
.help-sub {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--c-muted);
  font-weight: 600;
  margin: 14px 0 6px;
}
.help-list {
  margin: 0 0 4px;
  padding-left: 18px;
}
.help-list li {
  margin-bottom: 6px;
  color: var(--c-text2);
  line-height: 1.45;
}
.help-btn-row {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 7px 0;
  border-bottom: 1px solid var(--c-border);
}
.help-btn-name {
  font-weight: 600;
  font-size: 13px;
  color: var(--c-text);
}
.help-btn-desc {
  font-size: 13px;
  color: var(--c-text2);
  line-height: 1.4;
}
.help-trigger {
  color: #c9cdd4;
}
</style>
