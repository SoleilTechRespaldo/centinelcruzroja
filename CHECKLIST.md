# CHECKLIST — SoleilTech Sentinel

> Fuente única de verdad del avance. Se actualiza al completar cada tarea.
> Metodología: Checklist Maestro SDLC (19 fases), **modo MVP acotado**.

- **Proyecto:** SoleilTech Sentinel
- **Descripción:** app de apoyo al monitoreo situacional regional y generación del
  BIE para Cruz Roja Chilena — Región de Valparaíso.
- **Stack:** PWA Quasar (Vue 3 + TS) + **backend Hono sobre Turso** (SQLite/libSQL,
  Drizzle) + R2 (archivos); Dexie offline; docxtemplater; ECharts. Detalle en docs/02-STACK.md.
- **Inicio:** 2026-08-06 · **Última actualización:** 2026-08-06
- **Fase actual:** 12 — Desarrollo frontend (en curso, contra mocks)

Estados: ☐ pendiente · 🔄 en desarrollo · ✅ terminado · ➖ no aplica

---

## ▶ PARA RETOMAR

**Hecho:** Fases 1–4 + ERD + mockups (🚦G1·G2·G3). **Frontend completo** en `app/`
(Vite 8 + Vue 3 + TS + Quasar + PWA): **14 pantallas** navegables contra
`DataService` (mock), con login+guard, mapa Leaflet real, generar BIE + vista previa.
Compila limpio (vue-tsc). Dev: `cd app && npm run dev` (localhost:5173).

**Identidad (provisional, pendiente evaluación final):** **Centinela** + mark torre con faro.

**Próximo paso:** Fase 12 — portar el **resto de pantallas** desde los mockups
(nuevo incidente, ficha, generar BIE, expediente, mapa Leaflet, cámaras, estadísticas,
catálogos, usuarios, estados) + la **capa DataService (mock)**.

**Ruta prevista:** F12 resto de pantallas → F6/F7 GitHub+README (cuando autorices) →
backend Hono/Turso → F13 integración → mejoras → **RF-18 IA al final**.

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
| 10 | Diseño de base de datos | 🔄 | ERD en papel listo (docs/05); migraciones en etapa backend |
| 11 | Desarrollo backend | ☐ | tras el frontend |
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
- [x] Login + guard de sesión (recuperar contraseña: pendiente)
- [x] Dashboard (activos / por alerta / por comuna) — vía DataService
- [x] Lista de incidentes + Nuevo incidente (formulario)
- [x] Ficha de incidente (doble alerta + comunas + cronología + evidencias + fuentes)
- [x] Generar BIE (formulario completo) + vista previa del documento
- [x] Historial de versiones de BIE (UI) + Expediente del evento
- [x] Mapa Leaflet real (comunas + zonas estimadas + ampliar/reducir) [RF-28a]
- [x] Cámaras en vivo (UI) · Estadísticas · Catálogos · Usuarios · Estados UI
- [x] Estados de carga / error / vacío
- [x] Responsive (Quasar grid)
- [ ] Ingesta manual con procedencia (captura de evidencia) — pendiente
- [ ] Validaciones de formularios — pendiente
- [ ] Accesibilidad (WCAG AA, foco, labels, alt) — pendiente
- ➖ Tema oscuro (N/A — solo claro)

### Frontend — Importante (Etapa 1.x)
- [ ] Búsqueda y filtros avanzados (RF-15)
- [ ] Gestión de catálogos: comunas, tipos, fuentes (RF-17)
- [ ] Expediente del evento (RF-23)
- [ ] Panel de salud de fuentes + modo degradado (RF-21)
- [ ] Estadísticas / histórico (RF-22)
- [ ] Mapa coropleta por comuna (colores + leyenda, descargable PNG/PDF, exportable al BIE) (RF-28a)

## Backend (tras el frontend — Hono + Turso)

- [ ] Backend API (Hono) + cliente Turso (Drizzle) + almacenamiento R2
- [ ] Autenticación (login, recuperación) — Better Auth / JWT en el backend
- [ ] Autorización por rol admin/coordinador/operador/consulta — en el backend (por registro)
- [ ] Incidentes (CRUD)
- [ ] Comunas afectadas (relación)
- [ ] Fuentes + procedencia (fuente + URL + timestamp)
- [ ] Evidencias (Storage)
- [ ] Cronología (append-only)
- [ ] BIE + versiones
- [ ] Bitácora / auditoría (append-only)
- [ ] Reemplazar el mock por el cliente api (HTTP al backend), misma interfaz
- [ ] Generación del .docx (docxtemplater) desde el incidente

## Base de datos

- [x] ERD "en papel" del Incidente (docs/05-BASE-DE-DATOS.md) — temprano
- [ ] Tablas con tipos, PK/FK y restricciones
- [ ] Relaciones (incidente↔comunas N-M, incidente↔fuentes, incidente↔evidencias, incidente↔BIE 1-N)
- [ ] Índices para búsquedas (comuna, tipo, estado, fecha)
- [ ] Migraciones (corren de cero sin errores)
- [ ] Seeders: comunas de la Región de Valparaíso, tipos de evento, fuentes oficiales, filiales
- [ ] Autorización por rol en el backend (SQLite no tiene RLS)
- [ ] Normalización revisada (3FN)

## Seguridad

- [ ] Contraseñas con hash (Supabase Auth)
- [ ] Sesiones/JWT configurados (expiración, refresh)
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
