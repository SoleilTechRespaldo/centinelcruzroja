# Changelog

Todos los cambios notables de Centinela. El formato sigue
[Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa
[versionado semántico](https://semver.org/lang/es/).

## [No publicado]

### Por hacer
- Base de datos Turso para producción (2 variables de entorno).
- Almacenamiento real de evidencias en Cloudflare R2.
- IA de apoyo (RF-18) y pruebas E2E del frontend.

## [0.1.0] — 2026-08-15

Primera línea base funcional (MVP núcleo end-to-end sobre backend real).

### Agregado
- **Incidentes**: crear, editar y **cerrar** (`endedAt`); **cronología** de hitos;
  **fuentes** con procedencia; **evidencia** con procedencia; **historial de reportes**
  de situación (append-only). Autorización por rol en el backend.
- **BIE**:
  - Autollenado desde el incidente (16 títulos oficiales, magnitud/intensidad, equipo de
    monitoreo, acciones de Cruz Roja).
  - Generación del **`.docx`** rellenando el maestro oficial `BIE FORMATO.docx` (conserva
    logos y formato; `pizzip` + `@xmldom/xmldom`).
  - Exportación a **PDF** con LibreOffice (headless) o Word COM (Windows).
  - **Versionado y aprobación** (guardar borrador: operator+; aprobar: coordinator/admin).
- **Usuarios**: invitación por el admin, cambio de rol, activar/desactivar y
  **restablecimiento de contraseña** (con generador de clave).
- **Catálogos** (comunas, tipos de evento, fuentes) administrables contra el backend.
- **Backend** Hono + Drizzle + libSQL sobre SQLite local; auth JWT (HS256) + scrypt;
  seeder con 38 comunas, 10 tipos, 15 fuentes, 4 usuarios y 4 incidentes de ejemplo.
- **Frontend** Quasar PWA (14 pantallas) conectado al backend vía `ApiDataService`;
  accesibilidad AA.

### Calidad
- **Pruebas** de integración del API con Vitest sobre SQLite en memoria (12 casos).
- **ESLint + Prettier + EditorConfig** para todo el monorepo; scripts `check` en la raíz.
- **README** y este CHANGELOG.
