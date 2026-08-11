<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const titulo = ref('')
const tipo = ref('Sistema frontal')
const inicio = ref('')
const estado = ref('Monitoreo')
const senapred = ref('Sin alerta')
const cruzRoja = ref('Verde')
const descripcion = ref('')
const comunas = ref<string[]>(['Valparaíso', 'Viña del Mar', 'Quilpué'])

const tipos = ['Sistema frontal', 'Incendio forestal', 'Sismo', 'Marejada', 'Aluvión / remoción', 'Corte eléctrico', 'Corte de agua']
const estados = ['Monitoreo', 'Activo', 'Cerrado']
const senapredOpts = ['Sin alerta', 'Temprana Preventiva', 'Amarilla', 'Roja']
const crOpts = ['Verde', 'Amarilla', 'Roja']
const comunasOpts = ['Valparaíso', 'Viña del Mar', 'Quilpué', 'Villa Alemana', 'Limache', 'Concón', 'Quintero', 'Quillota', 'Olmué', 'Casablanca']

function crear() {
  router.push('/incidents')
}
</script>

<template>
  <q-page class="q-pa-lg">
    <div class="text-caption text-muted">Incidentes ›</div>
    <div class="text-h6 q-mb-md">Nuevo incidente</div>

    <q-card flat bordered class="q-pa-lg" style="max-width: 800px">
      <div class="row q-col-gutter-md">
        <q-input class="col-12 col-sm-6" v-model="titulo" label="Título" outlined dense />
        <q-select class="col-12 col-sm-6" v-model="tipo" :options="tipos" label="Tipo de evento" outlined dense />
        <q-input class="col-12 col-sm-6" v-model="inicio" label="Fecha / hora de inicio" placeholder="dd/mm/aaaa · hh:mm" outlined dense />
        <q-select class="col-12 col-sm-6" v-model="estado" :options="estados" label="Estado" outlined dense />
        <q-select class="col-12 col-sm-6" v-model="senapred" :options="senapredOpts" label="Alerta SENAPRED" outlined dense />
        <q-select class="col-12 col-sm-6" v-model="cruzRoja" :options="crOpts" label="Alerta Cruz Roja" outlined dense />
      </div>
      <q-select v-model="comunas" :options="comunasOpts" label="Comunas afectadas" multiple use-chips outlined dense class="q-mt-md" />
      <q-input v-model="descripcion" label="Descripción" type="textarea" outlined class="q-mt-md" />
      <div class="q-mt-lg">
        <q-btn color="primary" unelevated label="Crear incidente" @click="crear" />
        <q-btn flat label="Cancelar" class="q-ml-sm" @click="router.push('/incidents')" />
      </div>
    </q-card>
  </q-page>
</template>
