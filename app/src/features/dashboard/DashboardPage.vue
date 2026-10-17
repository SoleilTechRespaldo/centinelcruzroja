<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useData } from '@/services/data'
import { api, ApiError } from '@/services/api'
import type { DashboardData, AlertSenapred, AlertCruzRoja, IncidentStatus } from '@/types'
import { senapredBadge, cruzRojaBadge } from '@/utils/alerts'
import AlertBadge from '@/components/ui/AlertBadge.vue'

const router = useRouter()
const data = useData()

type Tab = 'general' | 'incidente' | 'historico'
const tab = ref<Tab>('general')

// --- General (panel regional) ---
const dash = ref<DashboardData | null>(null)
const loading = ref(true)
async function loadGeneral() {
  loading.value = true
  dash.value = await data.getDashboard()
  loading.value = false
}

// --- Histórico / monitoreo ---
interface Historico {
  totals: { incidentes: number; activos: number; enMonitoreo: number; cerrados: number; bieGenerados: number; bieAprobados: number }
  porTipo: { label: string; n: number }[]
  porMes: { label: string; n: number }[]
  biePorMes: { label: string; n: number }[]
}
const hist = ref<Historico | null>(null)
async function loadHistorico() {
  try {
    hist.value = await api.get<Historico>('/stats/historico')
  } catch {
    /* silencioso */
  }
}
function pct(n: number, serie: { n: number }[]): number {
  const max = serie.reduce((m, b) => Math.max(m, b.n), 0)
  return max > 0 ? Math.round((n / max) * 100) : 0
}

// --- Por incidente ---
interface IncidentOpt {
  id: string
  code: string
  title: string
}
interface IncidentStats {
  id: string
  code: string
  title: string
  status: IncidentStatus
  eventType: string
  alertSenapred: AlertSenapred
  alertCruzRoja: AlertCruzRoja
  diasActivo: number
  comunas: number
  fuentes: number
  evidencias: number
  hitos: number
  marcadores: number
  indicios: { total: number; por_verificar: number; verificado: number; descartado: number }
  bie: { versiones: number; aprobados: number }
  personasAfectadas: string
  voluntarios: number
}
const incidentes = ref<IncidentOpt[]>([])
const incidentOptions = computed(() => incidentes.value.map((i) => ({ label: `${i.code} · ${i.title}`, value: i.id })))
const selectedIncident = ref<string | null>(null)
const incStats = ref<IncidentStats | null>(null)
const loadingInc = ref(false)

async function loadIncidentes() {
  try {
    incidentes.value = (await api.get<{ items: IncidentOpt[] }>('/incidents')).items
    if (!selectedIncident.value && incidentes.value[0]) selectedIncident.value = incidentes.value[0].id
  } catch {
    /* silencioso */
  }
}
watch(selectedIncident, async (id) => {
  if (!id) {
    incStats.value = null
    return
  }
  loadingInc.value = true
  try {
    incStats.value = await api.get<IncidentStats>(`/stats/incident/${id}`)
  } catch (e) {
    incStats.value = null
    if (!(e instanceof ApiError)) throw e
  } finally {
    loadingInc.value = false
  }
})

const statusLabel: Record<string, string> = { monitoring: 'En monitoreo', active: 'Activo', closed: 'Cerrado' }

const incTiles = computed(() => {
  const s = incStats.value
  if (!s) return []
  return [
    { label: 'Días en curso', value: s.diasActivo },
    { label: 'Comunas', value: s.comunas },
    { label: 'Fuentes', value: s.fuentes },
    { label: 'Evidencias', value: s.evidencias },
    { label: 'Indicios', value: s.indicios.total },
    { label: 'Versiones BIE', value: s.bie.versiones },
    { label: 'Afectaciones (mapa)', value: s.marcadores },
    { label: 'Hitos cronología', value: s.hitos },
    { label: 'Personas afectadas', value: s.personasAfectadas },
    { label: 'Voluntarios', value: s.voluntarios },
  ]
})

onMounted(() => {
  loadGeneral()
  loadHistorico()
  loadIncidentes()
})
function refrescar() {
  loadGeneral()
  loadHistorico()
}
</script>

<template>
  <q-page class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <h1 class="text-h6">Estadísticas</h1>
      <q-space />
      <span v-if="dash" class="text-caption text-muted q-mr-sm">Actualizado {{ dash.updatedAgo }}</span>
      <q-btn dense outline size="sm" label="Actualizar" :loading="loading" @click="refrescar" />
    </div>

    <q-tabs v-model="tab" align="left" no-caps class="q-mb-md" active-color="primary" indicator-color="primary">
      <q-tab name="general" label="General" />
      <q-tab name="incidente" label="Por incidente" />
      <q-tab name="historico" label="Histórico" />
    </q-tabs>

    <!-- ============ GENERAL (regional) ============ -->
    <div v-show="tab === 'general'">
      <template v-if="dash">
        <div class="sec-title q-mb-sm">Situación actual</div>
        <div class="row q-col-gutter-sm q-mb-sm">
          <div v-for="m in dash.metrics" :key="m.label" class="col-6 col-md-3">
            <q-card flat bordered class="q-pa-md">
              <div class="text-caption text-muted">{{ m.label }}</div>
              <div class="text-h5 text-weight-bold" :style="m.color ? { color: m.color } : undefined">{{ m.value }}</div>
            </q-card>
          </div>
        </div>
        <div class="row q-col-gutter-sm q-mb-lg">
          <div v-for="m in dash.metrics2" :key="m.label" class="col-6 col-md-4">
            <q-card flat bordered class="q-pa-md">
              <div class="text-caption text-muted">{{ m.label }}</div>
              <div class="text-h5 text-weight-bold">{{ m.value }}</div>
            </q-card>
          </div>
        </div>

        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-12 col-md-8">
            <q-card flat bordered class="q-pa-md">
              <div class="sec-title q-mb-sm">Incidentes activos</div>
              <q-markup-table flat tabindex="0" aria-label="Incidentes activos">
                <thead>
                  <tr>
                    <th class="text-left">Código</th>
                    <th class="text-left">Evento</th>
                    <th class="text-left">SENAPRED</th>
                    <th class="text-left">Cruz Roja</th>
                    <th class="text-left">Comunas</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="i in dash.activeIncidents" :key="i.id" class="cursor-pointer" @click="router.push(`/incidents/${i.id}`)">
                    <td class="tabular text-muted">{{ i.code }}</td>
                    <td>{{ i.eventType }}</td>
                    <td><AlertBadge v-bind="senapredBadge(i.alertSenapred)" /></td>
                    <td><AlertBadge v-bind="cruzRojaBadge(i.alertCruzRoja)" /></td>
                    <td>
                      <span class="tabular text-weight-medium">{{ i.comunas.length }}</span>
                      <span class="text-caption text-muted q-ml-xs">{{ i.comunas.join(', ') }}</span>
                    </td>
                  </tr>
                  <tr v-if="dash.activeIncidents.length === 0">
                    <td colspan="5" class="text-center text-muted q-pa-md">Sin incidentes activos.</td>
                  </tr>
                </tbody>
              </q-markup-table>
            </q-card>
          </div>
          <div class="col-12 col-md-4">
            <q-card flat bordered class="q-pa-md">
              <div class="sec-title q-mb-sm">Comunas por alerta</div>
              <div class="badges">
                <AlertBadge v-for="c in dash.comunasByAlert" :key="c.name" :label="c.name" :tone="c.tone" />
              </div>
            </q-card>
          </div>
        </div>
      </template>
      <div v-else class="q-gutter-sm"><q-skeleton height="80px" /><q-skeleton height="200px" /></div>
    </div>

    <!-- ============ POR INCIDENTE ============ -->
    <div v-show="tab === 'incidente'">
      <q-card flat bordered class="q-pa-md q-mb-md">
        <q-select
          v-model="selectedIncident"
          :options="incidentOptions"
          label="Elige un incidente"
          outlined
          dense
          emit-value
          map-options
          style="max-width: 460px"
        />
      </q-card>

      <template v-if="incStats">
        <div class="row items-center q-mb-sm q-gutter-xs">
          <div class="text-subtitle1">{{ incStats.code }} · {{ incStats.title }}</div>
          <AlertBadge :label="statusLabel[incStats.status] ?? incStats.status" tone="gray" />
          <AlertBadge v-bind="senapredBadge(incStats.alertSenapred)" />
          <AlertBadge v-bind="cruzRojaBadge(incStats.alertCruzRoja)" />
          <q-space />
          <q-btn dense flat size="sm" color="primary" label="Abrir incidente" @click="router.push(`/incidents/${incStats.id}`)" />
        </div>
        <div class="text-caption text-muted q-mb-md">Tipo: {{ incStats.eventType }}</div>

        <div class="row q-col-gutter-sm q-mb-md">
          <div v-for="t in incTiles" :key="t.label" class="col-6 col-sm-4 col-md-3">
            <q-card flat bordered class="q-pa-md">
              <div class="text-caption text-muted">{{ t.label }}</div>
              <div class="text-h5 text-weight-bold">{{ t.value }}</div>
            </q-card>
          </div>
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-card flat bordered class="q-pa-md">
              <div class="sec-title q-mb-sm">Indicios</div>
              <div class="kv">
                <span>Por verificar</span><b>{{ incStats.indicios.por_verificar }}</b>
              </div>
              <div class="kv">
                <span>Verificados</span><b>{{ incStats.indicios.verificado }}</b>
              </div>
              <div class="kv">
                <span>Descartados</span><b>{{ incStats.indicios.descartado }}</b>
              </div>
            </q-card>
          </div>
          <div class="col-12 col-md-6">
            <q-card flat bordered class="q-pa-md">
              <div class="sec-title q-mb-sm">BIE</div>
              <div class="kv">
                <span>Versiones</span><b>{{ incStats.bie.versiones }}</b>
              </div>
              <div class="kv">
                <span>Aprobadas</span><b>{{ incStats.bie.aprobados }}</b>
              </div>
            </q-card>
          </div>
        </div>
      </template>
      <div v-else-if="loadingInc" class="q-gutter-sm"><q-skeleton height="120px" /></div>
      <div v-else class="text-muted q-pa-md">Elige un incidente para ver sus estadísticas.</div>
    </div>

    <!-- ============ HISTÓRICO / MONITOREO ============ -->
    <div v-show="tab === 'historico'">
      <template v-if="hist">
        <div class="row q-col-gutter-sm q-mb-lg">
          <div
            v-for="t in [
              { label: 'Incidentes (total)', value: hist.totals.incidentes },
              { label: 'Activos', value: hist.totals.activos },
              { label: 'En monitoreo', value: hist.totals.enMonitoreo },
              { label: 'Cerrados', value: hist.totals.cerrados },
              { label: 'BIE generados', value: hist.totals.bieGenerados },
              { label: 'BIE aprobados', value: hist.totals.bieAprobados },
            ]"
            :key="t.label"
            class="col-6 col-md-2"
          >
            <q-card flat bordered class="q-pa-md">
              <div class="text-caption text-muted">{{ t.label }}</div>
              <div class="text-h5 text-weight-bold">{{ t.value }}</div>
            </q-card>
          </div>
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-card flat bordered class="q-pa-md">
              <div class="text-caption text-muted q-mb-md">Eventos por tipo</div>
              <div v-if="hist.porTipo.length === 0" class="text-muted text-caption">Sin datos.</div>
              <div v-for="b in hist.porTipo" :key="b.label" class="bar-row">
                <span class="bar-label">{{ b.label }}</span>
                <div class="bar-track">
                  <div class="bar-fill" :style="{ width: pct(b.n, hist.porTipo) + '%', background: 'var(--c-red)' }" />
                </div>
                <span class="bar-val tabular">{{ b.n }}</span>
              </div>
            </q-card>
          </div>
          <div class="col-12 col-md-6">
            <q-card flat bordered class="q-pa-md">
              <div class="text-caption text-muted q-mb-md">Incidentes por mes (últimos 6)</div>
              <div v-for="b in hist.porMes" :key="b.label" class="bar-row">
                <span class="bar-label" style="width: 60px">{{ b.label }}</span>
                <div class="bar-track">
                  <div class="bar-fill" :style="{ width: pct(b.n, hist.porMes) + '%', background: 'var(--grafito)' }" />
                </div>
                <span class="bar-val tabular">{{ b.n }}</span>
              </div>
            </q-card>
          </div>
          <div class="col-12 col-md-6">
            <q-card flat bordered class="q-pa-md">
              <div class="text-caption text-muted q-mb-md">BIE por mes (últimos 6)</div>
              <div v-for="b in hist.biePorMes" :key="b.label" class="bar-row">
                <span class="bar-label" style="width: 60px">{{ b.label }}</span>
                <div class="bar-track">
                  <div class="bar-fill" :style="{ width: pct(b.n, hist.biePorMes) + '%', background: '#0EA5E9' }" />
                </div>
                <span class="bar-val tabular">{{ b.n }}</span>
              </div>
            </q-card>
          </div>
        </div>
      </template>
      <div v-else class="q-gutter-sm"><q-skeleton height="80px" /><q-skeleton height="200px" /></div>
    </div>
  </q-page>
</template>

<style scoped>
.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 9px;
}
.bar-label {
  width: 120px;
  font-size: 13px;
  color: var(--c-text2);
}
.bar-track {
  flex: 1;
  background: var(--c-surface2);
  border-radius: 4px;
  height: 14px;
}
.bar-fill {
  height: 14px;
  border-radius: 4px;
}
.bar-val {
  width: 22px;
  text-align: right;
  font-size: 12px;
}
.kv {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px solid var(--c-border);
  font-size: 14px;
  color: var(--c-text2);
}
:deep(.q-tab--inactive) {
  opacity: 1;
}
:deep(.q-tab--inactive .q-tab__label) {
  color: var(--c-text2);
}
</style>
