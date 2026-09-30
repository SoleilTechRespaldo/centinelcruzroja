# Despliegue a producción — Centinela

Guía para publicar el SaaS. **Todo en cuentas oficiales** (`@soleiltech.cl`). El
orden importa: **dominio → BD → archivos → backend → frontend → encender canales**.

## 0. Identidad oficial (base)
1. Registrar **`soleiltech.cl`** en nic.cl.
2. Agregar el dominio a **Cloudflare** y apuntar los *nameservers* en nic.cl.
3. Correo **`@soleiltech.cl`**: **Cloudflare Email Routing** (gratis, reenvía a tu
   Gmail) basta para registrarte en los servicios; buzón real = Zoho/Google Workspace.
4. Crear con ese correo las cuentas de **Turso**, **Cloudflare** y el **hosting**.
   Activar **2FA** en todas (GitHub, Cloudflare, Turso, hosting, dominio, correo).

## 1. Base de datos — Turso
```bash
turso db create centinela
turso db show centinela --url          # → TURSO_DATABASE_URL (libsql://...)
turso db tokens create centinela       # → TURSO_AUTH_TOKEN
```
Aplicar migraciones a Turso **una vez** (desde tu PC, apuntando a la BD real):
```bash
cd server
TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... npm run db:migrate
# y sembrar usuarios/comunas/etc. (una vez):
TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... npm run db:setup
```

## 2. Archivos — Cloudflare R2
Crear un bucket (ej. `centinela`) y un **API Token de R2** (Access Key + Secret).
Variables: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`.

## 3. Backend (Hono + Node + LibreOffice) — Fly.io (recomendado)
El backend **no** va en Cloudflare Workers (usa IMAP/TCP y PDF con LibreOffice);
necesita un host Node siempre encendido. Hay un `Dockerfile` y `fly.toml` en `server/`.
```bash
cd server
fly launch --no-deploy            # crea la app (elige nombre; región scl)
fly secrets set \
  AUTH_SECRET="$(openssl rand -base64 48)" \
  TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... \
  R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... R2_BUCKET=... \
  CORS_ORIGIN=https://centinela.soleiltech.cl \
  COOKIE_SAMESITE=None
fly deploy
```
- **Alternativas:** Koyeb (capa gratis, mismo Dockerfile) o un **VPS** (~US$4–5/mes:
  `docker build -t centinela-api ./server && docker run` con las variables).
- `NODE_ENV=production` ya viene en el Dockerfile → cookie **Secure** + la guarda que
  exige un `AUTH_SECRET` propio.

## 4. Frontend (Vue/Quasar PWA) — Cloudflare Pages
- Conecta el repo de GitHub en Cloudflare Pages.
- Build: **root** `app`, comando `npm run build`, salida `dist`.
- Variable de build: `VITE_API_URL=https://api.soleiltech.cl` (la URL del backend).
- Dominio del frontend: `centinela.soleiltech.cl`.

## 5. Dominio y cookies (importante)
La sesión usa una **cookie**. Para que el navegador la mande al backend:
- **Ideal (mismo sitio):** publica el backend en un subdominio de `soleiltech.cl`
  (ej. `api.soleiltech.cl`, proxied por Cloudflare al host Node) → `COOKIE_SAMESITE=Lax`.
- **Si el backend queda en otro dominio** (ej. `*.fly.dev`): usa `COOKIE_SAMESITE=None`
  (requiere HTTPS, ya activo). Y `CORS_ORIGIN` = el dominio del frontend.

## 6. Encender los canales (variables del host)
- **Correo:** `IMAP_MAILBOXES=[{...}]` (contraseña de aplicación de Gmail).
- **Webs:** `WEB_SOURCES=[{...}]` (ver `docs/FUENTES-WEB.md`).
- **IA:** `AI_PROVIDER=ollama` (si hay Ollama en el host) o `openai` + `AI_API_KEY`.

## 7. Verificación post-despliegue (smoke test)
- `GET https://api.soleiltech.cl/health` → `ok:true`, `db:"turso"`, `storage:"r2"`.
- Login en `https://centinela.soleiltech.cl` → dashboard.
- Crear un incidente, subir una evidencia (archivo), descargar el BIE en PDF.
- Revisar correo/webs (si configurados) → aparecen indicios.

## 8. Checklist de seguridad (G5) antes de publicar
Ver `docs/DECISIONES.md` (2026-09-30): AUTH_SECRET propio ✅, CORS al dominio ✅,
rate limiting ✅, subida validada ✅, cookie HttpOnly ✅, errores sin fuga ✅.
Pendiente: 2FA de infraestructura (tú) y, si aplica, revisar `COOKIE_SAMESITE`.
