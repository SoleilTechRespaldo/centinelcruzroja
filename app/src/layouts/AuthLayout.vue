<template>
  <div class="auth-wrap">
    <router-view />
  </div>
</template>

<style scoped>
.auth-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--c-bg);
  padding: 16px;
}
</style>
