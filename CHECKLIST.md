# CHECKLIST — SoleilTech Sentinel

> Fuente única de verdad del avance. Se actualiza al completar cada tarea.
> Metodología: Checklist Maestro SDLC (19 fases), **modo MVP acotado**.

- **Proyecto:** SoleilTech Sentinel
- **Descripción:** app de apoyo al monitoreo situacional regional y generación del
  BIE para Cruz Roja Chilena — Región de Valparaíso.
- **Stack:** PWA Quasar (Vue 3 + TS) + **backend Hono sobre Turso** (SQLite/libSQL,
  Drizzle) + R2 (archivos); Dexie offline; docxtemplater; ECharts. Detalle en docs/02-STACK.md.
- **Inicio:** 2026-08-06 · **Última actualización:** 2026-08-12
- **Fase actual:** 12 — Frontend (en curso, contra mocks) · **11 backend esqueleto listo** (BD Turso al final)

Estados: ☐ pendiente · 🔄 en desarrollo · ✅ terminado · ➖ no aplica

---

## ▶ PARA RETOMAR

**Hecho (al 2026-08-14):**
- Fases 1–4 + ERD + mockups (🚦G1·G2·G3).
- **Frontend** en `app/` (Vite 8 + Vue 3 + TS + Quasar + PWA): **14 pantallas** contra
  `DataService` (mock), login+guard, mapa Leaflet real, generar BIE + vista previa.
  Mejoras: **control A−/A+** de letra (persistente); **validación** en Nuevo incidente,
  Generar BIE, Login y diálogos; **captura de evidencia** con procedencia; **a11y**
  (foco visible + aria-labels/roles); catálogos por pestaña; **BIE autollenado desde el
  incidente** (`getBieDraft`); skeleton/errores. Build limpio.
  Dev: `cd app && npm run dev`.
- **Backend** en `server/` (Hono + Drizzle) **corriendo sobre SQLite local** (`file:local.db`,
  sin cuenta Turso): 14 tablas; `db:setup` = migración + seeders (38 comunas, 10 tipos, 15 fuentes,
  4 usuarios por rol); **login (scrypt + JWT)** y **gestión de usuarios por rol** (401/403). `tsc` limpio.
  Setup: `cd server && npm run db:setup && npm run dev`. **Turso se conecta al final** (2 variables).
  Usuarios sembrados (clave `centinela1234`): njerez=admin · imanni=coordinator · operador · consulta.
- **Frontend ↔ backend conectados (login + Usuarios):** `src/services/api.ts` (JWT en localStorage),
  `session` real, LoginPage y **Usuarios** contra el API (listar/crear/editar rol/activar); **menú con
  gating por rol** (Usuarios solo admin) + 403 del backend. Verificado en navegador. Dashboard/
  incidentes/BIE **siguen en mock** (próximo wire).

**Identidad (provisional, pendiente evaluación final):** **Centinela** + mark torre con faro.

### ✔ Hecho (2026-08-12)
1. **Validaciones** — Nuevo incidente, **Generar BIE**, Login y diálogos (Evidencia/Catálogos/Usuarios).
2. **Accesibilidad — auditada con axe-core: 0 violaciones WCAG AA** en todas las pantallas
   (contraste, `<h1>` + timeline semántico, landmarks, labels de diálogos/campos, foco visible, tablas navegables).
3. **Captura de evidencia con procedencia** — diálogo validado en la ficha (tipo · fuente · fecha · archivo/enlace).
4. **Calce con el mockup** — Catálogos con datos por pestaña; feedback (`Notify`) en botones antes inertes.
5. **BIE autollenado desde el incidente** (`getBieDraft`, mock).

### ▶ Pendiente (orden sugerido)
6. **(Cuando autorices) F6/F7:** repo privado en GitHub + README inicial.
7. **Etapa final — Base de datos:** crear BD **Turso**, migración, **seeders** (comunas de
   Valparaíso, tipos de evento, fuentes oficiales, filiales) y conectar el **ApiDataService**
   (reemplazar el mock) + auth real.
8. **RF-18 (IA de apoyo)** — al final del todo.
9. *(opcional)* prueba manual con lector de pantalla (NVDA/VoiceOver) — lo automatizado ya está limpio.

**Ruta prevista:** F6/F7 GitHub+README → crear BD Turso + migrar + seeders
→ conectar rutas + auth → F13 integración → **RF-18 IA**.

---

## Estado de fases

| # | Fase | Estado | Fecha / nota |
|---|---|---|---|
| 1 | Levantamiento de requerimientos | ✅ | 2026-08-06 |
| 2 | Definición tecnológica | ✅ | 2026-08-06 |
| 3 | Diseño visual (design system) | ✅ | 2026-08-06 |
| 4 | Arquitectura del proyecto | ✅ | 2026-08-06 |
| 5 | Crear el proyecto local | ✅ | 2026-08-11 · Vite+Quasar+PWA en app/, git init + 1er commit |
| 6 | Repositorio privado en GitHub | ☐ | |
| 7 | Documentación inicial | ☐ | |
| 8 | Checklist general | 🔄 | creado temprano como punto de retomo |
| 9 | Diseño UX/UI (mockups) | ✅ | 2026-08-11 · 14 pantallas en mockups/index.html |
| 10 | Diseño de base de datos | ✅ | ERD (docs/05) + **schema Drizzle** (14 tablas) + migración SQL generada |
| 11 | Desarrollo backend | 🔄 | **BD local + auth + usuarios por rol** OK (curl); faltan incidentes/BIE/evidencias/R2 |
| 12 | Desarrollo frontend | 🔄 | **14 pantallas** contra mocks; faltan validaciones, captura de evidencia y a11y |
| 13 | Integración | ☐ | |
| 14 | Integraciones externas | ☐ | RF-20 fuentes; RF-18 IA al final |
| 15 | Pruebas | ☐ | |
| 16 | Optimización | ☐ | |
| 17 | Preparación para producción | ☐ | |
| 18 | Despliegue | ☐ | |
| 19 | Mantenimiento | ☐ | |

### Adaptaciones (modo MVP acotado)
- **Frontend primero:** F12 se construye antes que F10–11, contra una capa de
  datos *mock* tipada detrás de una interfaz de servicio (el cambio a Supabase
  queda contenido).
- **Salvaguarda:** el ERD del Incidente se diseña "en papel" temprano como
  contrato, para que los mocks respeten el modelo real.
- **Checklist temprano:** F8 se adelantó para servir de punto de retomo.
- **IA (RF-18) al final.** Ingesta automática de correos = Etapa 2.

### Puertas de control
- [x] **G1** Requerimientos y alcance confirmados (2026-08-06)
- [x] **G2** Stack aprobado (2026-08-06)
- [x] **G3** Mockups + modelo de datos aprobados (2026-08-11)
- [ ] **G4** Núcleo estable — autorizadas integraciones externas
- [ ] **G5** Autorizado el despliegue a producción

---

## Frontend (MVP núcleo — RF-01..14)

- [x] Componentes base (AlertBadge, BrandMark; más por venir)
- [x] Layout general + navegación / menú (app shell grafito)
- [x] Control de tamaño de letra (A−/A+) en el topbar, con persistencia (localStorage)
- [x] Login + guard de sesión — **real contra el backend (JWT + scrypt)**, sesión persistente; el admin fija/resetea la clave
- [x] Dashboard (activos / por alerta / por comuna) — vía DataService
- [x] Lista de incidentes + Nuevo incidente (formulario)
- [x] Ficha de incidente (doble alerta + comunas + cronología + evidencias + fuentes)
- [x] Generar BIE + vista previa — **autollenado desde el incidente** (`getBieDraft`, mock)
- [x] Historial de versiones de BIE (UI) + Expediente del evento
- [x] Mapa Leaflet real (comunas + zonas estimadas + ampliar/reducir) [RF-28a]
- [x] Cámaras en vivo (UI) · Estadísticas · Catálogos · Usuarios · Estados UI
- [x] Estados de carga / error / vacío
- [x] Responsive (Quasar grid)
- [x] Ingesta manual con procedencia (captura de evidencia) — diálogo validado (tipo · fuente · fecha · archivo/enlace)
- [x] Validaciones de formularios — Nuevo incidente, Generar BIE, Login y diálogos (Evidencia/Catálogos/Usuarios)
- [x] Accesibilidad (WCAG AA) — **auditoría axe-core: 0 violaciones AA** (contraste, headings, landmarks, labels, foco, tablas); pendiente prueba manual con lector de pantalla
- ➖ Tema oscuro (N/A — solo claro)

### Frontend — Importante (Etapa 1.x)
- [ ] Búsqueda y filtros avanzados (RF-15)
- [ ] Gestión de catálogos: comunas, tipos, fuentes (RF-17)
- [ ] Expediente del evento (RF-23)
- [ ] Panel de salud de fuentes + modo degradado (RF-21)
- [ ] Estadísticas / histórico (RF-22)
- [ ] Mapa coropleta por comuna (colores + leyenda, descargable PNG/PDF, exportable al BIE) (RF-28a)

## Backend (tras el frontend — Hono + Turso)

> **Esqueleto listo (2026-08-12):** `server/` con Hono, schema Drizzle (14 tablas),
> migración SQL generada y rutas *stub*. Compila (`tsc`) y levanta. La lógica real
> (queries, auth, R2) se conecta cuando se cree la BD Turso — última etapa.
> **Endurecido (mejora 2026-08-12):** validación de entrada zod (400 con detalle),
> manejo de errores + 404 JSON, logger + secure-headers, env validado, API bajo `/api`.
> **BD + auth EN LOCAL (2026-08-14):** corre sobre **SQLite local** (`file:local.db`, sin cuenta
> Turso); `db:setup` = migración + seeders; **login (scrypt + JWT)** y **gestión de usuarios por
> rol** (401/403) funcionando (probado con curl). Turso se conecta al final (2 variables, sin tocar código).

- [x] Backend API (Hono) + cliente **SQLite local** (Drizzle) — R2 en etapa posterior
- [x] Autenticación (login) — **JWT + scrypt** en el backend (recuperación: el admin fija la clave)
- [x] Autorización por rol admin/coordinador/operador/consulta — en el backend (401/403 por endpoint)
- [ ] Incidentes (CRUD)
- [ ] Comunas afectadas (relación)
- [ ] Fuentes + procedencia (fuente + URL + timestamp)
- [ ] Evidencias (Storage)
- [ ] Cronología (append-only)
- [ ] BIE + versiones
- [x] Bitácora / auditoría (append-only) — login + altas/cambios de usuario (faltan incidentes/BIE)
- [ ] Reemplazar el mock por el cliente api — **login + Usuarios ya conectados** (`api.ts` + `session` real); faltan dashboard/incidentes/BIE
- [ ] Generación del .docx (docxtemplater) desde el incidente

## Base de datos

- [x] ERD "en papel" del Incidente (docs/05-BASE-DE-DATOS.md) — temprano
- [x] Tablas con tipos, PK/FK y restricciones — **schema Drizzle** (`server/src/db/schema.ts`)
- [x] Relaciones (incidente↔comunas N-M, incidente↔fuentes, incidente↔evidencias, incidente↔BIE 1-N)
- [x] Índices para búsquedas (comuna, tipo, estado, fecha)
- [x] Migraciones — corren de cero sin errores (`db:setup` sobre SQLite local; Turso usa las mismas)
- [x] Seeders: **38 comunas** de Valparaíso, 10 tipos de evento, 15 fuentes oficiales, 4 usuarios por rol
- [x] Autorización por rol en el backend (SQLite no tiene RLS) — verificada (401/403)
- [ ] Normalización revisada (3FN)

## Seguridad

- [x] Contraseñas con hash (**scrypt**, nativo de Node; sin auto-registro)
- [x] Sesiones/JWT configurados (expiración 8h) — *refresh token pendiente*
- [ ] Roles y permisos verificados por RLS (servidor) en cada tabla
- [ ] Protección SQL Injection (cliente parametrizado, sin SQL concatenado)
- [ ] Protección XSS (escape de contenido de usuario)
- [ ] Un usuario no accede a datos fuera de su rol cambiando IDs (IDOR/RLS)
- [ ] Minimización de datos personales + política de retención (Ley 19.628/21.719)
- [ ] Auditoría de acciones críticas (append-only)
- [ ] Secretos solo en variables de entorno (nunca en el repo)

## Infraestructura

- [ ] Variables de entorno (.env + .env.example documentado)
- [ ] Backups de la BD + **restauración probada**
- [ ] Monitoreo de errores y uptime + alertas
- [ ] SSL / HTTPS (lo da el hosting estático)
- [ ] Dominio configurado (opcional)

## Calidad

- [ ] Pruebas unitarias (lógica crítica) — Vitest
- [ ] Pruebas de integración / e2e (flujos imprescindibles) — Playwright
- [ ] Pruebas manuales documentadas
- [ ] Pruebas de seguridad (XSS, IDOR/RLS, rate limit)
- [ ] Linter (ESLint 9) y formateador (Prettier) sin errores

## Documentación

- [x] docs/01-REQUERIMIENTOS.md
- [x] docs/02-STACK.md
- [x] docs/03-DISENO.md
- [x] docs/04-ARQUITECTURA.md
- [x] docs/05-BASE-DE-DATOS.md
- [x] docs/DECISIONES.md al día
- [x] docs/MEJORAS-SKILL.md (log de mejoras a la skill crear-proyecto)
- [ ] README completo
- [ ] CHANGELOG.md (desde el primer release)

---

## Mantenimiento (vivo desde el lanzamiento)

### Errores encontrados
| Fecha | Descripción | Gravedad | Estado |
|---|---|---|---|
| | | | |

### Mejoras futuras / nuevas funcionalidades
| Prioridad | Descripción | Estado |
|---|---|---|
| Deseable | Etapa 2+: correo automático, mapa avanzado (capas), dashboards avanzados, co-edición en vivo, multi-región, recursos | Backlog |

### Historial de versiones
| Versión | Fecha | Cambios principales |
|---|---|---|
| 0.1 (docs) | 2026-08-06 | Requerimientos + stack aprobados (G1, G2) |
