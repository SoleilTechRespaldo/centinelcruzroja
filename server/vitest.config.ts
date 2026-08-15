import { defineConfig } from 'vitest/config'

// Pruebas de integración del API sobre una BD SQLite EN MEMORIA (no toca local.db).
// El setup fija las variables de entorno y siembra antes de cada archivo.
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    setupFiles: ['./test/setup.ts'],
    fileParallelism: false,
  },
})
