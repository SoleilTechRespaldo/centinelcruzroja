# Centinela

Herramienta de **apoyo** al monitoreo situacional regional y a la generación del **BIE**
(Boletín de Información de Emergencia / «Monitoreo Regional») para la **Cruz Roja Chilena,
Región de Valparaíso**. Desarrollada por **SoleilTech**.

> **Es una herramienta de apoyo, no un sistema oficial.** Mantiene a una persona en el
> centro de la decisión (_human-in-the-loop_): **no emite alertas**, no reemplaza los
> canales oficiales (SENAPRED, DMC, SHOA, etc.) ni la cadena de mando de Cruz Roja.
> Reúne información de fuentes oficiales, la ordena y ayuda a **redactar el BIE** que una
> persona revisa, aprueba y firma.

---

## Qué hace

- **Incidentes**: registrar, editar y cerrar eventos; cronología de hitos; fuentes con
  procedencia; captura de evidencia; historial de reportes de situación (append-only).
- **BIE**: autollenado desde el incidente y **generación del documento oficial** rellenando
  el maestro `BIE FORMATO.docx` (conserva logos y formato). Exporta **.docx** siempre y
  **PDF** si el servidor tiene conversor. Versionado y **aprobación** por coordinador/admin.
- **Usuarios y roles**: el administrador invita usuarios (no hay auto-registro), cambia
  roles, activa/desactiva y **restablece contraseñas**.
- **Catálogos**: comunas, tipos de evento y fuentes oficiales, administrables.
- **Dashboard**, mapa por comuna y panel de estados; PWA con accesibilidad AA.

## Arquitectura

Monorepo con dos paquetes independientes:

| Carpeta   | Qué es | Stack |
|-----------|--------|-------|
| [`app/`](app)       | Frontend PWA | Vue 3 + TypeScript + Quasar + Vite + vite-plugin-pwa |
| [`server/`](server) | API | Hono + Drizzle ORM + libSQL (SQLite/Turso) |

El frontend habla con el backend a través de una interfaz `DataService`
(`ApiDataService` real / `MockDataService` para trabajar sin servidor). La autorización
vive **en el backend** (SQLite no tiene RLS): JWT (HS256) + contraseñas con **scrypt**.

Documentación de diseño y decisiones en [`docs/`](docs) y el estado vivo del proyecto en
[`CHECKLIST.md`](CHECKLIST.md).

## Requisitos

- **Node.js 20.19+ o 22 LTS** (Vite 8). npm 10+.
- Para exportar el BIE a **PDF**: **LibreOffice** (`soffice` en el PATH, cualquier SO) o
  **Microsoft Word** (Windows). Sin ninguno, el BIE se descarga en `.docx` y se convierte
  a mano.

## Puesta en marcha

### 1) Backend (`server/`)

```bash
cd server
npm install
cp .env.example .env       # opcional en dev: hay valores por defecto
npm run db:setup           # migra + siembra la BD local (SQLite file:local.db)
npm run dev                # API en http://localhost:8787
```

El seeder crea 4 usuarios (clave inicial `centinela1234`):

| Correo | Rol |
|--------|-----|
| `njerez@cruzroja.cl`   | admin |
| `imanni@cruzroja.cl`   | coordinator |
| `operador@cruzroja.cl` | operator |
| `consulta@cruzroja.cl` | consulta |

### 2) Frontend (`app/`)

```bash
cd app
npm install
npm run dev                # http://localhost:5173
```

Por defecto el frontend usa el **backend real**. Para trabajar sin servidor (datos de
ejemplo), crea `app/.env` con `VITE_DATA_SOURCE=mock`.

## Variables de entorno

**Backend** (`server/.env`; todos tienen valor por defecto para desarrollo):

| Variable | Por defecto | Notas |
|----------|-------------|-------|
| `PORT` | `8787` | Puerto del API |
| `CORS_ORIGIN` | `*` | Origen del frontend en producción |
| `TURSO_DATABASE_URL` | `file:local.db` | SQLite local en dev; **Turso** en prod (`libsql://…`) |
| `TURSO_AUTH_TOKEN` | — | Solo con Turso |
| `AUTH_SECRET` | `dev-secret-…` | **Define uno propio y largo en producción** |
| `SEED_ADMIN_PASSWORD` | `centinela1234` | Clave inicial que usa el seeder |

**Frontend** (`app/.env`):

| Variable | Por defecto | Notas |
|----------|-------------|-------|
| `VITE_DATA_SOURCE` | `api` | `mock` para usar datos de ejemplo sin backend |
| `VITE_API_URL` | `http://localhost:8787` | URL del backend |

## Scripts (raíz)

Herramientas compartidas para todo el monorepo:

```bash
npm run format         # Prettier (escribe)
npm run lint           # ESLint (app + server)
npm run typecheck      # tsc del backend
npm test               # Vitest del backend
npm run check          # format:check + lint + typecheck + test
```

## El BIE en detalle

El documento se arma rellenando el **maestro oficial** `server/assets/BIE FORMATO.docx`:
por cada etiqueta de las tablas se escribe el valor a su derecha, la **Descripción** usa
los 16 títulos uniformes y se agrega el bloque «Acciones de Cruz Roja Chilena». Así el
resultado conserva exactamente los logos y el formato del BIE real.

- **`.docx`**: siempre disponible (Node + `pizzip`/`@xmldom/xmldom`, sin dependencias de
  Office).
- **PDF**: se rellena el `.docx` y se convierte con **LibreOffice** (headless, perfil
  aislado) o, si no está, con **Word COM** en Windows. Sin conversor, el API responde
  `503 pdf_no_disponible` y la app sugiere descargar el `.docx`.

Las reglas de llenado (nunca inventar datos; cada cifra con fuente y hora; privacidad)
provienen de la _skill_ `monitoreo-bie-valparaiso` y están descritas en [`docs/`](docs).

## Roles

| Rol | Puede |
|-----|-------|
| **consulta** | leer (dashboard, incidentes, BIE) |
| **operator** | + crear/editar incidentes, evidencia, reportes, guardar borradores del BIE |
| **coordinator** | + **aprobar** versiones del BIE |
| **admin** | + gestionar usuarios (invitar, roles, restablecer contraseñas) y catálogos |

## Pruebas

Pruebas de integración del API con **Vitest** sobre una BD SQLite **en memoria** (no toca
`local.db`): autenticación, permisos por rol, incidentes y versionado/aprobación del BIE.

```bash
cd server && npm test
```

## Estado y hoja de ruta

**Listo:** MVP núcleo (incidentes CRUD, cronología, fuentes, catálogos, versionado y
aprobación del BIE, recuperación de contraseña), generación del BIE en `.docx` y **PDF**,
pruebas de integración y toolchain de calidad (ESLint/Prettier).

**Pendiente:** base de datos **Turso** para producción · almacenamiento real de evidencias
(**Cloudflare R2**) · IA de apoyo (RF-18) · pruebas E2E del frontend.

## Licencia

Software de **SoleilTech**, licenciado de forma gratuita a la Cruz Roja Chilena para su
uso interno. Los datos son de la Cruz Roja. Se entrega **sin garantía**. La marca propia
no utiliza el emblema de la cruz roja.
