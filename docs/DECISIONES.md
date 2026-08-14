# Registro de decisiones — SoleilTech Sentinel

Decisiones tomadas entre puertas de control, para que sean auditables.
Las más recientes arriba.

## 2026-08-14 — Evidencia persistida + generación real del BIE (.docx)
- **Evidencia:** columna `source_text` (procedencia) en `evidence` (migración **0001**); `POST
  /api/incidents/:id/evidence` (operator+) persiste tipo/descripción/**fuente**/fecha + enlace o
  nombre de archivo; la ficha llama `addEvidence` y recarga. El **archivo real** (subida a R2) queda
  para después — por ahora se guardan metadatos + enlace.
- **BIE `.docx` real:** librería **`docx`** (`lib/bieDocx.ts`) construye el documento (encabezado
  Cruz Roja, datos generales, afectación, 16 títulos, filiales/accionar, necesidades, fuentes, firma).
  `POST /api/incidents/:id/bie/docx` recibe el borrador del formulario y devuelve el `.docx`; el botón
  **Word** lo descarga (`api.postBlob` → blob → `<a download>`). **PDF** pendiente (requiere conversor
  tipo LibreOffice) — por ahora avisa exportar desde el `.docx`.
- **No es la plantilla oficial con logos:** eso se hará con **docxtemplater** sobre el master
  `BIE FORMATO.docx` cuando esté; el generado ahora es real y estructurado.
- **Verificado:** curl (evidencia 201 + aparece en el detalle con su fuente; docx 200 ~9,9 KB con
  firma ZIP `PK`; consulta→403 al capturar); navegador (evidencia persiste y se ve en la ficha; botón
  **Word** descarga el `.docx`, POST 200). `tsc` + `vue-tsc`/build limpios.

## 2026-08-14 — Incidentes de punta a punta (frontend ↔ backend real)
- **Backend:** capa de consultas `src/services/incidents.ts` (Drizzle) — `listSummaries`
  (con comunas por join N:M), `getDetail` (comunas, último reporte, cronología con fuente,
  fuentes, evidencias), `getDashboard` (agrega activos/alertas/comunas/personas/voluntarios +
  comunas por alerta) y `createIncident` (resuelve tipo/comunas por nombre, código correlativo,
  requiere operator/coordinator/admin). Rutas: `GET/POST /api/incidents`, `GET /api/incidents/:id`,
  `GET /api/dashboard`; fechas formateadas en `lib/format.ts`. **Seed** con 4 incidentes de ejemplo.
- **Frontend:** `ApiDataService` (`services/data/api.ts`) implementa la interfaz `DataService`
  usando la capa `api` (JWT); la fábrica ahora usa el API por defecto (`VITE_DATA_SOURCE=mock`
  fuerza el mock). `buildBieDraft` se extrajo a `services/data/bieDraft.ts` (lo comparten mock y api).
  **Nuevo incidente** mapea etiquetas→enums y persiste con `createIncident`.
- **Verificado (navegador, front+back):** dashboard con métricas reales (3 activos, 6 comunas,
  2.590 personas); lista (5) con comunas; detalle de i15 (2.350 personas, 72 voluntarios, 4 hitos,
  2 evidencias, fuentes, 5 filiales); **BIE autollenado** (N°15, Sistema frontal, Amarilla). Crear
  probado por curl (aparece en la lista real). Permisos: consulta lee, no crea (403). Builds limpios.
- **Nota:** el código correlativo del create usa máx+1 (2026-00XX). Persistir la captura de evidencia
  y la generación real del `.docx` del BIE quedan pendientes.

## 2026-08-14 — Frontend conectado al backend: login real + gestión de usuarios
- **Capa API:** `app/src/services/api.ts` — cliente `fetch` a `VITE_API_URL` (default
  `http://localhost:8787`), guarda el **JWT** en `localStorage`, lo manda como Bearer y traduce
  los códigos de error a mensajes en español. `ApiError` con status/code.
- **Sesión real:** `stores/session.ts` reescrito — `login(email, password)` pega al backend,
  guarda token + usuario, **persiste** y `restore()` al recargar (llamado en `main.ts` antes de montar).
  Expone `role`/`isAdmin` además de displayName/initials.
- **Login:** `LoginPage` hace login real (loading + banner de error). Prefill de dev con njerez.
- **Usuarios:** `UsersPage` contra el API — listar, **invitar** (correo+rol+clave inicial), **editar
  rol** y **activar/desactivar**; skeleton/errores; no permite editarse a uno mismo.
- **Permisos en la UI:** el menú **oculta "Usuarios"** a quien no es admin (`adminOnly` + `isAdmin`);
  el topbar muestra nombre + rol. La autorización real la impone el backend (401/403).
- **Verificado en navegador (front+back corriendo):** login admin→JWT+topbar; Usuarios lista real (5);
  **editar → PATCH** (Sara→Inactivo); login `consulta`→ **sin "Usuarios" en el menú** y `/users`→**403**
  con aviso y sin datos. `vue-tsc` + build (PWA) limpios.
- **Nota:** el `q-select` no se puede accionar por automatización (limitación conocida); la **creación**
  por la UI quedó validada hasta el selector, y el endpoint `POST /users` está probado por curl.
- **Pendiente:** conectar dashboard/incidentes/BIE (`ApiDataService` reemplazando el mock).

## 2026-08-14 — Backend en local: BD SQLite + auth por rol + gestión de usuarios
- **Sin cuenta Turso todavía:** el backend corre sobre un **archivo SQLite local** (`file:local.db`)
  con el mismo cliente libSQL. `db:setup` aplica la migración y **siembra** 38 comunas de Valparaíso,
  10 tipos de evento, 15 fuentes oficiales y 4 usuarios por rol. Conectar Turso al final = cambiar
  **2 variables** de entorno (el código no cambia).
- **Auth sin dependencias nuevas:** contraseñas con **scrypt** (`node:crypto`) y sesiones con **JWT**
  (`hono/jwt`, HS256, 8 h). `AUTH_SECRET` en env (default de dev; producción define uno propio).
- **Usuarios por invitación (no auto-registro):** solo **admin** gestiona `/api/users`: listar, crear
  (correo + rol + **clave inicial**, opción a), cambiar rol, activar/desactivar, resetear clave. Un
  admin no puede cambiar su propio rol/estado (evita quedarse sin admin).
- **Roles:** consulta (lee) · operator (crea/edita) · coordinator (aprueba BIE) · admin (gestiona).
  Autorización **en el backend** (SQLite no tiene RLS): `authMiddleware` + `requireRole`.
- **Bitácora:** `audit_log` registra login y altas/cambios de usuario (append-only).
- **Verificado (curl):** login→JWT; `/me`; listar/crear usuarios; **401 sin token, 403 si no es admin**;
  clave incorrecta→401; login del usuario recién creado→200. `tsc` limpio.

## 2026-08-12 — Auditoría de accesibilidad (axe-core) → 0 violaciones AA
- **Método:** axe-core 4.10 inyectado en la app corriendo; barrido de todas las pantallas
  (login, estadísticas, incidentes, ficha, generar BIE, vista previa, mapa, cámaras, catálogos,
  usuarios, expediente) + diálogos, con reglas WCAG 2.0/2.1 A/AA + best-practice.
- **Corregido:**
  - **Contraste (1.4.3):** `--c-muted` #8a93a0 (2.9–3.1:1) → **#646d7b** (≥4.6:1); pestañas
    inactivas de Catálogos (#777778) → `--c-text2`.
  - **Estructura:** `<html lang="es">` + `<title>` real; un **`<h1>`** por pantalla; menú como
    **`<nav>`** (antes `role="list"` con hijos inválidos); **`<main>`** en el layout de login.
  - **Timeline:** `q-timeline` → **lista semántica `<ol>`** (elimina headings vacíos y saltos de nivel).
  - **Nombres accesibles:** `aria-label` en los diálogos (role=dialog), en el textarea del
    expediente y en el `<th>` de acciones (`sr-only`); tablas con `tabindex`+`aria-label` (scroll por teclado).
- **Falso positivo verificado:** axe marca por contraste el botón de envío dentro de un diálogo;
  los colores computados reales son **`#e30613` + blanco = 4.88:1 (cumple AA)** — axe compone mal
  el backdrop del modal como fondo del botón.
- **Pendiente (opcional):** prueba manual con lector de pantalla; lo automatizado está limpio.

## 2026-08-12 — BIE autollenado desde el incidente (contrato DataService)
- **Qué:** Generar BIE y su vista previa ahora se **autollenan desde el incidente** (por
  `?incident=<id>`, o el primer activo por defecto), no desde datos fijos.
- **Cómo:** nuevo `DataService.getBieDraft(incidentId): BieDraft` — el mock lo **deriva del
  incidente** (alertas, comunas, personas, voluntarios/filiales, fuentes); lo que el modelo
  aún no tiene queda **"En evaluación"**. Es la **misma costura** que llenará el backend
  (autollenado real + RF-20). Tipo `BieDraft` en `types/index.ts`.
- **UX honesta:** aviso "Autollenado desde el incidente … · sin fuentes en vivo aún"; en la
  vista previa, encabezado + datos generales dinámicos y nota "cuerpo de ejemplo".
- **Verificado (navegador):** ficha i15 → Generar BIE → `/bie?incident=i15` con N°15, Sistema
  frontal, Amarilla/AMARILLA, 2.350 afectados, 5 comunas, 72 voluntarios, fuentes SENAPRED/
  DMC/Esval; "Ver completo" hereda el encabezado. `vue-tsc` + build (PWA) limpios.

## 2026-08-12 — Pulido frontend: validación, accesibilidad, evidencia, calce (puntos 1–4)
- **Validación (1):** `q-form greedy` + reglas en **Generar BIE** (datos oficiales), **Login**
  (correo/clave) y en los **diálogos** de Evidencia, Catálogos y Usuarios. Botones no-submit
  marcados `type="button"`. Verificado en navegador (BIE: vacío→error, relleno→pasa).
- **Accesibilidad (2):** foco visible global (`:focus-visible`), `aria-label`/`role` en botones
  de solo-ícono, mapa (`role="application"`) y cámaras (`role="img"`); acciones "editar"
  pasaron de `<a>` a `<button>` (accesibles por teclado).
- **Evidencia con procedencia (3):** diálogo en la ficha para adjuntar imagen/PDF/captura/
  documento/**enlace** con **fuente** y **fecha** obligatorias; se agrega a la lista local.
  Se extendió `EvidenceItem` (`kind` +`'link'`, `at?`, `url?`).
- **Calce con el mockup (4):** Catálogos con **datos por pestaña** (filiales/comunas/tipos/
  fuentes) + encabezado dinámico (verificado); Usuarios con diálogo "Invitar" validado;
  `Notify` en botones antes inertes (exportar expediente, mapa PNG/PDF, agregar cámara).
- **Verificado:** `vue-tsc` + build (PWA) limpios; navegador: validación de BIE, apertura del
  diálogo de evidencia con sus campos de procedencia, y cambio de datos por pestaña en Catálogos.
- **Nota:** seleccionar una opción de `q-select` por automatización es poco fiable (no es bug
  del app); para el usuario real funciona igual que el `q-select` ya verificado en Nuevo incidente.

## 2026-08-12 — Mejora de frontend + endurecimiento del backend
- **Frontend:**
  - **Control de tamaño de letra (A−/A+)** en el topbar (lo pedido antes): escala el
    contenido, muestra el %, se recuerda en `localStorage`. Verificado en navegador
    (100 %↔130 %, persistencia OK).
  - **Validación de formularios** en Nuevo incidente (`q-form greedy` + reglas;
    fecha/hora con `q-date`/`q-time`) + feedback con `Notify`. Enviar vacío bloquea y
    marca 4 campos. Verificado en navegador.
  - **Accesibilidad:** `aria-label` en botones de solo-ícono (menú, salir, A−/A+),
    `role="group"` + `aria-live` en el control de letra.
  - **Consistencia con el mockup:** estados de carga (skeleton) y error (banner +
    reintentar) en la lista; tipografía base 15px; acento del menú activo (barra roja).
- **Backend (sin crear la BD):** validación de entrada con **zod** (`@hono/zod-validator`
  — 400 con detalle en entrada inválida, defaults al crear), **manejo de errores** global
  + **404 JSON**, **logger** + **secure-headers**, **env validado** (zod), contrato tipado
  compartido (`src/types.ts`), API versionada bajo **`/api`**, `.gitignore` propio del server.
- **Verificado:** `tsc --noEmit` y `vue-tsc` + build (PWA) limpios; API probado con curl
  (health, `/api/incidents`, POST inválido→400, válido→201, 404).

## 2026-08-12 — Esqueleto del backend + schema de BD (antes de crear la BD)
- **Decisión (a pedido del usuario):** dejar primero el **esqueleto del backend** y
  el **schema de la base de datos** en `server/`, dejando la **creación real de la
  BD Turso para el final**.
- **Stack del server:** **Hono** (API) + **Drizzle ORM** sobre **libSQL/Turso**,
  `@hono/node-server` para dev, ESM (`"type": "module"`) con **tsx**. TypeScript 7.
- **Schema:** `src/db/schema.ts` con las **14 tablas** del ERD (users, regions,
  comunas, event_types, source_orgs, incidents, incident_comunas [N-M],
  incident_reports, sources, evidence, timeline_events, bie_templates, bie_versions,
  audit_log): PK/FK, índices, `unixepoch()` en timestamps, booleanos como integer,
  JSON en columnas de datos. **Migración generada** con `drizzle-kit generate`
  (`drizzle/0000_misty_scorpion.sql`) — valida el schema **sin** conectar a ninguna BD.
- **Cliente diferido:** `src/db/client.ts` lanza error explícito si falta
  `TURSO_DATABASE_URL` ("la BD aún no se crea"). Las rutas (`/incidents`, `/auth`)
  responden **stubs** hasta conectar la BD.
- **Verificación:** `tsc --noEmit` limpio y el server levanta (curl a `/health`,
  `/incidents`, `/auth/login` OK).
- **Secretos:** `.env.example` documentado (Turso, AUTH_SECRET, R2, ANTHROPIC);
  `.env` y `node_modules` ignorados por git.

## 2026-08-11 — Scaffold del frontend (Vite + Quasar plugin)
- **Decisión:** el frontend se scaffoldeó con **Vite (Vue 3 + TS)** + **Quasar como
  plugin** (`@quasar/vite-plugin`) en vez de la CLI de Quasar, porque la CLI es
  interactiva y el entorno es no-interactivo. Mismo stack (Vue 3 + Quasar + TS +
  Vite + PWA con `vite-plugin-pwa`).
- **Marca:** los colores de Quasar se overridean con **variables CSS** (`--q-primary`
  #E30613, etc.) en `app.scss` — más robusto que inyectar variables Sass.
- **Ubicación:** frontend en `Sentinel/app/`; el backend irá en `Sentinel/server/`.
  (Nota: actualizar el árbol de docs/04-ARQUITECTURA.md a esta estructura Vite.)
- **Estado:** compila (build ok + PWA generada) y corre en dev; renderiza shell +
  login + dashboard + incidentes con datos mock.

## 2026-08-10 — Estructura del BIE validada contra un BIE real (N°9)
- **Contexto:** el usuario entregó un BIE real (`BIE_N9_22-07-2026`); se convirtió
  a PDF (Word COM) y se revisó completo.
- **Confirmado:** la estructura del modelo coincide — datos oficiales, datos
  generales (etiquetas exactas), los **16 títulos** de la descripción,
  filiales/voluntariado + bloque "ACCIONES DE CRUZ ROJA CHILENA", necesidades y
  cierre/firma. **Alertas independientes** (SENAPRED Roja + Cruz Roja Verde).
- **Refinado en el modelo:** `monitoreo_equipo` = **lista de nombres** del equipo;
  firma fija (Elaborado por Nicolás Jerez / Autorizado por Ive Manni). El campo
  `acciones_cr` es texto rico multi-línea (con sub-secciones por filial).
- **Nota privacidad:** el BIE real se revisó solo para estructura; no se guarda en
  el repo (contiene datos operativos). Para construir usaremos el **master en
  blanco** (BIE FORMATO.docx o el vigente que entregue el usuario).

## 2026-08-10 — Fidelidad del BIE descargado (misma estética)
- **Decisión:** el `.docx` descargado se genera **rellenando el master oficial**
  `BIE FORMATO.docx` (docxtemplater), que **conserva logos, fuentes, tablas y
  formato exactos** → el documento descargado es **idéntico al BIE oficial**, no
  una recreación. El **PDF** = ese mismo `.docx` exportado a PDF (Word COM /
  LibreOffice), misma estética. La vista previa HTML es solo una aproximación.
- **Nota:** la estética del **documento** la define el master oficial; el design
  system grafito/rojo es para la **interfaz** de Centinela (dos cosas distintas).

## 2026-08-10 — Mapa: zonas estimadas de evento + capas gratis
- **Decisión:** el mapa (RF-28b) mostrará **zonas estimadas de evento** dibujadas
  por el operador (incendio, inundación, lluvia, remoción…) con **leyenda por
  tipo**, más capas oficiales **gratis y opcionales** (NASA FIRMS focos de
  incendio, radar de lluvia RainViewer, sismos CSN/USGS). Dibujo con Leaflet (gratis).
- **Reglas:** todo etiquetado **"estimado/aproximado, no oficial"**; no se dibujan
  footprints precisos inventados. La **leyenda de tipos de evento** se mantiene
  **distinta** de los colores de alerta (comunas) para no confundir.

## 2026-08-10 — Ajustes de UI y dos features nuevas
- **Alerta preventiva → celeste** (`#0EA5E9`) en vez de naranja. Escala: sin
  alerta (verde) · **preventiva (celeste)** · amarilla · roja.
- **Mapa real:** se usa **Leaflet + OpenStreetMap** (mapa real, gratis, sin API
  key) + GeoJSON de comunas. **Google Maps descartado** por costo/billing (choca
  con "todo gratis hasta la empresa"); se retoma con presupuesto si se quiere su
  satélite.
- **Cámaras en vivo (RF-33, Importante):** catálogo **curado** de transmisiones de
  YouTube por zona (embed oficial, gratis); descubrimiento opcional vía YouTube
  Data API (cuota gratuita). Sin scrapear/descargar streams. Integración (Fase 14).

## 2026-08-10 — El BIE se modela según el formato oficial (skill)
- **Decisión:** el sistema captura **todos los campos del BIE** (~45) del formato
  oficial (skill `monitoreo-bie-valparaiso`): datos oficiales, afectación, los 16
  títulos de la descripción, filiales/voluntariado, necesidades, cierre y firma.
  Viven en `bie_versions.data`; los catálogos (comunas, 20 filiales, fuentes) se
  toman de las referencias de la skill.
- **Reglas incorporadas:** fuente+hora por dato; `N/A` vs "En evaluación";
  **privacidad dura** (sin datos personales sensibles); alerta Cruz Roja default
  VERDE; campos fijos (Autorizado por Ive Manni, etc.).

## 2026-08-06 — Métricas estructuradas con historia + voluntarios por filial (ERD)
- **Decisión:** las métricas del panel (personas afectadas, voluntarios, filiales)
  son **campos estructurados** en **`incident_reports`** (reportes de situación
  append-only) → el dashboard suma/grafica y cada actualización **conserva las
  anteriores** para comparar. Se agrega catálogo **`filiales`** y
  **`incident_report_filiales`** (voluntarios activados **por filial**).
- **Narrativa del BIE:** los campos de redacción (accionar, necesidades…) quedan
  **flexibles** (JSON en `bie_versions`), con historia vía versiones.
- **Extensible:** el modelo admite a futuro otros documentos/referencias además
  del BIE (punto 3 de Nicolás).

## 2026-08-06 — Servicios pagos se postergan hasta formalizar la empresa
- **Decisión:** el MVP corre a **US$0** (Turso, Cloudflare Workers/R2/Pages, todo
  free tier). Los ítems con costo — **IA (RF-18)** pago-por-uso y **dominio propio**
  (~US$12/año, opcional) — se **posponen hasta que SoleilTech esté formalizada o
  haya presupuesto**. Mientras tanto: subdominio gratis y sin IA.
- **Nota:** el módulo de imágenes de docxtemplater (pago) se evita con la versión
  comunitaria gratuita.

## 2026-08-06 — Cambio de backend: Supabase → Turso + backend mínimo (G2)
- **Decisión:** se reemplaza Supabase por **Turso (libSQL/SQLite) + un backend
  mínimo en Hono** (Cloudflare Workers), con Drizzle (ORM/migraciones), auth
  propia (Better Auth / JWT+argon2) y almacenamiento en Cloudflare R2.
- **Razón:** Supabase cobra por proyecto más allá de 2 gratis; Turso permite
  muchas bases **aisladas por proyecto** a costo ~0.
- **Impacto:** el **frontend no cambia** (la interfaz `DataService` lo aísla).
  **Supera** la decisión previa de RLS: la autorización pasa a aplicarse **en el
  backend** (por rol/registro). El ERD es casi el mismo (dialecto SQLite).
- **Alternativa evaluada:** PocketBase (todo-incluido, aislado) — descartada por
  requerir host siempre encendido; se prefirió Turso + Workers (serverless).

## 2026-08-06 — Arquitectura (Fase 4): segura y clara
- **Decisión:** Quasar feature-first con la **capa de datos tras una interfaz
  `DataService`** (mock → Supabase sin tocar pantallas). Estado con Pinia; offline
  con outbox Dexie.
- **Seguridad (defensa en profundidad):** autorización por **RLS en la BD** (no en
  el frontend); Supabase Auth (+ MFA para admin/coordinador); bitácora append-only
  (RLS niega update/delete); Storage privado con URLs firmadas; **API del LLM tras
  una Edge Function** (la clave nunca en el cliente); validación también en
  servidor; sanitizar texto pegado (XSS). Ojo offline: IndexedDB no cifrada →
  cachear lo mínimo y limpiar al cerrar sesión.
- **Claridad:** una sola dirección de dependencias (UI → store → DataService →
  impl), tipos como documentación, convenciones únicas, docs vivos.

## 2026-08-06 — Dirección visual y paleta aprobadas (Fase 3)
- **Decisión:** paleta armonizada con Cruz Roja — base neutra (grafito #1E222B,
  blanco, grises), rojo Cruz Roja #E30613 como acento de marca, y escala de
  alertas (verde #1F8A54 / amarilla #E5A400 / preventiva #E4661E / roja #C1121F).
  **Modo solo claro** (sin dark mode). Detalle en docs/03-DISENO.md.
- **Anti-choque:** rojo de marca solo en chrome/acciones; rojo de alerta (más
  profundo) solo en el estado; la base neutra evita que compitan.

## 2026-08-06 — Identidad provisional: Centinela (pendiente evaluación final)
- **Decisión:** nombre provisional **Centinela** (front-runner); alternativas en
  evaluación: Atalaya, Vigía. Mark líder: **torre con faro** (atalaya coronada
  por un faro rojo); alternativas: vigía con catalejo, torre simple, ojo.
- **Estado:** NO definitivo — se confirma en una **evaluación final** de identidad
  antes de producir el kit de logo (variantes, tamaños, ícono, reversa).
- **Legal:** la marca propia NO usa el emblema de la cruz roja; el logo de Cruz
  Roja se muestra solo como "hecho para Cruz Roja Chilena — Comité Regional
  Valparaíso", con su autorización.

## 2026-08-06 — Mapa por comuna promovido a Etapa 1.x
- **Decisión:** RF-28 se divide — **RF-28a (mapa coropleta por comuna, colores +
  leyenda)** sube a **Importante (Etapa 1.x)**; **RF-28b (capas avanzadas: FIRMS,
  sismos, WMS, geocodificación)** queda **Deseable (Etapa 2+)**.
- **Razón:** el mapa por comuna solo visualiza datos que ya se modelan (alerta +
  comunas), funciona offline (GeoJSON público de BCN/IDE Chile), es **descargable
  (PNG/PDF)** y exportable al BIE → alto valor, bajo costo.
- **Matiz:** apoyo aproximado a nivel comuna, etiquetado "no oficial"; no dibuja
  footprints precisos.

## 2026-08-06 — Aprobación del stack (Puerta G2)
- **Decisión:** stack aprobado — Quasar (Vue 3) + TypeScript, PWA; Supabase
  (Postgres/Auth/Storage/RLS); Dexie offline; docxtemplater; ECharts. Defaults
  TypeScript y pnpm aceptados.

## 2026-08-06 — Orden de construcción: frontend primero
- **Decisión:** se construye primero **todo el frontend** (contra una capa de
  datos *mock* tipada), y después el **backend + base de datos** (Supabase).
- **Salvaguarda:** el **ERD del Incidente se diseña temprano "en papel"** como
  contrato del modelo, antes de programar el frontend, para que los mocks
  respeten el modelo real y se evite retrabajo. Migraciones/RLS van después.
- **Cómo:** el frontend consume una **interfaz de servicio de datos**; al inicio
  la implementa un mock, luego Supabase — el cambio queda contenido.
- **Razón:** el usuario quiere ver y validar la experiencia primero; con Supabase
  el "backend" es delgado, así que frontend-first con mocks es viable.

## 2026-08-06 — IA (RF-18) al final
- **Decisión:** la IA de apoyo se implementa **al final de todo**, tras el núcleo
  y el resto de mejoras.
- **Nota:** "buscar/traer información" (RF-20, recuperación de fuentes) NO
  requiere IA; la IA solo resume/redacta lo encontrado.

## 2026-08-06 — Dos niveles de alerta por incidente
- **Decisión:** cada incidente registra la alerta de **SENAPRED** (Sin alerta /
  Temprana Preventiva / Amarilla / Roja) y la alerta **interna de Cruz Roja**
  (Verde / Amarilla / Roja), en campos separados.
- **Razón:** son escalas distintas; el usuario necesita ambas.

## 2026-08-06 — Rol Coordinador y aprobación del BIE
- **Decisión:** se agrega el rol **Coordinador**, que aprueba el BIE (flujo
  borrador → aprobado → exportado). Se implementa aunque quizá no se use al inicio.
- **Razón:** pedido del usuario; deja lista la trazabilidad de aprobación.

## 2026-08-06 — Ingesta: webs oficiales sí, redes por captura humana
- **Decisión:** en alcance el **monitoreo de sitios web oficiales del Estado**
  (web/RSS/datos abiertos, respetando robots.txt). El **scraping de redes
  sociales** queda descartado (ToS + fragilidad); las redes se cubren con
  **captura humana**. La **ingesta automática de correos** pasa a **Etapa 2**.
- **Razón:** el contenido oficial es público, pero el scraping de redes viola los
  Términos de Servicio de las plataformas y es frágil; las webs oficiales son
  legales y estables.

## 2026-08-06 — IA de apoyo adelantada a Etapa 1
- **Decisión:** la **IA de resumen, detección de duplicados y borrador de
  redacción** del BIE se prioriza como **Importante (Etapa 1)**, siempre con
  **validación humana** y sin publicar ni inventar hechos. Se construye después
  del núcleo del MVP.
- **Nota:** requiere un LLM (costo por uso o modelo local) — a evaluar en Fase 2/14.

## 2026-08-06 — Plantilla de BIE adaptable
- **Decisión:** el BIE se genera desde una **plantilla `.docx` con marcadores**;
  se puede **cargar una plantilla nueva** y el sistema mapea los campos. Para
  plantillas sin marcar, **mapeo asistido por IA** con revisión humana.
- **Razón:** el formato del BIE puede cambiar en el futuro; así no se toca el código.

## 2026-08-06 — Multiplataforma y edición compartida
- **Decisión:** al ser **PWA web** corre en **Windows, macOS y Linux** sin
  instaladores. Datos **compartidos en la nube (Supabase)**: todos editan los
  mismos incidentes. La **co-edición simultánea en vivo (estilo Google Docs)**
  queda como mejora futura; el MVP usa datos compartidos + aviso de edición
  concurrente. El modo offline es **resiliencia de un operador** (borrador local
  + cola de sync), no co-edición sin conexión.
- **Razón:** combinar offline total con co-edición en tiempo real es complejo
  (conflictos); se prioriza lo simple y robusto.

## 2026-08-06 — Nombre de trabajo del proyecto
- **Contexto:** se necesita un nombre para la carpeta y los documentos.
- **Decisión:** "SoleilTech Sentinel" (carpeta `Sentinel/`), **provisional**.
- **Razón:** encaja con la familia de productos de SoleilTech (LumenStock,
  SoleilInspect). La marca definitiva se decide en la Fase 3.

## 2026-08-06 — Alcance: MVP acotado
- **Contexto:** la conversación previa tendía a inflar el alcance a una
  plataforma nacional con documento de 250–400 páginas.
- **Decisión:** construir un MVP acotado; modelar el dominio para escalar pero
  entregar pequeño y con valor inmediato (reducir el tiempo del BIE).
- **Razón:** hay un usuario principal y un dolor concreto; un MVP usable esta
  temporada vale más que una arquitectura perfecta inexistente.
- **Alternativas descartadas:** documento de ingeniería completo primero
  (se puede retomar más adelante si se postula a fondos).

## 2026-08-06 — BIE = uno por evento
- **Contexto:** definir la relación central del modelo de datos.
- **Decisión:** cada BIE cubre un solo evento/emergencia; un **Incidente**
  genera **N versiones de BIE** en el tiempo (relación 1:N).
- **Razón:** así funciona la práctica de Cruz Roja (confirmado por el usuario).

## 2026-08-06 — Usuarios del MVP: equipo pequeño (2–6)
- **Decisión:** multiusuario con datos compartidos en la nube y roles básicos
  (admin / operador / consulta) desde el inicio.
- **Razón:** la Sala de Crisis la operan varios voluntarios; el costo extra de
  auth + roles es bajo con Supabase.

## 2026-08-06 — Ingesta del MVP: manual
- **Decisión:** en el MVP la información entra por reenvío/pego + captura de
  evidencia con un clic. La ingesta automática por correo queda como deseable.
- **Razón:** cero integraciones externas en el núcleo (regla de oro: externas
  al final); más simple y robusto para arrancar.

## 2026-08-06 — Sin scraping de redes sociales
- **Decisión:** no automatizar la extracción de posts de Facebook/Instagram/X.
- **Razón:** viola los Términos de Servicio de las plataformas y arriesga
  derechos de autor de imágenes; la captura humana es legal y más robusta.
- **Alternativas descartadas:** APIs de pago (X) o scraping (frágil e ilegal).

## 2026-08-06 — Stack tentativo: PWA Quasar + Supabase
- **Contexto:** el usuario trabaja con Vue/Quasar.
- **Decisión (tentativa, se formaliza en Fase 2/G2):** PWA con Quasar (Vue),
  offline-first; nube Supabase (Postgres + Auth + Storage + RLS).
- **Razón:** aprovecha lo que el usuario ya domina; Supabase entrega seguridad,
  roles y respaldo con costo cero en el tier gratuito.
