import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({ template: { transformAssetUrls } }),
    quasar({}),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Centinela — Monitoreo Regional',
        short_name: 'Centinela',
        description: 'Apoyo al monitoreo situacional y generación del BIE — Cruz Roja Valparaíso',
        lang: 'es',
        theme_color: '#1E222B',
        background_color: '#F5F6F8',
        display: 'standalone',
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
