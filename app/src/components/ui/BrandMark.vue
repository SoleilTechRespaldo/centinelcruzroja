<script setup lang="ts">
const props = defineProps<{ white?: boolean; size?: number }>()
const tower = props.white ? '#ffffff' : '#1e222b'
const door = props.white ? '#1e222b' : '#f5f6f8'
const sz = props.size ?? 28
</script>

<template>
  <svg :width="sz" :height="sz" viewBox="0 0 64 64" aria-hidden="true">
    <rect x="15" y="20" width="6" height="7" :fill="tower" />
    <rect x="29" y="20" width="6" height="7" :fill="tower" />
    <rect x="43" y="20" width="6" height="7" :fill="tower" />
    <rect x="14" y="27" width="36" height="5" :fill="tower" />
    <polygon points="19,32 45,32 47,57 17,57" :fill="tower" />
    <path d="M27 57 L27 49 Q27 45 32 45 Q37 45 37 49 L37 57 Z" :fill="door" />
    <circle cx="32" cy="14" r="4" fill="#e30613" />
    <line x1="25" y1="14" x2="21" y2="14" stroke="#e30613" stroke-width="2" stroke-linecap="round" />
    <line x1="39" y1="14" x2="43" y2="14" stroke="#e30613" stroke-width="2" stroke-linecap="round" />
  </svg>
</template>
