<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useData } from '@/services/data'
import type { IncidentDetail, EvidenceItem } from '@/types'
import { senapredBadge, cruzRojaBadge } from '@/utils/alerts'
import AlertBadge from '@/components/ui/AlertBadge.vue'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const data = useData()
const inc = ref<IncidentDetail | null>(null)
const loading = ref(true)
const evidence = ref<EvidenceItem[]>([])

onMounted(async () => {
  inc.value = (await data.getIncident(String(route.params.id))) ?? null
  evidence.value = inc.value ? [...inc.value.evidence] : []
  loading.value = false
})

// --- Captura de evidencia (ingesta manual con procedencia) ---
const showAdd = ref(false)
const tipos = ['Imagen', 'PDF', 'Captura', 'Documento', 'Enlace']
const kindMap: Record<string, EvidenceItem['kind']> = {
  Imagen: 'image', PDF: 'pdf', Captura: 'screenshot', Documento: 'doc', Enlace: 'link',
}
const ev = reactive<{ tipo: string | null; caption: string; source: string; at: string; url: string; file: File | null }>({
  tipo: null, caption: '', source: '', at: '', url: '', file: null,
})
const req = (v: unknown) => (!!v && String(v).trim().length > 0) || 'Campo obligatorio'

function openAdd() {
  ev.tipo = null; ev.caption = ''; ev.source = ''; ev.at = ''; ev.url = ''; ev.file = null
  showAdd.value = true
}

function agregarEvidencia() {
  const kind = kindMap[ev.tipo ?? ''] ?? 'doc'
  evidence.value.unshift({
    id: 'e' + Date.now(),
    kind,
    caption: ev.caption,
    source: ev.source,
    at: ev.at,
    url: ev.tipo === 'Enlace' ? ev.url : ev.file?.name,
  })
  $q.notify({ type: 'positive', message: 'Evidencia agregada', caption: `${ev.caption} · ${ev.source}`, icon: 'check_circle' })
  showAdd.value = false
}

function actualizar() {
  $q.notify({ type: 'info', message: 'Reporte actualizado', caption: 'Se guardó un nuevo reporte en el historial', icon: 'update' })
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
          <div class="text-h6">{{ inc.title }}</div>
        </div>
        <q-space />
        <div class="column items-end q-gutter-xs">
          <div class="badges">
            <AlertBadge :tone="senapredBadge(inc.alertSenapred).tone" :label="'SENAPRED: ' + senapredBadge(inc.alertSenapred).label" />
            <AlertBadge :tone="cruzRojaBadge(inc.alertCruzRoja).tone" :label="'Cruz Roja: ' + cruzRojaBadge(inc.alertCruzRoja).label" />
          </div>
          <q-btn color="primary" unelevated size="sm" label="Generar BIE" @click="router.push('/bie')" />
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
            <div class="sec-title q-mb-sm">Cronología</div>
            <q-timeline color="negative">
              <q-timeline-entry v-for="(t, idx) in inc.timeline" :key="idx" :subtitle="t.at">
                {{ t.text }}
                <span v-if="t.source" class="text-caption text-muted">· {{ t.source }}</span>
              </q-timeline-entry>
            </q-timeline>
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
                  <div class="evidence-thumb"><q-icon :name="e.kind === 'link' ? 'link' : 'description'" size="18px" class="q-mr-xs" />{{ e.kind }}</div>
                  <div class="q-pa-xs">
                    <div class="text-caption ellipsis-2-lines">{{ e.caption }}</div>
                    <div class="text-caption text-muted">{{ e.source }}<span v-if="e.at"> · {{ e.at }}</span></div>
                  </div>
                </q-card>
              </div>
              <div class="col-6 col-sm-4">
                <q-card
                  flat bordered
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
              <q-btn dense outline size="sm" label="Actualizar" @click="actualizar" />
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
            <q-markup-table flat dense>
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
            <div class="sec-title q-mb-sm">Fuentes consultadas</div>
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
    <q-dialog v-model="showAdd">
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
            <q-input v-model="ev.source" label="Fuente / procedencia *" placeholder="Ej: SENAPRED, municipalidad, terreno…" outlined dense :rules="[req]" />
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
            <q-input v-if="ev.tipo === 'Enlace'" v-model="ev.url" label="Enlace (URL) *" placeholder="https://…" outlined dense :rules="[req]" />
            <q-file v-else v-model="ev.file" label="Archivo" outlined dense accept=".jpg,.jpeg,.png,.pdf,.docx">
              <template #prepend><q-icon name="attach_file" /></template>
            </q-file>
          </q-card-section>
          <q-card-actions align="right" class="q-pr-md q-pb-md">
            <q-btn type="button" flat label="Cancelar" v-close-popup />
            <q-btn type="submit" color="primary" unelevated label="Agregar" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped>
.badges { display: flex; flex-wrap: wrap; gap: 6px; }
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
