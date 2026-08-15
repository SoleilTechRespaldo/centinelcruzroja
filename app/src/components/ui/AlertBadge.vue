<script setup lang="ts">
type Tone = 'green' | 'celeste' | 'yellow' | 'red' | 'gray'
defineProps<{ label: string; tone: Tone }>()
</script>

<template>
  <span class="badge" :class="'b-' + tone"> <span class="dot" />{{ label }} </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.b-green {
  background: var(--al-green-bg);
  color: var(--al-green-t);
}
.b-green .dot {
  background: var(--al-green);
}
.b-celeste {
  background: var(--al-celeste-bg);
  color: var(--al-celeste-t);
}
.b-celeste .dot {
  background: var(--al-celeste);
}
.b-yellow {
  background: var(--al-yellow-bg);
  color: var(--al-yellow-t);
}
.b-yellow .dot {
  background: var(--al-yellow);
}
.b-red {
  background: var(--al-red-bg);
  color: var(--al-red-t);
}
.b-red .dot {
  background: var(--al-red);
}
.b-gray {
  background: var(--c-surface2);
  color: var(--c-text2);
}
.b-gray .dot {
  background: var(--c-muted);
}
</style>
