# Handoff — Centinela (SoleilTech · Cruz Roja Valparaíso)

Documento vivo para retomar sin perder contexto. Se actualiza al cerrar cada sesión.
Última actualización: **2026-09-30**.

## Objetivo del proyecto
App de **apoyo** al monitoreo situacional y a la generación del **BIE** para la Cruz
Roja Chilena, Región de Valparaíso. Herramienta de apoyo (no oficial), con la persona
al centro; nunca emite alertas ni publica sola.

## Estado actual (2026-09-30)
- **Etapa 1 (MVP núcleo)** y **Etapa 2 (ingesta automática)** COMPLETAS.
  - Incidentes (CRUD, cronología, fuentes, evidencia con archivo real), BIE
    (autollenado + `.docx` + PDF), usuarios/roles, catálogos.
  - Bandeja de indicios + canales: **correo IMAP**, **webs oficiales (RSS/Atom)**,
    **redes (captura legal + adjunto)**, **mapa operativo por capas**, **IA de apoyo**
    intercambiable (Ollama $0 ↔ API), todos **apagados** hasta configurar el `.env`.
- **Calidad:** 40 pruebas (Vitest) verdes; ESLint/Prettier 0; `npm run check` verde.
- **Seguridad:** auditoría de los 14 defaults hecha (ver `docs/DECISIONES.md`,
  2026-09-30). Corregido: rate limiting, límites de subida + descargas `attachment`,
  errores sin fuga, guarda de AUTH_SECRET/CORS en prod, `npm audit fix`,
  **sesión en cookie HttpOnly** (ya no en localStorage). Verificado en navegador.
- **Repos GitHub:** `SoleilTechRespaldo/Centinela` (respaldo previo) y ahora
  `SoleilTechRespaldo/centinelcruzroja` (remoto `origin`). Cuenta provisoria
  (`nicolasjerez.soleiltech@gmail.com`); a futuro, Organización **SoleilTech** con
  `@soleiltech.cl`.

## Cómo correr (local)
1. `cd server && npm install && npm run db:setup && npm run dev` (API en :8787).
2. `cd app && npm install && npm run dev` (frontend en :5173).
3. Ingreso: `njerez@cruzroja.cl` / `centinela1234` (admin).
- `server/.env` (gitignored) fija `AUTH_SECRET`, `CORS_ORIGIN=http://localhost:5173`,
  `COOKIE_SAMESITE`. Canales/IA se encienden con más variables (ver `server/.env.example`).

## Próximos pasos (producción)
1. Dominio `soleiltech.cl` (nic.cl) → Cloudflare DNS → correo `@soleiltech.cl`.
2. **Turso** (BD) + **Cloudflare R2** (archivos) con las cuentas oficiales.
3. **Hosting Node** del backend (Fly/Koyeb/VPS) + **Dockerfile con LibreOffice** (PDF).
4. Frontend a **Cloudflare Pages**; `VITE_API_URL` al backend; `CORS_ORIGIN` al dominio;
   `AUTH_SECRET` propio; `NODE_ENV=production` (cookie Secure + guardas activas).
5. **2FA** en GitHub/hosting/Turso/dominio/correo.
6. Encender canales (correo, webs, IA) cargando el `.env` del host.

## Pendientes de calidad (opcionales)
- Pruebas E2E del frontend (Playwright) — aún no hay.
- Feeds RSS reales para `WEB_SOURCES` (por investigar/verificar).
- CSRF token dedicado si se requiere (hoy mitigado por SameSite + CORS).

## Notas / gotchas
- Windows con SAC: preferir deps puras/WASM (ya se cumple).
- PDF: en Windows usa Word COM; en Linux (hosting) requiere **LibreOffice** instalado.
- `drizzle-kit` arrastra 4 vulnerabilidades moderadas (solo dev, no se despliega).
- Estado detallado y vivo en `CHECKLIST.md`; decisiones en `docs/DECISIONES.md`.
