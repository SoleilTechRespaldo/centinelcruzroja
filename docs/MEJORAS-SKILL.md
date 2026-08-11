# Mejoras propuestas a la skill `crear-proyecto`

Registro de mejoras detectadas al usar la skill en el proyecto Sentinel.
**Estado: anotadas, sin aplicar** — por decisión del usuario (2026-08-06) se
revisan más adelante. No modificar la skill hasta entonces.

## M1 · Añadir "Modo MVP acotado" como modo oficial ⭐
- Hoy la skill solo tiene modo completo y "modo rápido" (prototipo desechable).
- Falta un punto medio: proyecto serio, **modelado para escalar pero construido
  pequeño**. Es lo que usamos en Sentinel (improvisado).
- Acción: documentarlo en `SKILL.md` (sección "Adaptación por tipo de proyecto"
  o un "Modo MVP acotado" propio), con qué se conserva y qué se comprime.

## M2 · Corregir el truco del carácter invisible en las plantillas ⭐
- `assets/plantillas-docs.md` inserta un carácter invisible dentro de los fences
  ``` para no romper el bloque externo; si se copia literal puede corromper el
  Markdown o el código.
- Acción: usar fences de **4 backticks** para el bloque externo (o bloques
  indentados), y quitar el carácter invisible y su nota.

## M3 · Nota de Windows en la Fase 6 (menor)
- La Fase 6 asume `gh` CLI. En Windows conviene una nota: autenticar `gh` o crear
  el repo a mano en GitHub, y un fallback si el conector/MCP de GitHub no está
  autorizado en la sesión.

## M4 · ERD preliminar temprano para dominios complejos (menor)
- Para proyectos con dominio complejo, sugerir un **ERD "en papel" temprano**
  (Fase 1/2) como contrato, aunque las migraciones vayan en la Fase 10. Es justo
  lo que hicimos en Sentinel para permitir "frontend primero" sin retrabajo.
