import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'

// Configuración única (flat) para el monorepo: backend (server/) y frontend (app/).
// TypeScript ya verifica variables no definidas, así que apagamos no-undef.
export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/dev-dist/**', '**/node_modules/**', '**/.quasar/**', 'server/drizzle/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  // Frontend: componentes Vue con <script setup lang="ts">.
  {
    files: ['app/**/*.{ts,vue}'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
  },
  // Ajustes transversales.
  {
    rules: {
      'no-undef': 'off',
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
    },
  },
)
