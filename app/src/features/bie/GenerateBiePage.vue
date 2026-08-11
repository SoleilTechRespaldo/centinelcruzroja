<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const datos = reactive({
  nbie: '15',
  tipo: 'Evento Meteorológico',
  fechaEvento: '08/08/2026 · 14:00',
  fechaReporte: '10/08/2026 · 16:22',
  senapred: 'Amarilla (Regional Continental)',
  cruzRoja: 'VERDE',
})

const af = reactive<Record<string, string>>({
  Afectados: '2.350', Comunas: '5', Viviendas: '2 (eval.)', Heridos: '3', Desplazados: '87',
  Fallecidos: '0', Damnificados: '0', Albergues: '8', Albergados: '64', Agua: 'La Calera 700',
  'Eléctrico': '126.277 sin luz', Rutas: 'Ruta 5N km171', Hospitales: '2', Aeropuerto: 'N/A', Otras: '48 sitios telecom',
})

const nec = reactive<Record<string, string>>({
  'Gestión': 'Kits, nylon, linternas…', Salud: 'Botiquines, gasas…', Voluntariado: 'Impermeables, botas',
  'Logística': 'Vehículo institucional', Albergues: 'Kits espacios seguros',
})

const titulos = [
  '1. Síntesis de la jornada',
  '2. Alerta vigente y novedad principal',
  '4. Balance regional',
  '8. Situación eléctrica',
  '13. Emergencias por provincia y comuna',
]

const filiales = ref('Totalidad de la región')
const voluntarios = ref('72')
const accionar = ref('Participación en COGRID y monitoreo; reposición de botiquines; difusión de autocuidado; RCF y resguardo de datos sensibles.')
const reporteFilial = ref('Quintero: acceso inundado, cierre preventivo.\nViña del Mar: voluntarios en albergues 2 Oriente y 11 Norte.')
const sala = ref('Activada')
const telecom = ref('Sin Activar')
const elaborado = ref('Nicolás Jerez')
</script>

<template>
  <q-page class="q-pa-lg">
    <div class="row items-start q-mb-xs">
      <div>
        <div class="text-caption tabular text-muted">2026-0015 · Sistema frontal</div>
        <div class="text-h6">Generar BIE — Monitoreo Regional</div>
      </div>
      <q-space />
      <q-badge color="grey-4" text-color="grey-9" class="q-pa-sm">Borrador · N°15 · v3</q-badge>
    </div>
    <div class="text-caption text-muted q-mb-md">
      Autollenado desde el incidente y las fuentes. <b>N/A</b> = no aplica · <b>En evaluación</b> = sin dato oficial. Nunca datos personales sensibles.
    </div>

    <div class="row q-col-gutter-md">
      <!-- Formulario -->
      <div class="col-12 col-md-7">
        <q-card flat bordered class="q-pa-md q-mb-md">
          <div class="sec-title q-mb-sm">Datos oficiales</div>
          <div class="row q-col-gutter-sm">
            <q-input v-model="datos.nbie" label="N° BIE" outlined dense class="col-6" />
            <q-input v-model="datos.tipo" label="Tipo de emergencia" outlined dense class="col-6" />
            <q-input v-model="datos.fechaEvento" label="Fecha / hora del evento" outlined dense class="col-6" />
            <q-input v-model="datos.fechaReporte" label="Fecha / hora del reporte" outlined dense class="col-6" />
            <q-input v-model="datos.senapred" label="Alerta SENAPRED" outlined dense class="col-6" />
            <q-input v-model="datos.cruzRoja" label="Alerta Cruz Roja" outlined dense class="col-6" />
          </div>
        </q-card>

        <q-card flat bordered class="q-pa-md q-mb-md">
          <div class="sec-title q-mb-sm">Afectación</div>
          <div class="row q-col-gutter-sm">
            <q-input v-for="(_v, k) in af" :key="k" v-model="af[k]" :label="k" outlined dense class="col-6 col-sm-4" />
          </div>
        </q-card>

        <q-card flat bordered class="q-pa-md q-mb-md">
          <div class="sec-title q-mb-sm">Descripción · 16 títulos</div>
          <q-list separator dense>
            <q-item v-for="t in titulos" :key="t">
              <q-item-section>{{ t }}</q-item-section>
              <q-item-section side><a class="link">editar</a></q-item-section>
            </q-item>
            <q-item><q-item-section class="text-muted text-caption">+ 11 títulos más (salud, viviendas, agua, rutas, telecom, hidrología, educación, gobierno, proyección, fuentes…)</q-item-section></q-item>
          </q-list>
        </q-card>

        <q-card flat bordered class="q-pa-md q-mb-md">
          <div class="sec-title q-mb-sm">Cruz Roja: accionar y voluntariado</div>
          <div class="row q-col-gutter-sm q-mb-sm">
            <q-input v-model="filiales" label="Filiales" outlined dense class="col-8" />
            <q-input v-model="voluntarios" label="Voluntarios" outlined dense class="col-4" />
          </div>
          <q-input v-model="accionar" label="Accionar (gestión · salud · comunicación · protección)" type="textarea" outlined class="q-mb-sm" />
          <q-input v-model="reporteFilial" label="Reporte por filial" type="textarea" outlined />
        </q-card>

        <q-card flat bordered class="q-pa-md q-mb-md">
          <div class="sec-title q-mb-sm">Necesidades internas</div>
          <div class="row q-col-gutter-sm">
            <q-input v-for="(_v, k) in nec" :key="k" v-model="nec[k]" :label="k" outlined dense class="col-6 col-sm-4" />
          </div>
        </q-card>

        <q-card flat bordered class="q-pa-md">
          <div class="sec-title q-mb-sm">Cierre y firma</div>
          <div class="row q-col-gutter-sm">
            <q-input v-model="sala" label="Sala de crisis" outlined dense class="col-6" />
            <q-input v-model="telecom" label="Telecomunicaciones" outlined dense class="col-6" />
            <q-input v-model="elaborado" label="Elaborado por" outlined dense class="col-6" />
            <q-input model-value="Ive Manni" label="Autorizado por (fijo)" outlined dense readonly class="col-6" />
          </div>
          <div class="q-mt-md">
            <q-btn outline size="sm" label="Guardar borrador" />
            <q-btn outline size="sm" label="Enviar a aprobación" class="q-ml-sm" />
          </div>
        </q-card>
      </div>

      <!-- Vista previa -->
      <div class="col-12 col-md-5">
        <q-card flat bordered class="q-pa-md">
          <div class="row items-center">
            <div class="sec-title">Vista previa</div>
            <q-space />
            <q-btn color="primary" unelevated size="sm" label="Ver completo" @click="router.push('/bie/preview')" />
            <q-btn outline size="sm" label="Word" class="q-ml-xs" />
            <q-btn outline size="sm" label="PDF" class="q-ml-xs" />
          </div>
          <div class="watermark q-my-md">BORRADOR · APOYO, NO OFICIAL</div>
          <div class="mini-doc">
            <div class="text-center text-weight-bold q-mb-xs">BIE N°15 — Monitoreo Regional<br /><span class="text-caption text-muted">Cruz Roja Chilena · Comité Regional Valparaíso</span></div>
            <div><b>Tipo:</b> Evento Meteorológico &nbsp; <b>Inicio:</b> 08/08 14:00</div>
            <div><b>Alerta SENAPRED:</b> Amarilla &nbsp; <b>Cruz Roja:</b> VERDE</div>
            <div class="q-mt-xs"><b>Afectación:</b> 2.350 afectados · 87 desplazados · 8 albergues (64) · 126.277 sin luz</div>
            <div class="q-mt-xs"><b>Cruz Roja:</b> Totalidad de filiales · 72 voluntarios</div>
            <div class="q-mt-xs text-muted">Fuentes: SENAPRED, DMC, DGA, SEC, Esval, SUBTEL…</div>
          </div>
          <div class="sec-title q-mt-md q-mb-xs">Versiones</div>
          <q-list separator dense>
            <q-item><q-item-section>v3 · Borrador</q-item-section><q-item-section side class="text-caption">hoy 16:10</q-item-section></q-item>
            <q-item><q-item-section>v2 · Aprobado</q-item-section><q-item-section side class="text-caption">09/08 12:00</q-item-section></q-item>
            <q-item><q-item-section>v1 · Exportado</q-item-section><q-item-section side class="text-caption">08/08 18:30</q-item-section></q-item>
          </q-list>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.link { color: var(--al-celeste-t); cursor: pointer; font-size: 12px; }
.watermark {
  background: repeating-linear-gradient(45deg, #fafafa, #fafafa 10px, #f3f4f6 10px, #f3f4f6 20px);
  border: 1px dashed var(--c-border);
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--c-text2);
}
.mini-doc {
  border: 1px solid var(--c-border);
  border-radius: 8px;
  padding: 14px;
  font-size: 13px;
  line-height: 1.6;
}
</style>
