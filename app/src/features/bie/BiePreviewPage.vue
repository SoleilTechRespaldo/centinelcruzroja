<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useData } from '@/services/data'
import type { BieDraft } from '@/types'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const data = useData()

const loading = ref(true)
// Encabezado / identidad: se cablea al incidente (mismo getBieDraft que Generar BIE).
const d = reactive({ nbie: '', tipo: '', evento: '', fechaReporte: '', senapred: '', cruzRoja: '', incidentId: '' })
const generales = ref<[string, string][]>([])

// Cuerpo (afectación, descripción, firma): contenido de EJEMPLO de la plantilla
// oficial. El incidente mock no trae este detalle; se mantiene para mostrar la
// estética exacta del documento al descargarse.
const afectacion: [string, string][] = [
  ['Afectados', '90 est. (SENAPRED/SEREMI, 17/07)'],
  ['Comunas', 'al menos 26'],
  ['Viviendas', '2 con daños en evaluación'],
  ['Heridos', '3 (Algarrobo 1; Valparaíso 2)'],
  ['Desplazados', '87 (evacuados + albergados)'],
  ['Albergues / albergados', '8 · 64'],
  ['Fallecidos', 'en evaluación'],
  ['Damnificados', '0 (SENAPRED N°178-H)'],
  ['Eléctrico', '126.277 sin suministro (SEC, 11:00)'],
  ['Agua', 'La Calera 700 sin agua (APR)'],
  ['Rutas', 'Ruta 5N km171 y Paso Los Libertadores cerrados'],
  ['Hospitales', '2 (Van Buren; San Camilo)'],
]
const titulos: [string, string][] = [
  ['1. SÍNTESIS DE LA JORNADA.', 'Sistema frontal que afecta a la región desde el 15/07, con viento y precipitaciones en las siete provincias; emergencias menores atendidas por recursos locales.'],
  ['2. ALERTA VIGENTE Y NOVEDAD PRINCIPAL.', 'SENAPRED mantiene Alerta Amarilla (continental) desde el 14/07; a las 15:55 se activó SAE por crecida del Estero Marga Marga (Viña del Mar).'],
  ['3. ALERTAMIENTOS Y AVISOS.', 'DMC alarma AAA4 por precipitaciones (17–19/07); DIRECTEMAR marejadas N°32; SERNAGEOMIN probabilidad alta de remoción; CONAF cierre de áreas protegidas.'],
  ['4. BALANCE REGIONAL.', 'SENAPRED N°178-H (12:00): 64 albergados, 3 lesionados, 0 damnificados, 500 aislados (Petorca), 23 evacuados, 2 viviendas con daños.'],
  ['5. SALUD Y HOSPITALES.', '2 establecimientos afectados: Hospital Van Buren (filtraciones) y San Camilo (drenaje del patio de ambulancias). Red asistencial operativa.'],
  ['6. ESTABLECIMIENTOS EDUCACIONALES.', 'MINEDUC suspendió clases el 17/07 en la región; daños en colegios de Puchuncaví y Quintero.'],
  ['7. VIVIENDAS AFECTADAS.', '2 viviendas con daños en evaluación; derrumbe en Subida Washington (Cerro O’Higgins) con 7 familias en riesgo.'],
  ['8. SITUACIÓN ELÉCTRICA.', 'SEC (11:00): 126.277 clientes sin suministro; más afectadas Quilpué, Valparaíso, Viña y San Felipe. Chilquinta en reposición.'],
  ['9. AGUA POTABLE.', 'La Calera (APR Pachacamita): 700 personas sin agua por corte eléctrico; Nogales operando con respaldo.'],
  ['10. CONECTIVIDAD Y RUTAS.', 'Ruta 5 Norte km 171 y Paso Los Libertadores cerrados; Merval detenido; puertos con restricciones.'],
  ['11. TELECOMUNICACIONES.', 'SUBTEL: 48 sitios caídos por cortes eléctricos; roaming de emergencia activado.'],
  ['12. HIDROLOGÍA Y CAUCES.', 'DGA: Aconcagua en Chacabuquito 11–13 m³/s (umbral 150,7); Estero Marga Marga con alerta de crecida activa.'],
  ['13. EMERGENCIAS POR PROVINCIA Y COMUNA.', 'Valparaíso: cortes y ráfagas de 104 km/h; Petorca: 500 aislados; San Antonio: 23 evacuados; Los Andes: 97 cm de nieve en Lagunitas.'],
  ['14. ACCIONES MUNICIPALES Y DE GOBIERNO.', 'COGRID en funcionamiento; Decreto de Emergencia Preventiva (13–21/07); cierres de Av. España y bordes costeros.'],
  ['15. PROYECCIÓN DEL EVENTO.', 'Continuidad de precipitaciones y viento hasta el 19/07, con tormentas eléctricas; monitoreo de cauces por suelo saturado.'],
  ['16. FUENTES CONSULTADAS.', 'SENAPRED, DMC, DGA, Vialidad-MOP, DIRECTEMAR, SERNAGEOMIN, CONAF, SEC/Chilquinta, Esval, SUBTEL, Delegación Presidencial, MINEDUC, MINSAL, EFE.'],
]

function applyDraft(x: BieDraft) {
  d.nbie = x.datos.nbie
  d.tipo = x.datos.tipo
  d.evento = x.incidentTitle
  d.fechaReporte = x.datos.fechaReporte
  d.senapred = x.datos.senapred
  d.cruzRoja = x.datos.cruzRoja
  d.incidentId = x.incidentId
  generales.value = [
    ['Tipo de emergencia', x.datos.tipo],
    ['Evento', `${x.datos.tipo} — ${x.incidentTitle}`],
    ['Fecha y hora del evento', x.datos.fechaEvento],
    ['Fecha y hora del reporte', x.datos.fechaReporte],
    ['Alerta Cruz Roja', x.datos.cruzRoja],
    ['Alerta SENAPRED', x.datos.senapred],
    ['Magnitud / Intensidad', 'N/A'],
    ['Afectación territorial', `${x.afectacion.Comunas} comunas`],
  ]
}

async function load() {
  loading.value = true
  const id = String(route.query.incident ?? '')
  let draft = id ? await data.getBieDraft(id) : undefined
  if (!draft) {
    const list = await data.listIncidents()
    const first = list.find((i) => i.status === 'active') ?? list[0]
    if (first) draft = await data.getBieDraft(first.id)
  }
  if (draft) applyDraft(draft)
  loading.value = false
}
onMounted(load)

function volver() {
  router.push({ path: '/bie', query: d.incidentId ? { incident: d.incidentId } : {} })
}
function exportar(fmt: 'Word' | 'PDF') {
  $q.notify({ type: 'ongoing', message: `Generando ${fmt} con la plantilla oficial…`, timeout: 900 })
}
</script>

<template>
  <q-page class="q-pa-lg">
    <div class="row items-start q-mb-md">
      <div>
        <div class="text-caption tabular text-muted">Vista previa · BIE N°{{ d.nbie }}</div>
        <div class="text-h6">Documento BIE</div>
        <div class="text-caption text-muted">Al descargar, el Word/PDF usa tu plantilla oficial → logos y formato exactos</div>
      </div>
      <q-space />
      <q-btn outline size="sm" label="← Volver" @click="volver" />
      <q-btn outline size="sm" label="Word" class="q-ml-xs" @click="exportar('Word')" />
      <q-btn color="primary" unelevated size="sm" label="PDF" class="q-ml-xs" @click="exportar('PDF')" />
    </div>

    <div class="doc-backdrop">
      <div class="doc">
        <div class="doc-wm">BORRADOR · NO OFICIAL</div>
        <div class="doc-header">
          <div class="doc-org">CRUZ ROJA CHILENA</div>
          <div class="text-caption text-muted">Comité Regional Valparaíso</div>
          <div class="doc-title">Boletín de Información de Emergencia (BIE) — Monitoreo Regional</div>
          <div class="text-caption text-muted">N°{{ d.nbie }} · {{ d.tipo }} | Región de Valparaíso | {{ d.fechaReporte }}</div>
        </div>

        <div class="doc-sec">1. Datos generales</div>
        <table class="doc-table">
          <tr v-for="[k, v] in generales" :key="k"><td class="k">{{ k }}</td><td>{{ v }}</td></tr>
        </table>

        <div class="ejemplo-note">Cuerpo de ejemplo (plantilla oficial). El autollenado real de estas secciones llega con el backend.</div>

        <div class="doc-sec">2. Afectación</div>
        <div class="doc-grid">
          <div v-for="[k, v] in afectacion" :key="k"><b>{{ k }}:</b> {{ v }}</div>
        </div>

        <div class="doc-sec">3. Descripción</div>
        <p v-for="[t, txt] in titulos" :key="t" class="doc-p"><b>{{ t }}</b> {{ txt }}</p>

        <div class="doc-sec">4. Filiales y voluntariado</div>
        <p class="doc-p"><b>Filiales:</b> Totalidad de filiales de la región · <b>Voluntarios:</b> al menos 50.</p>
        <p class="doc-p"><b>Accionar:</b> participación en COGRID (gestión); reposición de botiquines (salud); difusión de autocuidado (comunicación); RCF y resguardo de datos sensibles (protección).</p>
        <p class="doc-p"><b>Reporte por filial:</b> Quintero — cierre preventivo. Villa Alemana — albergue habilitado. Viña del Mar — voluntarios en albergues 2 Oriente y 11 Norte.</p>

        <div class="doc-sec">5. Necesidades internas</div>
        <p class="doc-p"><b>Gestión:</b> kits, nylon, linternas, EPP. · <b>Salud:</b> botiquines, gasas, sueros. · <b>Voluntariado:</b> abrigo, impermeable, botas. · <b>Logística:</b> vehículo. · <b>Albergues:</b> kits espacios seguros.</p>

        <div class="doc-firma">
          <p><b>Monitoreo y recopilación de información:</b> Ive Manni, Dayana Moreno, Kabriell Valencia, Sara Girbau, Evelyn Rozas, Nicolás Jerez</p>
          <p><b>Coordinación Sala de Crisis:</b> Activada · <b>Telecomunicaciones:</b> Sin Activar</p>
          <div class="row q-mt-sm">
            <div class="col"><b>Elaborado por:</b> Nicolás Jerez<br /><span class="text-caption text-muted">Equipo de Monitoreo Regional</span></div>
            <div class="col text-right"><b>Autorizado por:</b> Ive Manni<br /><span class="text-caption text-muted">Directora Regional de Gestión del Riesgo</span></div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.doc-backdrop { background: var(--c-surface2); padding: 20px; border-radius: 12px; display: flex; justify-content: center; }
.doc { background: #fff; max-width: 820px; width: 100%; box-shadow: 0 1px 10px rgba(0, 0, 0, 0.12); padding: 38px 44px; position: relative; font-size: 13px; line-height: 1.55; color: #1a1a1a; }
.doc-wm { position: absolute; top: 14px; right: 14px; background: var(--al-red-bg); color: var(--al-red-t); font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 6px; }
.doc-header { text-align: center; border-bottom: 2px solid var(--grafito); padding-bottom: 12px; margin-bottom: 16px; }
.doc-org { font-weight: 600; color: var(--c-red); letter-spacing: 0.5px; }
.doc-title { font-size: 15px; font-weight: 600; margin-top: 10px; }
.doc-sec { font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; border-bottom: 1px solid var(--c-border); padding-bottom: 4px; margin: 16px 0 10px; }
.doc-table { width: 100%; border-collapse: collapse; }
.doc-table td { border: 1px solid #d9d9d9; padding: 5px 9px; }
.doc-table td.k { background: #f3f4f6; font-weight: 500; width: 34%; }
.doc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 12.5px; }
.doc-p { margin: 0 0 7px; }
.doc-firma { margin-top: 22px; padding-top: 12px; border-top: 1px solid var(--c-border); font-size: 12.5px; }
.ejemplo-note { font-size: 11.5px; color: var(--al-yellow-t); background: var(--al-yellow-bg); border-radius: 6px; padding: 5px 9px; margin: 12px 0; }
</style>
