<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useData } from '@/services/data'
import { api, ApiError } from '@/services/api'
import type { IncidentDetail, EvidenceItem, IncidentStatus, AlertSenapred, AlertCruzRoja } from '@/types'
import { senapredBadge, cruzRojaBadge } from '@/utils/alerts'
import AlertBadge from '@/components/ui/AlertBadge.vue'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const data = useData()
const inc = ref<IncidentDetail | null>(null)
const loading = ref(true)
const evidence = ref<EvidenceItem[]>([])
const saving = ref(false)

async function load() {
  inc.value = (await data.getIncident(String(route.params.id))) ?? null
  evidence.value = inc.value ? [...inc.value.evidence] : []
}
onMounted(async () => {
  await load()
  loading.value = false
})

// --- Captura de evidencia (ingesta manual con procedencia) ---
const showAdd = ref(false)
const tipos = ['Imagen', 'PDF', 'Captura', 'Documento', 'Enlace']
const kindMap: Record<string, EvidenceItem['kind']> = {
  Imagen: 'image',
  PDF: 'pdf',
  Captura: 'screenshot',
  Documento: 'doc',
  Enlace: 'link',
}
const ev = reactive<{ tipo: string | null; caption: string; source: string; at: string; url: string; file: File | null }>({
  tipo: null,
  caption: '',
  source: '',
  at: '',
  url: '',
  file: null,
})
const req = (v: unknown) => (!!v && String(v).trim().length > 0) || 'Campo obligatorio'

function openAdd() {
  ev.tipo = null
  ev.caption = ''
  ev.source = ''
  ev.at = ''
  ev.url = ''
  ev.file = null
  showAdd.value = true
}

async function agregarEvidencia() {
  if (!inc.value) return
  const kind = kindMap[ev.tipo ?? ''] ?? 'doc'
  saving.value = true
  try {
    if (ev.file && ev.tipo !== 'Enlace') {
      // Con archivo: sube el binario real (se guarda local o en R2).
      const fd = new FormData()
      fd.set('kind', kind)
      fd.set('caption', ev.caption)
      fd.set('source', ev.source)
      fd.set('file', ev.file)
      await api.postForm(`/incidents/${inc.value.id}/evidence/upload`, fd)
    } else {
      await data.addEvidence(inc.value.id, {
        kind,
        caption: ev.caption,
        source: ev.source,
        at: ev.at,
        url: ev.tipo === 'Enlace' ? ev.url : undefined,
      })
    }
    $q.notify({ type: 'positive', message: 'Evidencia agregada', caption: `${ev.caption} · ${ev.source}`, icon: 'check_circle' })
    showAdd.value = false
    await load()
  } catch (e) {
    $q.notify({ type: 'negative', message: e instanceof ApiError ? e.message : 'No se pudo guardar la evidencia' })
  } finally {
    saving.value = false
  }
}

// Descarga el archivo real de una evidencia (con autenticación).
async function descargarEvidencia(e: EvidenceItem) {
  try {
    const blob = await api.getBlob(`/evidence/${e.id}/file`)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = e.fileName || 'evidencia'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (err) {
    $q.notify({ type: 'negative', message: err instanceof ApiError ? err.message : 'No se pudo descargar el archivo' })
  }
}

// --- Actualizar situación (nuevo reporte, historial) ---
const showReport = ref(false)
const rep = reactive({ personas: 0, voluntarios: 0 })
function openReport() {
  rep.personas = Number(String(inc.value?.personasAfectadas ?? '').replace(/\D/g, '')) || 0
  rep.voluntarios = inc.value?.voluntarios ?? 0
  showReport.value = true
}
async function guardarReporte() {
  if (!inc.value) return
  saving.value = true
  try {
    await data.addReport(inc.value.id, { personasAfectadas: rep.personas, voluntarios: rep.voluntarios })
    $q.notify({ type: 'positive', message: 'Situación actualizada', caption: 'Se guardó un nuevo reporte', icon: 'update' })
    showReport.value = false
    await load()
  } catch (e) {
    $q.notify({ type: 'negative', message: e instanceof ApiError ? e.message : 'No se pudo actualizar' })
  } finally {
    saving.value = false
  }
}

// Opciones (etiqueta -> valor del dominio)
const estadoOpts = [
  { label: 'Monitoreo', value: 'monitoring' },
  { label: 'Activo', value: 'active' },
  { label: 'Cerrado', value: 'closed' },
]
const senapredOpts = [
  { label: 'Sin alerta', value: 'none' },
  { label: 'Preventiva', value: 'atp' },
  { label: 'Amarilla', value: 'yellow' },
  { label: 'Roja', value: 'red' },
]
const crOpts = [
  { label: 'Verde', value: 'green' },
  { label: 'Amarilla', value: 'yellow' },
  { label: 'Roja', value: 'red' },
]
const tiposEvento = [
  'Sistema frontal',
  'Incendio forestal',
  'Sismo',
  'Marejada',
  'Aluvión / remoción en masa',
  'Corte eléctrico',
  'Corte de agua',
]
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

// --- Editar incidente (incluye cerrar = estado Cerrado) ---
const showEdit = ref(false)
const edit = reactive<{
  title: string
  status: string
  senapred: string
  cruzRoja: string
  description: string
  eventType: string
  comunas: string[]
}>({
  title: '',
  status: 'monitoring',
  senapred: 'none',
  cruzRoja: 'green',
  description: '',
  eventType: '',
  comunas: [],
})
function openEdit() {
  if (!inc.value) return
  edit.title = inc.value.title
  edit.status = inc.value.status
  edit.senapred = inc.value.alertSenapred
  edit.cruzRoja = inc.value.alertCruzRoja
  edit.description = inc.value.description
  edit.eventType = inc.value.eventType
  edit.comunas = [...inc.value.comunas]
  showEdit.value = true
}
async function guardarEdit() {
  if (!inc.value) return
  saving.value = true
  try {
    await data.updateIncident(inc.value.id, {
      title: edit.title,
      status: edit.status as IncidentStatus,
      alertSenapred: edit.senapred as AlertSenapred,
      alertCruzRoja: edit.cruzRoja as AlertCruzRoja,
      description: edit.description,
      eventType: edit.eventType,
      comunas: edit.comunas,
    })
    $q.notify({ type: 'positive', message: 'Incidente actualizado', icon: 'check_circle' })
    showEdit.value = false
    await load()
  } catch (e) {
    $q.notify({ type: 'negative', message: e instanceof ApiError ? e.message : 'No se pudo actualizar' })
  } finally {
    saving.value = false
  }
}

// --- Agregar hito a la cronología ---
const showTl = ref(false)
const tl = reactive({ at: '', tipo: 'note', descripcion: '' })
const tlTipos = [
  { label: 'Nota', value: 'note' },
  { label: 'Acción', value: 'action' },
  { label: 'Cambio de alerta', value: 'alert_change' },
  { label: 'Fuente', value: 'source' },
]
function openTl() {
  tl.at = ''
  tl.tipo = 'note'
  tl.descripcion = ''
  showTl.value = true
}
async function guardarTl() {
  if (!inc.value) return
  saving.value = true
  try {
    await data.addTimelineEvent(inc.value.id, { happenedAt: tl.at, entryType: tl.tipo, description: tl.descripcion })
    $q.notify({ type: 'positive', message: 'Hito agregado a la cronología', icon: 'check_circle' })
    showTl.value = false
    await load()
  } catch (e) {
    $q.notify({ type: 'negative', message: e instanceof ApiError ? e.message : 'No se pudo agregar' })
  } finally {
    saving.value = false
  }
}

// --- Registrar una fuente ---
const showSrc = ref(false)
const src = reactive({ org: '', title: '', url: '' })
const orgOpts = [
  'SENAPRED',
  'DMC',
  'DGA',
  'SHOA',
  'CSN',
  'CONAF',
  'SEC',
  'Esval',
  'Vialidad MOP',
  'DIRECTEMAR',
  'SERNAGEOMIN',
  'Delegación Presidencial Valparaíso',
  'MINEDUC',
  'MINSAL',
  'SUBTEL',
]
function openSrc() {
  src.org = ''
  src.title = ''
  src.url = ''
  showSrc.value = true
}
async function guardarSrc() {
  if (!inc.value) return
  saving.value = true
  try {
    await data.addSource(inc.value.id, { org: src.org, title: src.title, url: src.url || undefined })
    $q.notify({ type: 'positive', message: 'Fuente registrada', icon: 'check_circle' })
    showSrc.value = false
    await load()
  } catch (e) {
    $q.notify({ type: 'negative', message: e instanceof ApiError ? e.message : 'No se pudo registrar' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <q-page class="q-pa-lg">
    <div v-if="loading" class="q-gutter-sm">
      <q-skeleton height="60px" />
      <q-skeleton height="240px" />
    </div>

    <div v-else-if="!inc" class="column items-center q-pa-xl text-center">
      <q-icon name="search_off" size="40px" color="grey-6" />
      <div class="text-subtitle1 q-mt-sm">Incidente no encontrado</div>
      <q-btn flat color="primary" label="Volver a incidentes" @click="router.push('/incidents')" />
    </div>

    <template v-else>
      <div class="row items-start q-mb-md">
        <div>
          <div class="text-caption tabular text-muted">{{ inc.code }} · {{ inc.eventType }}</div>
          <h1 class="text-h6">{{ inc.title }}</h1>
        </div>
        <q-space />
        <div class="column items-end q-gutter-xs">
          <div class="badges">
            <AlertBadge :tone="senapredBadge(inc.alertSenapred).tone" :label="'SENAPRED: ' + senapredBadge(inc.alertSenapred).label" />
            <AlertBadge :tone="cruzRojaBadge(inc.alertCruzRoja).tone" :label="'Cruz Roja: ' + cruzRojaBadge(inc.alertCruzRoja).label" />
          </div>
          <div class="row q-gutter-xs">
            <q-btn outline size="sm" icon="edit" label="Editar" @click="openEdit" />
            <q-btn
              color="primary"
              unelevated
              size="sm"
              label="Generar BIE"
              @click="router.push({ path: '/bie', query: { incident: inc.id } })"
            />
          </div>
        </div>
      </div>

      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-7">
          <q-card flat bordered class="q-pa-md q-mb-md">
            <div class="sec-title q-mb-sm">Descripción</div>
            <p class="q-mb-md">{{ inc.description }}</p>
            <div class="sec-title q-mb-sm">Comunas afectadas</div>
            <div class="badges">
              <q-chip v-for="c in inc.comunas" :key="c" dense square>{{ c }}</q-chip>
            </div>
          </q-card>

          <q-card flat bordered class="q-pa-md q-mb-md">
            <div class="row items-center q-mb-sm">
              <div class="sec-title">Cronología</div>
              <q-space />
              <q-btn dense flat size="sm" icon="add" label="Agregar hito" @click="openTl" />
            </div>
            <ol class="tl">
              <li v-for="(t, idx) in inc.timeline" :key="idx" class="tl-item">
                <div class="tl-time tabular">{{ t.at }}</div>
                <div>
                  {{ t.text }}<span v-if="t.source" class="text-caption text-muted"> · {{ t.source }}</span>
                </div>
              </li>
            </ol>
          </q-card>

          <q-card flat bordered class="q-pa-md">
            <div class="row items-center q-mb-sm">
              <div class="sec-title">Evidencias</div>
              <q-space />
              <q-btn dense flat size="sm" icon="add_a_photo" label="Capturar" aria-label="Capturar evidencia" @click="openAdd" />
            </div>
            <div class="row q-col-gutter-sm">
              <div v-for="e in evidence" :key="e.id" class="col-6 col-sm-4">
                <q-card flat bordered>
                  <div class="evidence-thumb">
                    <q-icon :name="e.kind === 'link' ? 'link' : 'description'" size="18px" class="q-mr-xs" />{{ e.kind }}
                  </div>
                  <div class="q-pa-xs">
                    <div class="text-caption ellipsis-2-lines">{{ e.caption }}</div>
                    <div class="text-caption text-muted">
                      {{ e.source }}<span v-if="e.at"> · {{ e.at }}</span>
                    </div>
                    <button v-if="e.hasFile" type="button" class="link" @click="descargarEvidencia(e)">descargar archivo</button>
                  </div>
                </q-card>
              </div>
              <div class="col-6 col-sm-4">
                <q-card
                  flat
                  bordered
                  class="evidence-add cursor-pointer"
                  role="button"
                  tabindex="0"
                  @click="openAdd"
                  @keydown.enter.prevent="openAdd"
                  @keydown.space.prevent="openAdd"
                >
                  <q-icon name="add" size="20px" class="q-mr-xs" /> Capturar evidencia
                </q-card>
              </div>
            </div>
          </q-card>
        </div>

        <div class="col-12 col-md-5">
          <q-card flat bordered class="q-pa-md q-mb-md">
            <div class="row items-center q-mb-sm">
              <div class="sec-title">Situación actual</div>
              <q-space />
              <q-btn dense outline size="sm" label="Actualizar" @click="openReport" />
            </div>
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-card flat class="q-pa-sm bg-grey-2">
                  <div class="text-caption text-muted">Personas afectadas</div>
                  <div class="text-h6">{{ inc.personasAfectadas }}</div>
                </q-card>
              </div>
              <div class="col-6">
                <q-card flat class="q-pa-sm bg-grey-2">
                  <div class="text-caption text-muted">Voluntarios</div>
                  <div class="text-h6">{{ inc.voluntarios }}</div>
                </q-card>
              </div>
            </div>
            <div class="sec-title q-mt-md q-mb-xs">Voluntarios por filial</div>
            <q-markup-table flat dense tabindex="0" aria-label="Voluntarios por filial">
              <tbody>
                <tr v-for="f in inc.voluntariosPorFilial" :key="f.filial">
                  <td>{{ f.filial }}</td>
                  <td class="text-right tabular">{{ f.n }}</td>
                </tr>
              </tbody>
            </q-markup-table>
            <div class="text-caption text-muted q-mt-sm">Cada actualización guarda un reporte nuevo → historial para comparar.</div>
          </q-card>

          <q-card flat bordered class="q-pa-md">
            <div class="row items-center q-mb-sm">
              <div class="sec-title">Fuentes consultadas</div>
              <q-space />
              <q-btn dense flat size="sm" icon="add" label="Agregar" @click="openSrc" />
            </div>
            <q-list separator dense>
              <q-item v-for="(s, i) in inc.sources" :key="i">
                <q-item-section>{{ s.org }} — {{ s.title }}</q-item-section>
                <q-item-section side class="text-caption">{{ s.at }}</q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </div>
      </div>
    </template>

    <!-- Diálogo: capturar evidencia con procedencia -->
    <q-dialog v-model="showAdd" aria-label="Capturar evidencia">
      <q-card style="min-width: 360px; max-width: 92vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-subtitle1">Capturar evidencia</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup aria-label="Cerrar" />
        </q-card-section>
        <q-form greedy @submit.prevent="agregarEvidencia">
          <q-card-section class="q-gutter-sm">
            <q-select v-model="ev.tipo" :options="tipos" label="Tipo *" outlined dense :rules="[req]" />
            <q-input v-model="ev.caption" label="Descripción *" outlined dense :rules="[req]" />
            <q-input
              v-model="ev.source"
              label="Fuente / procedencia *"
              placeholder="Ej: SENAPRED, municipalidad, terreno…"
              outlined
              dense
              :rules="[req]"
            />
            <q-input v-model="ev.at" label="Fecha / hora *" placeholder="dd/mm/aaaa hh:mm" outlined dense :rules="[req]">
              <template #append>
                <q-icon name="event" class="cursor-pointer" aria-label="Elegir fecha">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="ev.at" mask="DD/MM/YYYY HH:mm">
                      <div class="row items-center justify-end"><q-btn v-close-popup label="OK" color="primary" flat /></div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
                <q-icon name="schedule" class="cursor-pointer q-ml-sm" aria-label="Elegir hora">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-time v-model="ev.at" mask="DD/MM/YYYY HH:mm" format24h>
                      <div class="row items-center justify-end"><q-btn v-close-popup label="OK" color="primary" flat /></div>
                    </q-time>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
            <q-input
              v-if="ev.tipo === 'Enlace'"
              v-model="ev.url"
              label="Enlace (URL) *"
              placeholder="https://…"
              outlined
              dense
              :rules="[req]"
            />
            <q-file v-else v-model="ev.file" label="Archivo" outlined dense accept=".jpg,.jpeg,.png,.pdf,.docx">
              <template #prepend><q-icon name="attach_file" /></template>
            </q-file>
          </q-card-section>
          <q-card-actions align="right" class="q-pr-md q-pb-md">
            <q-btn type="button" flat label="Cancelar" v-close-popup />
            <q-btn type="submit" color="primary" unelevated label="Agregar" :loading="saving" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- Diálogo: actualizar situación (nuevo reporte) -->
    <q-dialog v-model="showReport" aria-label="Actualizar situación">
      <q-card style="min-width: 340px; max-width: 92vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-subtitle1">Actualizar situación</div>
          <q-space />
          <q-btn type="button" icon="close" flat round dense v-close-popup aria-label="Cerrar" />
        </q-card-section>
        <q-form greedy @submit.prevent="guardarReporte">
          <q-card-section class="q-gutter-sm">
            <q-input v-model.number="rep.personas" type="number" min="0" label="Personas afectadas" outlined dense />
            <q-input v-model.number="rep.voluntarios" type="number" min="0" label="Voluntarios" outlined dense />
            <div class="text-caption text-muted">Se guarda como un reporte nuevo (historial); no reemplaza los anteriores.</div>
          </q-card-section>
          <q-card-actions align="right" class="q-pr-md q-pb-md">
            <q-btn type="button" flat label="Cancelar" v-close-popup />
            <q-btn type="submit" color="primary" unelevated label="Guardar reporte" :loading="saving" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- Diálogo: editar incidente (estado Cerrado = cerrar el evento) -->
    <q-dialog v-model="showEdit" aria-label="Editar incidente">
      <q-card style="min-width: 380px; max-width: 92vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-subtitle1">Editar incidente</div>
          <q-space />
          <q-btn type="button" icon="close" flat round dense v-close-popup aria-label="Cerrar" />
        </q-card-section>
        <q-form greedy @submit.prevent="guardarEdit">
          <q-card-section class="q-gutter-sm">
            <q-input v-model="edit.title" label="Título *" outlined dense :rules="[req]" />
            <div class="row q-col-gutter-sm">
              <q-select class="col-6" v-model="edit.status" :options="estadoOpts" label="Estado" outlined dense emit-value map-options />
              <q-select class="col-6" v-model="edit.eventType" :options="tiposEvento" label="Tipo de evento" outlined dense />
              <q-select
                class="col-6"
                v-model="edit.senapred"
                :options="senapredOpts"
                label="Alerta SENAPRED"
                outlined
                dense
                emit-value
                map-options
              />
              <q-select
                class="col-6"
                v-model="edit.cruzRoja"
                :options="crOpts"
                label="Alerta Cruz Roja"
                outlined
                dense
                emit-value
                map-options
              />
            </div>
            <q-select v-model="edit.comunas" :options="comunasOpts" label="Comunas afectadas" multiple use-chips outlined dense />
            <q-input v-model="edit.description" label="Descripción" type="textarea" outlined dense autogrow />
          </q-card-section>
          <q-card-actions align="right" class="q-pr-md q-pb-md">
            <q-btn type="button" flat label="Cancelar" v-close-popup />
            <q-btn type="submit" color="primary" unelevated label="Guardar" :loading="saving" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- Diálogo: agregar hito a la cronología -->
    <q-dialog v-model="showTl" aria-label="Agregar hito">
      <q-card style="min-width: 340px; max-width: 92vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-subtitle1">Agregar hito</div>
          <q-space />
          <q-btn type="button" icon="close" flat round dense v-close-popup aria-label="Cerrar" />
        </q-card-section>
        <q-form greedy @submit.prevent="guardarTl">
          <q-card-section class="q-gutter-sm">
            <q-input v-model="tl.at" label="Fecha / hora *" placeholder="dd/mm/aaaa hh:mm" outlined dense :rules="[req]">
              <template #append>
                <q-icon name="event" class="cursor-pointer" aria-label="Elegir fecha">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="tl.at" mask="DD/MM/YYYY HH:mm"
                      ><div class="row items-center justify-end"><q-btn v-close-popup label="OK" color="primary" flat /></div
                    ></q-date>
                  </q-popup-proxy>
                </q-icon>
                <q-icon name="schedule" class="cursor-pointer q-ml-sm" aria-label="Elegir hora">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-time v-model="tl.at" mask="DD/MM/YYYY HH:mm" format24h
                      ><div class="row items-center justify-end"><q-btn v-close-popup label="OK" color="primary" flat /></div
                    ></q-time>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
            <q-select v-model="tl.tipo" :options="tlTipos" label="Tipo" outlined dense emit-value map-options />
            <q-input v-model="tl.descripcion" label="Descripción *" type="textarea" outlined dense autogrow :rules="[req]" />
          </q-card-section>
          <q-card-actions align="right" class="q-pr-md q-pb-md">
            <q-btn type="button" flat label="Cancelar" v-close-popup />
            <q-btn type="submit" color="primary" unelevated label="Agregar" :loading="saving" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- Diálogo: registrar fuente -->
    <q-dialog v-model="showSrc" aria-label="Registrar fuente">
      <q-card style="min-width: 340px; max-width: 92vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-subtitle1">Registrar fuente</div>
          <q-space />
          <q-btn type="button" icon="close" flat round dense v-close-popup aria-label="Cerrar" />
        </q-card-section>
        <q-form greedy @submit.prevent="guardarSrc">
          <q-card-section class="q-gutter-sm">
            <q-select v-model="src.org" :options="orgOpts" label="Organismo *" outlined dense :rules="[req]" />
            <q-input v-model="src.title" label="Título / comunicado *" outlined dense :rules="[req]" />
            <q-input v-model="src.url" label="Enlace (URL)" placeholder="https://…" outlined dense />
          </q-card-section>
          <q-card-actions align="right" class="q-pr-md q-pb-md">
            <q-btn type="button" flat label="Cancelar" v-close-popup />
            <q-btn type="submit" color="primary" unelevated label="Registrar" :loading="saving" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped>
.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.evidence-thumb {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--c-surface2);
  color: var(--c-muted);
  font-size: 12px;
  text-transform: uppercase;
}
.evidence-add {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 96px;
  color: var(--c-text2);
  border-style: dashed;
}
.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
