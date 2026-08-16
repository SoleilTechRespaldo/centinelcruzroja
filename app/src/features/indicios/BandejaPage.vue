<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api, ApiError } from '@/services/api'
import { useSessionStore } from '@/stores/session'
import AlertBadge from '@/components/ui/AlertBadge.vue'
import type { AlertTone } from '@/types'

type Status = 'por_verificar' | 'verificado' | 'descartado'
type Channel = 'correo' | 'web' | 'redes' | 'manual'

interface Indicio {
  id: string
  channel: Channel
  status: Status
  title: string
  summary: string | null
  url: string | null
  sender: string | null
  isOfficial: boolean
  incidentId: string | null
  incidentCode: string | null
  incidentTitle: string | null
  org: string | null
  receivedAt: string
  reviewedAt: string | null
  reviewer: string | null
  reviewNote: string | null
}
interface IndicioDetail extends Indicio {
  content: string | null
  occurredAt: string | null
}
interface IncidentOpt {
  id: string
  code: string
  title: string
}

const $q = useQuasar()
const session = useSessionStore()
const canEdit = computed(() => ['operator', 'coordinator', 'admin'].includes(session.role ?? ''))

const channelMeta: Record<Channel, { label: string; icon: string; tone: AlertTone }> = {
  correo: { label: 'Correo', icon: 'mail', tone: 'celeste' },
  web: { label: 'Web', icon: 'public', tone: 'celeste' },
  redes: { label: 'Redes', icon: 'share', tone: 'yellow' },
  manual: { label: 'Manual', icon: 'edit', tone: 'gray' },
}
const statusMeta: Record<Status, { label: string; tone: AlertTone }> = {
  por_verificar: { label: 'Por verificar', tone: 'yellow' },
  verificado: { label: 'Verificado', tone: 'green' },
  descartado: { label: 'Descartado', tone: 'gray' },
}

const tab = ref<Status>('por_verificar')
const items = ref<Indicio[]>([])
const loading = ref(true)
const error = ref('')
const incidentes = ref<IncidentOpt[]>([])
const incidentOptions = computed(() => incidentes.value.map((i) => ({ label: `${i.code} · ${i.title}`, value: i.id })))

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get<{ items: Indicio[] }>(`/indicios?status=${tab.value}`)
    items.value = res.items
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'No se pudo cargar la bandeja.'
  } finally {
    loading.value = false
  }
}
async function loadIncidentes() {
  try {
    const res = await api.get<{ items: IncidentOpt[] }>('/incidents')
    incidentes.value = res.items
  } catch {
    /* silencioso: el selector queda vacío */
  }
}
onMounted(async () => {
  await Promise.all([load(), loadIncidentes()])
})
function changeTab(s: Status) {
  tab.value = s
  load()
}

const req = (v: unknown) => (!!v && String(v).trim().length > 0) || 'Campo obligatorio'
const saving = ref(false)

// --- Capturar de redes (RF-27: captura humana legal) ---
const showCapture = ref(false)
const cap = reactive({ title: '', url: '', sender: '', content: '', sourceOrg: '', incidentId: '' as string | null })
function openCapture() {
  cap.title = ''
  cap.url = ''
  cap.sender = ''
  cap.content = ''
  cap.sourceOrg = ''
  cap.incidentId = null
  showCapture.value = true
}
async function capturar() {
  saving.value = true
  try {
    await api.post('/indicios', {
      channel: 'redes',
      title: cap.title,
      url: cap.url || undefined,
      sender: cap.sender || undefined,
      content: cap.content || undefined,
      sourceOrg: cap.sourceOrg || undefined,
      incidentId: cap.incidentId || undefined,
    })
    $q.notify({ type: 'positive', message: 'Indicio capturado', caption: 'Queda «por verificar», fuera del BIE.', icon: 'share' })
    showCapture.value = false
    if (tab.value === 'por_verificar') await load()
  } catch (e) {
    $q.notify({ type: 'negative', message: e instanceof ApiError ? e.message : 'No se pudo capturar' })
  } finally {
    saving.value = false
  }
}

// --- Verificar (visto bueno → promueve a fuente) ---
const showVerify = ref(false)
const target = ref<Indicio | null>(null)
const ver = reactive({ incidentId: '' as string | null, promote: true, sourceOrg: '', note: '' })
function openVerify(it: Indicio) {
  target.value = it
  ver.incidentId = it.incidentId
  ver.promote = true
  ver.sourceOrg = it.org ?? ''
  ver.note = ''
  showVerify.value = true
}
async function verificar() {
  if (!target.value) return
  saving.value = true
  try {
    await api.post(`/indicios/${target.value.id}/verify`, {
      incidentId: ver.incidentId || undefined,
      promote: ver.promote,
      sourceOrg: ver.sourceOrg || undefined,
      note: ver.note || undefined,
    })
    $q.notify({
      type: 'positive',
      message: 'Indicio verificado',
      caption: ver.promote ? 'Agregado como fuente del incidente.' : 'Marcado como verificado.',
      icon: 'verified',
    })
    showVerify.value = false
    await load()
  } catch (e) {
    $q.notify({ type: 'negative', message: e instanceof ApiError ? e.message : 'No se pudo verificar' })
  } finally {
    saving.value = false
  }
}

// --- Descartar ---
const showDiscard = ref(false)
const discardNote = ref('')
function openDiscard(it: Indicio) {
  target.value = it
  discardNote.value = ''
  showDiscard.value = true
}
async function descartar() {
  if (!target.value) return
  saving.value = true
  try {
    await api.post(`/indicios/${target.value.id}/discard`, { note: discardNote.value || undefined })
    $q.notify({ type: 'info', message: 'Indicio descartado', icon: 'block' })
    showDiscard.value = false
    await load()
  } catch (e) {
    $q.notify({ type: 'negative', message: e instanceof ApiError ? e.message : 'No se pudo descartar' })
  } finally {
    saving.value = false
  }
}

// --- Ver detalle ---
const showDetail = ref(false)
const detail = ref<IndicioDetail | null>(null)
async function openDetail(it: Indicio) {
  showDetail.value = true
  detail.value = null
  try {
    detail.value = await api.get<IndicioDetail>(`/indicios/${it.id}`)
  } catch (e) {
    $q.notify({ type: 'negative', message: e instanceof ApiError ? e.message : 'No se pudo cargar el detalle' })
    showDetail.value = false
  }
}
</script>

<template>
  <q-page class="q-pa-lg">
    <div class="row items-center q-mb-xs">
      <h1 class="text-h6">Bandeja de indicios</h1>
      <q-space />
      <q-btn v-if="canEdit" color="primary" unelevated size="sm" icon="share" label="Capturar de redes" @click="openCapture" />
    </div>
    <div class="text-caption text-muted q-mb-md">
      Material que llega por correo, webs oficiales o captura de redes. Nada entra al BIE sin tu visto bueno.
    </div>

    <q-banner v-if="error" rounded class="bg-red-1 text-red-9 q-mb-md">
      {{ error }}
      <template #action><q-btn flat label="Reintentar" @click="load" /></template>
    </q-banner>

    <q-tabs
      v-model="tab"
      align="left"
      no-caps
      class="q-mb-md"
      active-color="primary"
      indicator-color="primary"
      @update:model-value="changeTab"
    >
      <q-tab name="por_verificar" label="Por verificar" />
      <q-tab name="verificado" label="Verificadas" />
      <q-tab name="descartado" label="Descartadas" />
    </q-tabs>

    <q-card flat bordered>
      <q-markup-table flat tabindex="0" :aria-label="`Indicios: ${statusMeta[tab].label}`">
        <thead>
          <tr>
            <th class="text-left">Canal</th>
            <th class="text-left">Indicio</th>
            <th class="text-left">Origen</th>
            <th class="text-left">Recibido</th>
            <th class="text-left">Incidente</th>
            <th class="text-left">{{ tab === 'por_verificar' ? 'Acciones' : 'Revisión' }}</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="loading">
            <tr v-for="n in 4" :key="n">
              <td v-for="c in 6" :key="c"><q-skeleton type="text" /></td>
            </tr>
          </template>
          <template v-else>
            <tr v-for="it in items" :key="it.id">
              <td>
                <AlertBadge :label="channelMeta[it.channel].label" :tone="channelMeta[it.channel].tone" />
              </td>
              <td>
                <div class="ind-title">{{ it.title }}</div>
                <div class="text-caption text-muted">
                  <span v-if="!it.isOfficial" class="no-oficial">no oficial</span>
                  <span v-if="it.sender">{{ it.sender }}</span>
                </div>
              </td>
              <td class="text-muted">{{ it.org || '—' }}</td>
              <td class="tabular text-muted">{{ it.receivedAt }}</td>
              <td class="text-muted">{{ it.incidentCode || '—' }}</td>
              <td>
                <template v-if="tab === 'por_verificar' && canEdit">
                  <button type="button" class="link" @click="openVerify(it)">verificar</button>
                  <span class="sep">·</span>
                  <button type="button" class="link" @click="openDiscard(it)">descartar</button>
                  <span class="sep">·</span>
                  <button type="button" class="link" @click="openDetail(it)">ver</button>
                </template>
                <template v-else>
                  <div v-if="it.reviewer" class="text-caption">
                    {{ it.reviewer }}<span v-if="it.reviewedAt" class="text-muted"> · {{ it.reviewedAt }}</span>
                  </div>
                  <button type="button" class="link" @click="openDetail(it)">ver</button>
                </template>
              </td>
            </tr>
            <tr v-if="items.length === 0">
              <td colspan="6" class="text-center text-muted q-pa-lg">Sin indicios en «{{ statusMeta[tab].label }}».</td>
            </tr>
          </template>
        </tbody>
      </q-markup-table>
    </q-card>

    <!-- Capturar de redes -->
    <q-dialog v-model="showCapture" aria-label="Capturar indicio de redes">
      <q-card style="min-width: 380px; max-width: 94vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-subtitle1">Capturar de redes</div>
          <q-space />
          <q-btn v-close-popup type="button" icon="close" flat round dense aria-label="Cerrar" />
        </q-card-section>
        <q-form greedy @submit.prevent="capturar">
          <q-card-section class="q-gutter-sm">
            <div class="text-caption text-muted">
              Legal: pega el enlace y una descripción del post oficial. Queda «por verificar» y fuera del BIE hasta tu visto bueno.
            </div>
            <q-input v-model="cap.title" label="Qué dice / título *" outlined dense :rules="[req]" autofocus />
            <q-input v-model="cap.url" label="Enlace del post oficial" outlined dense />
            <q-input v-model="cap.sender" label="Perfil oficial (ej. @Senapred)" outlined dense />
            <q-input v-model="cap.sourceOrg" label="Organismo" outlined dense />
            <q-input v-model="cap.content" label="Detalle / cita" outlined dense type="textarea" autogrow />
            <q-select
              v-model="cap.incidentId"
              :options="incidentOptions"
              label="Incidente (opcional)"
              outlined
              dense
              emit-value
              map-options
              clearable
            />
          </q-card-section>
          <q-card-actions align="right" class="q-pr-md q-pb-md">
            <q-btn v-close-popup type="button" flat label="Cancelar" />
            <q-btn type="submit" color="primary" unelevated label="Capturar" :loading="saving" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- Verificar -->
    <q-dialog v-model="showVerify" aria-label="Verificar indicio">
      <q-card style="min-width: 380px; max-width: 94vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-subtitle1">Verificar indicio</div>
          <q-space />
          <q-btn v-close-popup type="button" icon="close" flat round dense aria-label="Cerrar" />
        </q-card-section>
        <q-card-section class="q-gutter-sm">
          <div class="text-body2">{{ target?.title }}</div>
          <q-select
            v-model="ver.incidentId"
            :options="incidentOptions"
            label="Incidente"
            outlined
            dense
            emit-value
            map-options
            clearable
            hint="Necesario si vas a agregarlo como fuente."
          />
          <q-toggle v-model="ver.promote" :label="ver.promote ? 'Agregar como fuente del incidente' : 'Solo marcar verificado'" />
          <q-input v-model="ver.sourceOrg" label="Organismo (fuente)" outlined dense />
          <q-input v-model="ver.note" label="Nota de verificación (opcional)" outlined dense />
        </q-card-section>
        <q-card-actions align="right" class="q-pr-md q-pb-md">
          <q-btn v-close-popup type="button" flat label="Cancelar" />
          <q-btn type="button" color="primary" unelevated label="Dar visto bueno" :loading="saving" @click="verificar" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Descartar -->
    <q-dialog v-model="showDiscard" aria-label="Descartar indicio">
      <q-card style="min-width: 340px; max-width: 94vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-subtitle1">Descartar indicio</div>
          <q-space />
          <q-btn v-close-popup type="button" icon="close" flat round dense aria-label="Cerrar" />
        </q-card-section>
        <q-card-section class="q-gutter-sm">
          <div class="text-body2">{{ target?.title }}</div>
          <q-input v-model="discardNote" label="Motivo (opcional)" outlined dense autofocus />
        </q-card-section>
        <q-card-actions align="right" class="q-pr-md q-pb-md">
          <q-btn v-close-popup type="button" flat label="Cancelar" />
          <q-btn type="button" color="negative" unelevated label="Descartar" :loading="saving" @click="descartar" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Detalle -->
    <q-dialog v-model="showDetail" aria-label="Detalle del indicio">
      <q-card style="min-width: 380px; max-width: 94vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-subtitle1">Detalle del indicio</div>
          <q-space />
          <q-btn v-close-popup type="button" icon="close" flat round dense aria-label="Cerrar" />
        </q-card-section>
        <q-card-section v-if="detail" class="q-gutter-xs">
          <div class="row items-center q-gutter-xs">
            <AlertBadge :label="channelMeta[detail.channel].label" :tone="channelMeta[detail.channel].tone" />
            <AlertBadge :label="statusMeta[detail.status].label" :tone="statusMeta[detail.status].tone" />
            <AlertBadge v-if="!detail.isOfficial" label="no oficial" tone="gray" />
          </div>
          <div class="text-subtitle2 q-mt-sm">{{ detail.title }}</div>
          <div class="text-caption text-muted">
            {{ detail.org || 'Sin organismo' }} · recibido {{ detail.receivedAt }}
            <span v-if="detail.sender"> · {{ detail.sender }}</span>
          </div>
          <a v-if="detail.url" :href="detail.url" target="_blank" rel="noopener noreferrer" class="link">Abrir enlace ↗</a>
          <p v-if="detail.content" class="ind-content">{{ detail.content }}</p>
          <div v-if="detail.reviewer" class="text-caption text-muted">
            Revisado por {{ detail.reviewer }}<span v-if="detail.reviewedAt"> · {{ detail.reviewedAt }}</span>
            <span v-if="detail.reviewNote"> — “{{ detail.reviewNote }}”</span>
          </div>
        </q-card-section>
        <q-card-section v-else><q-skeleton type="text" /><q-skeleton type="text" /></q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped>
.ind-title {
  font-weight: 500;
}
.no-oficial {
  color: var(--c-red);
  font-weight: 600;
  margin-right: 6px;
}
.ind-content {
  white-space: pre-wrap;
  margin: 8px 0 0;
  color: var(--c-text2);
}
.sep {
  color: var(--c-muted);
  margin: 0 6px;
}
:deep(.q-tab--inactive) {
  opacity: 1;
}
:deep(.q-tab--inactive .q-tab__label) {
  color: var(--c-text2);
}
</style>
