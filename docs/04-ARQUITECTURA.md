# Arquitectura — Centinela (SoleilTech)

> PWA Quasar (Vue 3 + TS) + **backend mínimo (Hono) sobre Turso**. Estructura
> oficial de Quasar por *features*, con la **capa de datos tras una interfaz**
> (mock → API) → "frontend primero" sin tocar pantallas al cambiar el origen de
> datos.

## 1. Patrón

- **Feature-first** sobre `src/` de Quasar (no se inventa estructura propia).
- **Capa de datos tras `DataService`:** las pantallas/stores hablan con una
  interfaz, no con la red. Implementaciones: **mock en memoria** (etapa frontend)
  y **`api`** (cliente HTTP a nuestro backend). Un factory elige por
  `VITE_DATA_SOURCE`. Cambiar de mock a backend = cambiar la implementación, no
  las pantallas.
- **Backend propio (separado):** API en **Hono** que habla con **Turso** (vía
  Drizzle) y aplica **auth + autorización**. El navegador **nunca** toca Turso
  directo (expondría el token).
- **Estado con Pinia**; **offline** con *outbox* Dexie que sincroniza al backend.

## 2. Estructura de carpetas

```
sentinel/
├── src/                        # ← Frontend (Quasar PWA)
│   ├── assets/ · boot/ · components/ui/ · composables/ · css/
│   ├── features/               # auth, incidents, evidence, timeline, bie,
│   │                           #   dashboard, map, catalogs
│   ├── layouts/ · pages/ · router/ · stores/ · types/
│   └── services/
│       └── data/
│           ├── DataService.ts  # la interfaz (contrato)
│           ├── index.ts        # factory: mock | api
│           ├── mock/           # implementación en memoria (etapa frontend)
│           └── api/            # cliente HTTP a nuestro backend (etapa backend)
├── src-pwa/                    # service worker + manifest (modo PWA)
├── server/                     # ← Backend (etapa backend)
│   ├── src/
│   │   ├── routes/             # endpoints: incidents, evidence, bie, auth…
│   │   ├── db/                 # schema Drizzle + migraciones + cliente libSQL
│   │   ├── auth/               # sesiones/JWT, roles
│   │   ├── storage/            # R2 (URLs firmadas)
│   │   └── middleware/         # auth, authz por rol, validación, errores
│   └── drizzle.config.ts
├── test/ · test-e2e/
├── .env / .env.example
├── quasar.config.ts
└── package.json
```

## 3. Flujo de datos

```
Página (route) → Store Pinia → DataService (interfaz)
                                 ├── mock en memoria            (etapa frontend)
                                 └── api (HTTP) → Backend Hono → Drizzle → Turso
                                                  (auth + authz por rol/registro)
```

El navegador solo llama a **nuestro backend** (con sesión/JWT). El backend guarda
el token de Turso y las claves de R2/LLM. La UI es reactiva desde el store; ninguna
página importa el cliente de datos directamente.

## 4. Convenciones de nombres

| Elemento | Convención | Ejemplo |
|---|---|---|
| Componentes Vue | PascalCase | `IncidentCard.vue`, `AlertBadge.vue` |
| Páginas | PascalCase + `Page` | `IncidentDetailPage.vue` |
| Composables | camelCase con `use` | `useAlertColor.ts` |
| Stores Pinia | `use<Feature>Store` | `useIncidentsStore` |
| Endpoints (backend) | kebab-case | `POST /incidents`, `GET /incidents/:id` |
| Tipos de dominio | PascalCase | `Incident`, `EvidenceItem`, `BieVersion` |
| Tablas (Turso/SQLite) | snake_case plural | `incidents`, `incident_comunas`, `bie_versions` |
| Columnas | snake_case | `alert_senapred`, `created_at` |

Código e identificadores en inglés; interfaz y documentos en español.

## 5. Variables de entorno

**Frontend** (prefijo `VITE_`, expuestas al cliente):

| Variable | Descripción |
|---|---|
| `VITE_DATA_SOURCE` | `mock` o `api` |
| `VITE_API_URL` | URL base del backend |

**Backend** (server-side, **nunca** al cliente):

| Variable | Descripción |
|---|---|
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | conexión a Turso |
| `AUTH_SECRET` | firma de sesiones/JWT |
| `R2_*` | bucket y claves de Cloudflare R2 |
| `ANTHROPIC_API_KEY` | IA (RF-18) |

`.env` no se commitea; `.env.example` sí, documentado y sin valores reales.

## 6. ¿Dónde pongo X?

| Necesito… | Va en… |
|---|---|
| Una pantalla nueva | `src/pages/` + su feature en `src/features/<x>/` |
| Un componente reutilizable | `src/components/ui/` |
| Acceso a datos (front) | `src/services/data/` (método en la interfaz + mock + api) |
| Un tipo de dominio | `src/types/` |
| Un endpoint | `server/src/routes/` |
| Esquema / migración / seed | `server/src/db/` (Drizzle) |
| Auth / autorización | `server/src/auth/` + `server/src/middleware/` |
| Init de librería (dayjs…) | `src/boot/` |

## 7. Ramas y commits

- `main` (estable) · `develop` (integración) · `feature/<nombre>` · `fix/<nombre>`.
- Conventional commits en inglés: `feat(incidents): add detail endpoint`,
  `docs: switch backend to turso`.

## 8. Seguridad — defensa en profundidad

Principio: **la autorización se aplica en el backend (servidor), no en el
cliente.** Los chequeos de rol en la UI son solo experiencia; el gate real está
en el backend.

- **Autorización en el backend:** valida rol (admin/coordinador/operador/consulta)
  **y pertenencia por registro** en cada endpoint. El navegador nunca tiene
  credenciales de Turso.
- **Autenticación:** sesiones/JWT con contraseñas **hasheadas** (argon2/scrypt);
  **MFA recomendado** para admin y coordinador.
- **Bitácora append-only:** el backend solo permite **crear** registros de
  auditoría; no expone update/delete → registro a prueba de alteración.
- **Secretos server-side:** token de Turso, claves de R2 y la **API del LLM viven
  en el backend** — nunca en el bundle del frontend.
- **Almacenamiento:** buckets **privados** en R2; descargas por **URL firmada**
  temporal.
- **Validación doble:** cliente (UX) y **servidor** (constraints + reglas en el
  backend). No se confía en el cliente. Se **sanitiza** el texto pegado (XSS).
- **Transporte:** HTTPS; **CORS** restringido al dominio del frontend; cabeceras
  de seguridad / CSP.
- **Datos personales (Ley 19.628 / 21.719):** minimización + política de retención.
- **Ojo con offline:** la caché (Dexie/IndexedDB) guarda datos **en el
  dispositivo** sin cifrar → cachear lo mínimo sensible y **limpiar al cerrar
  sesión**.
- **Dependencias:** versiones fijadas + `npm audit` periódico.

## 9. Claridad y entendimiento

- **Una sola dirección de dependencias:** UI → store → `DataService` → (mock | api).
- **Feature-first** + tabla "¿dónde pongo X?" (§6) → todo se encuentra rápido.
- **Frontend y backend separados** pero con **tipos de dominio compartidos** →
  contrato claro entre ambos.
- **TypeScript como documentación viva**; convenciones únicas; **docs vivos**
  (`docs/` + `CHECKLIST.md`) para retomar sin contexto previo.
