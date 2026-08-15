<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useData } from '@/services/data'
import { ApiError } from '@/services/api'
import type { IncidentStatus, AlertSenapred, AlertCruzRoja } from '@/types'

const router = useRouter()
const $q = useQuasar()
const data = useData()

const estadoMap: Record<string, IncidentStatus> = { Monitoreo: 'monitoring', Activo: 'active', Cerrado: 'closed' }
const senapredMap: Record<string, AlertSenapred> = { 'Sin alerta': 'none', 'Temprana Preventiva': 'atp', Amarilla: 'yellow', Roja: 'red' }
const cruzRojaMap: Record<string, AlertCruzRoja> = { Verde: 'green', Amarilla: 'yellow', Roja: 'red' }

const titulo = ref('')
const tipo = ref<string | null>(null)
const inicio = ref('')
const estado = ref('Monitoreo')
const senapred = ref('Sin alerta')
const cruzRoja = ref('Verde')
const descripcion = ref('')
const comunas = ref<string[]>([])
const saving = ref(false)

const tipos = [
  'Sistema frontal',
  'Incendio forestal',
  'Sismo',
  'Marejada',
  'Aluvión / remoción en masa',
  'Corte eléctrico',
  'Corte de agua',
]
const estados = ['Monitoreo', 'Activo', 'Cerrado']
const senapredOpts = ['Sin alerta', 'Temprana Preventiva', 'Amarilla', 'Roja']
const crOpts = ['Verde', 'Amarilla', 'Roja']
const comunasOpts = [
  'Valparaíso',
  'Viña del Mar',
  'Quilpué',
  'Villa Alemana',
  'Limache',
  'Concón',
  'Quintero',
  'Quillota',
  'Olmué',
  'Casablanca',
]

// Reglas de validación
const req = (v: unknown) => (!!v && String(v).trim().length > 0) || 'Campo obligatorio'
const reqComunas = (v: string[]) => (v && v.length > 0) || 'Selecciona al menos una comuna'

async function crear() {
  saving.value = true
  try {
    const res = await data.createIncident({
      title: titulo.value,
      eventType: tipo.value ?? '',
      startedAt: inicio.value,
      status: estadoMap[estado.value] ?? 'monitoring',
      alertSenapred: senapredMap[senapred.value] ?? 'none',
      alertCruzRoja: cruzRojaMap[cruzRoja.value] ?? 'green',
      comunas: comunas.value,
      description: descripcion.value,
    })
    $q.notify({ type: 'positive', message: 'Incidente creado', caption: res.code, icon: 'check_circle' })
    router.push('/incidents')
  } catch (e) {
    $q.notify({ type: 'negative', message: e instanceof ApiError ? e.message : 'No se pudo crear el incidente' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <q-page class="q-pa-lg">
    <div class="text-caption text-muted"><span class="link" @click="router.push('/incidents')">Incidentes</span> ›</div>
    <h1 class="text-h6 q-mb-md">Nuevo incidente</h1>

    <q-form greedy @submit.prevent="crear">
      <q-card flat bordered class="q-pa-lg" style="max-width: 800px">
        <div class="row q-col-gutter-md">
          <q-input class="col-12 col-sm-6" v-model="titulo" label="Título *" outlined dense :rules="[req]" />
          <q-select
            class="col-12 col-sm-6"
            v-model="tipo"
            :options="tipos"
            label="Tipo de evento *"
            outlined
            dense
            :rules="[req]"
            emit-value
            map-options
          />
          <q-input
            class="col-12 col-sm-6"
            v-model="inicio"
            label="Fecha / hora de inicio *"
            placeholder="dd/mm/aaaa hh:mm"
            outlined
            dense
            :rules="[req]"
          >
            <template #append>
              <q-icon name="event" class="cursor-pointer" aria-label="Elegir fecha">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="inicio" mask="DD/MM/YYYY HH:mm">
                    <div class="row items-center justify-end"><q-btn v-close-popup label="OK" color="primary" flat /></div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
              <q-icon name="schedule" class="cursor-pointer q-ml-sm" aria-label="Elegir hora">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-time v-model="inicio" mask="DD/MM/YYYY HH:mm" format24h>
                    <div class="row items-center justify-end"><q-btn v-close-popup label="OK" color="primary" flat /></div>
                  </q-time>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
          <q-select class="col-12 col-sm-6" v-model="estado" :options="estados" label="Estado" outlined dense />
          <q-select class="col-12 col-sm-6" v-model="senapred" :options="senapredOpts" label="Alerta SENAPRED" outlined dense />
          <q-select class="col-12 col-sm-6" v-model="cruzRoja" :options="crOpts" label="Alerta Cruz Roja" outlined dense />
        </div>
        <q-select
          v-model="comunas"
          :options="comunasOpts"
          label="Comunas afectadas *"
          multiple
          use-chips
          outlined
          dense
          class="q-mt-md"
          :rules="[reqComunas]"
        />
        <q-input v-model="descripcion" label="Descripción" type="textarea" outlined autogrow class="q-mt-md" />
        <div class="q-mt-lg">
          <q-btn type="submit" color="primary" unelevated label="Crear incidente" :loading="saving" />
          <q-btn flat label="Cancelar" class="q-ml-sm" :disable="saving" @click="router.push('/incidents')" />
        </div>
      </q-card>
    </q-form>
  </q-page>
</template>
