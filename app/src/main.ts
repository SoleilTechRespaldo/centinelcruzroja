import { createApp } from 'vue'
import { Quasar, Notify, Dialog } from 'quasar'
import { createPinia } from 'pinia'
import router from './router'

import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/dist/quasar.css'
import './css/app.scss'

import App from './App.vue'

createApp(App)
  .use(Quasar, { plugins: { Notify, Dialog } })
  .use(createPinia())
  .use(router)
  .mount('#app')
