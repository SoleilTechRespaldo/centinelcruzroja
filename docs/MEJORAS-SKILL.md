# Mejoras propuestas a la skill `crear-proyecto`

Registro de mejoras detectadas al usar la skill en el proyecto Sentinel.
**Estado: ✅ APLICADAS el 2026-08-30** en la actualización de la skill que
analizó condoapp, LumenStock, Sentinel y soleiltech. M1–M4 incorporadas
(detalle de dónde, en cada punto).

## M1 · Añadir "Modo MVP acotado" como modo oficial ⭐ — ✅ APLICADA
- Hoy la skill solo tiene modo completo y "modo rápido" (prototipo desechable).
- Falta un punto medio: proyecto serio, **modelado para escalar pero construido
  pequeño**. Es lo que usamos en Sentinel (improvisado).
- **Aplicado:** `SKILL.md` → sección "Modos de construcción" (Modo MVP acotado
  con Etapas 1/2, por defecto para productos serios); patrón ampliado en
  `references/lecciones-aprendidas.md` → Construcción en etapas.

## M2 · Corregir el truco del carácter invisible en las plantillas ⭐ — ✅ APLICADA
- `assets/plantillas-docs.md` inserta un carácter invisible dentro de los fences
  ``` para no romper el bloque externo; si se copia literal puede corromper el
  Markdown o el código.
- **Aplicado:** `assets/plantillas-docs.md` reescrito con fences de **4 backticks**
  para el bloque externo; carácter invisible y su nota eliminados.

## M3 · Nota de Windows en la Fase 6 (menor) — ✅ APLICADA (ampliada)
- La Fase 6 asume `gh` CLI. En Windows conviene una nota: autenticar `gh` o crear
  el repo a mano en GitHub, y un fallback si el conector/MCP de GitHub no está
  autorizado en la sesión.
- **Aplicado:** F6 ya contempla el fallback de `gh`/MCP no autorizado. Además se
  agregó una sección de entorno mucho más amplia (Smart App Control) en `SKILL.md`
  y en `references/lecciones-aprendidas.md` → Entorno Windows, con el chequeo de
  SAC movido a la Fase 5.

## M4 · ERD preliminar temprano para dominios complejos (menor) — ✅ APLICADA
- Para proyectos con dominio complejo, sugerir un **ERD "en papel" temprano**
  (Fase 1/2) como contrato, aunque las migraciones vayan en la Fase 10. Es justo
  lo que hicimos en Sentinel para permitir "frontend primero" sin retrabajo.
- **Aplicado:** F1 acción 4 (ERD en papel temprano) + F4 (orden de construcción
  flexible con capa de datos tras interfaz) + `references/lecciones-aprendidas.md`
  → Orden de construcción flexible.
