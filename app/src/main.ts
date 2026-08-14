import { createApp } from 'vue'
import { Quasar, Notify, Dialog } from 'quasar'
import { createPinia } from 'pinia'
import router from './router'
import { useSessionStore } from './stores/session'

import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/dist/quasar.css'
import './css/app.scss'

import App from './App.vue'

const app = createApp(App)
app.use(Quasar, { plugins: { Notify, Dialog } })
app.use(createPinia())
app.use(router)

// Restaurar la sesión (token) antes de montar, para que el guard del router la vea.
useSessionStore().restore()

app.mount('#app')
