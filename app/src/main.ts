import { createApp } from 'vue'
import { Quasar, Notify, Dialog } from 'quasar'
import { createPinia } from 'pinia'
import router from './router'

import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/dist/quasar.css'
import './css/app.scss'

import App from './App.vue'

const app = createApp(App)
app.use(Quasar, { plugins: { Notify, Dialog } })
app.use(createPinia())
app.use(router)

// La restauración de sesión la hace el guard del router (espera /auth/me una vez),
// así que aquí solo montamos.
app.mount('#app')
