<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useData } from '@/services/data'
import type { IncidentDetail } from '@/types'
import { senapredBadge, cruzRojaBadge } from '@/utils/alerts'
import AlertBadge from '@/components/ui/AlertBadge.vue'

const route = useRoute()
const router = useRouter()
const data = useData()
const inc = ref<IncidentDetail | null>(null)
const loading = ref(true)

onMounted(async () => {
  inc.value = (await data.getIncident(String(route.params.id))) ?? null
  loading.value = false
})
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
            <div class="sec-title q-mb-sm">Evidencias</div>
            <div class="row q-col-gutter-sm">
              <div v-for="e in inc.evidence" :key="e.id" class="col-6 col-sm-4">
                <q-card flat bordered>
                  <div class="evidence-thumb">{{ e.kind }}</div>
                  <div class="q-pa-xs text-caption text-muted">{{ e.caption }} · {{ e.source }}</div>
                </q-card>
              </div>
              <div class="col-6 col-sm-4">
                <q-card flat bordered class="evidence-add cursor-pointer">+ Capturar evidencia</q-card>
              </div>
            </div>
          </q-card>
        </div>

        <div class="col-12 col-md-5">
          <q-card flat bordered class="q-pa-md q-mb-md">
            <div class="row items-center q-mb-sm">
              <div class="sec-title">Situación actual</div>
              <q-space />
              <q-btn dense outline size="sm" label="Actualizar" />
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
</style>
