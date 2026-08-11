<script setup lang="ts">
import { ref } from 'vue'
import BrandMark from '@/components/ui/BrandMark.vue'

const drawer = ref(true)
const nav = [
  { label: 'Dashboard', to: '/dashboard', icon: 'dashboard' },
  { label: 'Incidentes', to: '/incidents', icon: 'warning_amber' },
]
</script>

<template>
  <q-layout view="hHh Lpr lFf">
    <q-header class="topbar text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" class="lt-md" @click="drawer = !drawer" />
        <BrandMark white :size="26" />
        <span class="brand-name q-ml-sm">Centinela</span>
        <span class="brand-sub q-ml-sm gt-xs">Sala de crisis</span>
        <q-space />
        <span class="region q-mr-md gt-xs">Región de Valparaíso</span>
        <q-avatar size="30px" color="grey-9" text-color="white">NJ</q-avatar>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawer" show-if-above :width="220" class="sidebar" bordered>
      <q-list padding>
        <q-item
          v-for="it in nav"
          :key="it.to"
          v-ripple
          clickable
          :to="it.to"
          active-class="nav-active"
        >
          <q-item-section avatar><q-icon :name="it.icon" size="20px" /></q-item-section>
          <q-item-section>{{ it.label }}</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style scoped>
.topbar { background: var(--grafito); }
.brand-name { font-weight: 600; font-size: 16px; }
.brand-sub { color: #aeb4c0; font-size: 13px; font-weight: 400; }
.region { color: #c9cdd4; font-size: 13px; }
.sidebar :deep(.q-item) { border-radius: 8px; margin: 2px 8px; color: var(--c-text2); font-weight: 500; }
.sidebar :deep(.nav-active) {
  color: var(--c-red);
  background: #fdecec;
}
</style>
