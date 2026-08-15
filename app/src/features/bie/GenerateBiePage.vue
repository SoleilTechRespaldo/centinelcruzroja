<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useData } from '@/services/data'
import { useSessionStore } from '@/stores/session'
import { api, ApiError } from '@/services/api'
import type { BieDraft } from '@/types'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const data = useData()
const session = useSessionStore()

const loading = ref(true)
const notFound = ref(false)
const downloading = ref(false)
const pdfLoading = ref(false)
const saving = ref(false)

interface BieVersion { id: string; versionNumber: number; status: string; createdAt: string; generatedBy: string; approvedBy: string | null; approvedAt: string | null }
const versiones = ref<BieVersion[]>([])
const canApprove = computed(() => session.role === 'coordinator' || session.role === 'admin')

const incidentId = ref('')
const incidentCode = ref('')
const incidentTitle = ref('')
const datos = reactive({ nbie: '', tipo: '', fechaEvento: '', fechaReporte: '', senapred: '', cruzRoja: '', magnitud: '', intensidad: '' })
const af = reactive<Record<string, string>>({})
const nec = reactive<Record<string, string>>({})
const descripcion = ref<{ titulo: string; texto: string }[]>([])
const fuentes = ref<string[]>([])
const filiales = ref('')
const voluntarios = ref('')
const actividades = ref('')
const gestion = ref('')
const salud = ref('')
const comunicacion = ref('')
const proteccion = ref('')
const reporteFilial = ref('')
const sala = ref('')
const telecom = ref('')
const elaborado = ref('')
const autorizado = ref('Ive Manni')
const monitoreoEquipo = ref('')

// Validación
const req = (v: unknown) => (!!v && String(v).trim().length > 0) || 'Campo obligatorio'

function replaceRecord(target: Record<string, string>, next: Record<string, string>) {
  Object.keys(target).forEach((k) => delete target[k])
  Object.assign(target, next)
}

function applyDraft(d: BieDraft) {
  incidentId.value = d.incidentId
  incidentCode.value = d.incidentCode
  incidentTitle.value = d.incidentTitle
  Object.assign(datos, d.datos)
  replaceRecord(af, d.afectacion)
  replaceRecord(nec, d.necesidades)
  descripcion.value = d.descripcion.map((b) => ({ ...b }))
  fuentes.value = d.fuentes
  filiales.value = d.cruzRoja.filiales
  voluntarios.value = d.cruzRoja.voluntarios
  actividades.value = d.cruzRoja.actividades
  gestion.value = d.cruzRoja.gestion
  salud.value = d.cruzRoja.salud
  comunicacion.value = d.cruzRoja.comunicacion
  proteccion.value = d.cruzRoja.proteccion
  reporteFilial.value = d.cruzRoja.reporteFilial
  sala.value = d.cierre.sala
  telecom.value = d.cierre.telecom
  elaborado.value = session.displayName || d.cierre.elaborado
  autorizado.value = d.cierre.autorizado
  monitoreoEquipo.value = d.cierre.monitoreoEquipo
}

async function load() {
  loading.value = true
  notFound.value = false
  const id = String(route.query.incident ?? '')
  let draft = id ? await data.getBieDraft(id) : undefined
  if (!draft) {
    // Sin incidente indicado: toma el primero activo (o el primero de la lista).
    const list = await data.listIncidents()
    const first = list.find((i) => i.status === 'active') ?? list[0]
    if (first) draft = await data.getBieDraft(first.id)
  }
  if (draft) {
    applyDraft(draft)
    await loadVersiones()
  } else {
    notFound.value = true
  }
  loading.value = false
}
onMounted(load)

async function loadVersiones() {
  if (!incidentId.value) return
  try {
    const res = await api.get<{ items: BieVersion[] }>(`/incidents/${incidentId.value}/bie/versions`)
    versiones.value = res.items
  } catch {
    /* silencioso */
  }
}

async function guardarBorrador() {
  saving.value = true
  try {
    const res = await api.post<{ versionNumber: number }>(`/incidents/${incidentId.value}/bie/versions`, { data: currentDraft() })
    $q.notify({ type: 'positive', message: `Borrador guardado (v${res.versionNumber})`, icon: 'save' })
    await loadVersiones()
  } catch (e) {
    $q.notify({ type: 'negative', message: e instanceof ApiError ? e.message : 'No se pudo guardar' })
  } finally {
    saving.value = false
  }
}
async function enviar() {
  saving.value = true
  try {
    const res = await api.post<{ versionNumber: number }>(`/incidents/${incidentId.value}/bie/versions`, { data: currentDraft() })
    $q.notify({ type: 'positive', message: `Enviado a aprobación (v${res.versionNumber})`, caption: 'El coordinador puede aprobarlo.', icon: 'send' })
    await loadVersiones()
  } catch (e) {
    $q.notify({ type: 'negative', message: e instanceof ApiError ? e.message : 'No se pudo enviar' })
  } finally {
    saving.value = false
  }
}
async function aprobar(v: BieVersion) {
  try {
    await api.post(`/incidents/${incidentId.value}/bie/versions/${v.id}/approve`, {})
    $q.notify({ type: 'positive', message: `Versión ${v.versionNumber} aprobada`, icon: 'verified' })
    await loadVersiones()
  } catch (e) {
    $q.notify({ type: 'negative', message: e instanceof ApiError ? e.message : 'No se pudo aprobar' })
  }
}
function currentDraft(): BieDraft {
  return {
    incidentId: incidentId.value,
    incidentCode: incidentCode.value,
    incidentTitle: incidentTitle.value,
    datos: { ...datos },
    afectacion: { ...af },
    descripcion: descripcion.value,
    cruzRoja: { filiales: filiales.value, voluntarios: voluntarios.value, actividades: actividades.value, gestion: gestion.value, salud: salud.value, comunicacion: comunicacion.value, proteccion: proteccion.value, reporteFilial: reporteFilial.value },
    necesidades: { ...nec },
    cierre: { sala: sala.value, telecom: telecom.value, elaborado: elaborado.value, autorizado: autorizado.value, monitoreoEquipo: monitoreoEquipo.value },
    fuentes: fuentes.value,
  }
}

async function descargarWord() {
  downloading.value = true
  try {
    const blob = await api.postBlob(`/incidents/${incidentId.value}/bie/docx`, currentDraft())
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `BIE-N${datos.nbie || 'sn'}.docx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    $q.notify({ type: 'positive', message: 'BIE descargado (.docx)', icon: 'description' })
  } catch (e) {
    $q.notify({ type: 'negative', message: e instanceof ApiError ? e.message : 'No se pudo generar el BIE' })
  } finally {
    downloading.value = false
  }
}

async function exportarPdf() {
  pdfLoading.value = true
  try {
    const blob = await api.postBlob(`/incidents/${incidentId.value}/bie/pdf`, currentDraft())
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `BIE-N${datos.nbie || 'sn'}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    $q.notify({ type: 'positive', message: 'BIE descargado (.pdf)', icon: 'picture_as_pdf' })
  } catch (e) {
    $q.notify({ type: 'negative', message: e instanceof ApiError ? e.message : 'No se pudo generar el PDF', timeout: 6000 })
  } finally {
    pdfLoading.value = false
  }
}
function verCompleto() {
  router.push({ path: '/bie/preview', query: route.query.incident ? { incident: String(route.query.incident) } : {} })
}
</script>

<template>
  <q-page class="q-pa-lg">
    <div class="row items-start q-mb-xs">
      <div>
        <div class="text-caption tabular text-muted">{{ incidentCode || '—' }} · {{ incidentTitle }}</div>
        <h1 class="text-h6">Generar BIE — Monitoreo Regional</h1>
      </div>
      <q-space />
      <q-badge v-if="!loading && !notFound" color="grey-4" text-color="grey-9" class="q-pa-sm">Borrador · N°{{ datos.nbie }}</q-badge>
    </div>

    <q-banner v-if="!loading && !notFound" dense rounded class="autofill-note q-mb-md">
      <template #avatar><q-icon name="auto_awesome" color="primary" /></template>
      Autollenado desde el incidente <b>{{ incidentCode }}</b> y sus fuentes registradas.
      <b>N/A</b> = no aplica · <b>En evaluación</b> = sin dato aún.
      <span class="text-muted">Sin conexión a fuentes en vivo todavía (RF-20, etapa backend).</span>
    </q-banner>

    <!-- Carga -->
    <div v-if="loading" class="row q-col-gutter-md">
      <div class="col-12 col-md-7 q-gutter-sm">
        <q-skeleton height="120px" /><q-skeleton height="180px" /><q-skeleton height="140px" />
      </div>
      <div class="col-12 col-md-5"><q-skeleton height="300px" /></div>
    </div>

    <!-- Sin incidente -->
    <div v-else-if="notFound" class="column items-center q-pa-xl text-center">
      <q-icon name="search_off" size="40px" color="grey-6" />
      <div class="text-subtitle1 q-mt-sm">No hay un incidente para generar el BIE</div>
      <q-btn flat color="primary" label="Ir a incidentes" @click="router.push('/incidents')" />
    </div>

    <div v-else class="row q-col-gutter-md">
      <!-- Formulario -->
      <div class="col-12 col-md-7">
        <q-form greedy @submit.prevent="enviar">
          <q-card flat bordered class="q-pa-md q-mb-md">
            <div class="sec-title q-mb-sm">Datos oficiales</div>
            <div class="row q-col-gutter-sm">
              <q-input v-model="datos.nbie" label="N° BIE *" outlined dense class="col-6" :rules="[req]" />
              <q-input v-model="datos.tipo" label="Tipo de emergencia *" outlined dense class="col-6" :rules="[req]" />
              <q-input v-model="datos.fechaEvento" label="Fecha / hora del evento *" outlined dense class="col-6" :rules="[req]" />
              <q-input v-model="datos.fechaReporte" label="Fecha / hora del reporte *" outlined dense class="col-6" :rules="[req]" />
              <q-input v-model="datos.senapred" label="Alerta SENAPRED *" outlined dense class="col-6" :rules="[req]" />
              <q-input v-model="datos.cruzRoja" label="Alerta Cruz Roja *" outlined dense class="col-6" :rules="[req]" />
            </div>
          </q-card>

          <q-card flat bordered class="q-pa-md q-mb-md">
            <div class="sec-title q-mb-sm">Datos generales y afectación</div>
            <div class="row q-col-gutter-sm">
              <q-input v-model="datos.magnitud" label="Magnitud (Richter)" outlined dense class="col-6 col-sm-4" />
              <q-input v-model="datos.intensidad" label="Intensidad (Mercalli)" outlined dense class="col-6 col-sm-4" />
              <q-input v-for="(_v, k) in af" :key="k" v-model="af[k]" :label="k" outlined dense class="col-6 col-sm-4" />
            </div>
          </q-card>

          <q-card flat bordered class="q-pa-md q-mb-md">
            <div class="sec-title q-mb-sm">Descripción · 16 títulos</div>
            <div class="text-caption text-muted q-mb-sm">Autollenado lo que se pudo derivar del incidente; completa/edita el resto.</div>
            <q-input
              v-for="(b, i) in descripcion"
              :key="i"
              v-model="b.texto"
              :label="b.titulo"
              type="textarea"
              outlined dense autogrow
              class="q-mb-sm"
            />
          </q-card>

          <q-card flat bordered class="q-pa-md q-mb-md">
            <div class="sec-title q-mb-sm">Cruz Roja: acciones y voluntariado</div>
            <div class="row q-col-gutter-sm q-mb-sm">
              <q-input v-model="filiales" label="Filiales" outlined dense class="col-8" />
              <q-input v-model="voluntarios" label="Voluntarios" outlined dense class="col-4" />
            </div>
            <q-input v-model="gestion" label="Gestión del riesgo (COGRID · monitoreo · reporte)" type="textarea" outlined dense autogrow class="q-mb-sm" />
            <q-input v-model="salud" label="Salud (SMAPS · PPAA · WASH)" type="textarea" outlined dense autogrow class="q-mb-sm" />
            <q-input v-model="comunicacion" label="Comunicación (mensajes clave · campañas)" type="textarea" outlined dense autogrow class="q-mb-sm" />
            <q-input v-model="proteccion" label="Protección (PGI · RCF · datos sensibles)" type="textarea" outlined dense autogrow class="q-mb-sm" />
            <q-input v-model="reporteFilial" label="Reporte por filial (ACCIONES DE CRUZ ROJA)" type="textarea" outlined dense autogrow />
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
              <q-input v-model="elaborado" label="Elaborado por *" outlined dense class="col-6" :rules="[req]" />
              <q-input v-model="autorizado" label="Autorizado por (fijo)" outlined dense readonly class="col-6" />
            </div>
            <q-input v-model="monitoreoEquipo" label="Monitoreo y recopilación de información (equipo)" type="textarea" outlined dense autogrow class="q-mt-sm" />
            <div class="q-mt-md">
              <q-btn type="button" outline size="sm" label="Guardar borrador" :loading="saving" @click="guardarBorrador" />
              <q-btn type="submit" color="primary" unelevated size="sm" label="Enviar a aprobación" class="q-ml-sm" :loading="saving" />
            </div>
          </q-card>
        </q-form>
      </div>

      <!-- Vista previa -->
      <div class="col-12 col-md-5">
        <q-card flat bordered class="q-pa-md">
          <div class="row items-center">
            <div class="sec-title">Vista previa</div>
            <q-space />
            <q-btn color="primary" unelevated size="sm" label="Ver completo" @click="verCompleto" />
            <q-btn outline size="sm" label="Word" class="q-ml-xs" :loading="downloading" @click="descargarWord" />
            <q-btn outline size="sm" label="PDF" class="q-ml-xs" :loading="pdfLoading" @click="exportarPdf" />
          </div>
          <div class="watermark q-my-md">BORRADOR · APOYO, NO OFICIAL</div>
          <div class="mini-doc">
            <div class="text-center text-weight-bold q-mb-xs">BIE N°{{ datos.nbie }} — Monitoreo Regional<br /><span class="text-caption text-muted">Cruz Roja Chilena · Comité Regional Valparaíso</span></div>
            <div><b>Tipo:</b> {{ datos.tipo }} &nbsp; <b>Inicio:</b> {{ datos.fechaEvento }}</div>
            <div><b>Alerta SENAPRED:</b> {{ datos.senapred }} &nbsp; <b>Cruz Roja:</b> {{ datos.cruzRoja }}</div>
            <div class="q-mt-xs"><b>Afectación:</b> {{ af.Afectados }} afectados · {{ af.Comunas }} comunas · {{ af.Albergues }} albergues</div>
            <div class="q-mt-xs"><b>Cruz Roja:</b> {{ filiales }} · {{ voluntarios }} voluntarios</div>
            <div class="q-mt-xs text-muted">Fuentes: {{ fuentes.length ? fuentes.join(', ') : '—' }}</div>
          </div>
          <div class="sec-title q-mt-md q-mb-xs">Versiones</div>
          <div v-if="versiones.length === 0" class="text-caption text-muted">Aún no hay versiones. Usa «Guardar borrador».</div>
          <q-list v-else separator dense>
            <q-item v-for="v in versiones" :key="v.id">
              <q-item-section>
                <q-item-label>v{{ v.versionNumber }} · {{ v.status === 'approved' ? 'Aprobado' : v.status === 'exported' ? 'Exportado' : 'Borrador' }}</q-item-label>
                <q-item-label caption>{{ v.createdAt }} · {{ v.generatedBy }}<span v-if="v.approvedBy"> · aprobó {{ v.approvedBy }}</span></q-item-label>
              </q-item-section>
              <q-item-section v-if="canApprove && v.status === 'draft'" side>
                <q-btn dense flat size="sm" color="positive" label="Aprobar" @click="aprobar(v)" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.autofill-note { background: #eef4ff; border: 1px solid #d5e2fb; color: var(--c-text2); font-size: 13px; }
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
