# Stack tecnológico — Centinela (SoleilTech)

Actualizado el **2026-08-06** — cambio de backend. Aprobado (Puerta G2).

**Cambio respecto a v1:** se reemplaza **Supabase** por **Turso + un backend
mínimo**. Motivo: Supabase limita los proyectos gratis (2) y cobra por base
adicional; **Turso** permite **muchas bases aisladas por proyecto** a costo ~0.
El **frontend no cambia** (la capa `DataService` lo aísla).

## Stack recomendado

| Capa | Elección | Versión | Por qué |
|---|---|---|---|
| Lenguaje | TypeScript | 5.6.x | tipos en front y back |
| Frontend | Quasar (Vue 3), modo PWA | 2.17.x | lo que ya sabes; un código → PWA/Electron/Capacitor |
| Estado | Pinia | 2.2.x | store oficial de Vue |
| Offline | Dexie (IndexedDB) | 4.x | caché + *outbox* → sincroniza al backend |
| **Backend API** | **Hono** (TypeScript) | 4.x | ultraligero; corre en Cloudflare Workers/Node; hace auth + authz + archivos |
| **Base de datos** | **Turso** (libSQL/SQLite) | — | muchas DBs **aisladas por proyecto**, free tier amplio |
| ORM / migraciones | Drizzle ORM + drizzle-kit | 0.3x | type-safe, libSQL nativo, migraciones |
| Cliente DB | @libsql/client | 0.x | acceso a Turso desde el backend |
| Auth | Better Auth (o JWT + argon2) | — | sesiones + roles; se fija al construir el backend |
| Almacenamiento | Cloudflare R2 (S3-compat) | — | evidencias; URLs firmadas vía backend; free tier |
| DOCX del BIE | docxtemplater (+ PizZip) | 3.50.x | plantilla con marcadores (RF-19) |
| Gráficos | ECharts (vue-echarts) | 5.x | dashboard |
| Mapa | Leaflet/MapLibre + GeoJSON comunas | — | mapa coropleta (RF-28a) |
| IA (RF-18) | Anthropic Claude API | — | detrás de una **ruta del backend** (clave server-side) |
| Hosting frontend | Cloudflare Pages / Netlify | — | estático, free, HTTPS |
| Hosting backend | Cloudflare Workers (o host Node) | — | serverless free; se fija al construir |
| Testing | Vitest + Playwright | 2.x / 1.x | unit + e2e |

> Versiones = referencia; confirmar la última estable al hacer el scaffold.

## Servicios externos y costos

| Servicio | Para qué | Costo |
|---|---|---|
| Turso | Base de datos (aislada por proyecto) | Free tier amplio ($0) |
| Cloudflare Workers | Backend API | Free tier ($0) |
| Cloudflare R2 | Archivos de evidencia | Free tier ($0, ~10 GB) |
| Cloudflare Pages / Netlify | Hosting del PWA | Free ($0) |
| Anthropic Claude API | IA (RF-18, etapa final) | Pago por uso |
| Dominio propio (opcional) | URL propia | ~US$12/año |

**Costo del MVP: ~US$0** (todo en planes gratuitos).

## Matices

- **El frontend no cambió:** gracias a la interfaz `DataService`, solo cambia la
  implementación de datos (ahora un cliente HTTP a nuestro backend). "Frontend
  primero contra mocks" sigue intacto.
- **Seguridad:** SQLite/Turso **no tiene RLS** → la autorización se aplica en el
  **backend** (por rol y por registro). El navegador nunca ve el token de Turso.
- **El ERD casi no cambia:** SQLite relacional; ajustes de dialecto (UUID→TEXT,
  `PRAGMA foreign_keys=ON`, funciones JSON en vez de JSONB).
- **Auth y host del backend se fijan al construirlo (Fase 11):** en Cloudflare
  Workers el hashing usa cripto compatible con Workers; en un host Node, argon2
  nativo.

## Alternativas descartadas

- **Supabase:** gran BaaS, pero **cobra por proyecto** más allá de 2 gratis → no
  encaja con varios proyectos (fue el motivo del cambio).
- **PocketBase:** SQLite todo-incluido y aislado (buen candidato), pero requiere
  un host **siempre encendido**; se prefirió Turso + Workers (serverless, sin
  servidor que administrar).
- **Firebase:** NoSQL; el dominio es claramente relacional.

## Confirmación

Aprobado por Nicolás el **2026-08-06** (Puerta G2 — backend Turso). Defaults:
TypeScript, pnpm.
