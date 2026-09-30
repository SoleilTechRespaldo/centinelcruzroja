# Fuentes web para el monitoreo (RF-20) — estado real de los feeds

Resultado de investigar (2026-09-30) feeds **RSS/Atom** de organismos oficiales
chilenos para el canal de "webs oficiales" (`WEB_SOURCES`). **Verificado con
peticiones reales**, no supuesto.

## Hallazgo honesto
La mayoría de los organismos oficiales **NO publican RSS/Atom**:

| Organismo | ¿RSS/Atom? | Verificación |
|-----------|-----------|--------------|
| **SENAPRED** (`senapred.cl/feed/`) | ❌ No | Devuelve HTML, no XML |
| **DMC / Meteochile** | ❌ No encontrado | Sitio sin `<link rss>`; publican por app/web |
| **CONAF** (incendios) | ❌ No encontrado | Sin feed público |
| **CSN / sismología.cl** | ⚠️ Datos, no RSS | Publica datos, no un feed RSS/Atom estándar |
| **USGS** (sismos, referencia) | ✅ **Sí (Atom)** | `4.5_day.atom` válido, 13 entradas |

**Conclusión:** el canal de webs (RF-20) queda **listo y probado** (el conector
parsea Atom real), pero **hoy casi no hay feeds oficiales** que consumir. Por eso:

- El grueso de SENAPRED/DMC se cubre mejor con los **otros dos canales ya hechos**:
  **correo** (SENAPRED envía por correo) y **captura legal de redes**.
- Cuando un organismo publique un feed (o consigas una URL de RSS oficial), se
  agrega a `WEB_SOURCES` y listo; si la URL falla, el sistema avisa ("⚠ Revisar fuente").

## `WEB_SOURCES` de ejemplo (lo que SÍ funciona hoy)
Feed **sísmico** de USGS (Atom válido). Es **global**, así que trae sismos de todo
el mundo — útil solo si quieres vigilancia sísmica amplia; genera "ruido" fuera de
Valparaíso. Actívalo si te sirve:
```
WEB_SOURCES=[{"url":"https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.atom","label":"USGS sismos M4.5+","org":"USGS"}]
```

## Mejora futura: conector JSON
CSN (sismología), SEC (cortes de luz) y otros exponen **datos JSON**, no RSS. El
conector actual (`lib/webIngest.ts`) solo entiende RSS/Atom. Agregar un pequeño
**conector JSON** (mapear campos → indicio) permitiría ingerir esas APIs oficiales.
Queda anotado como mejora (no bloquea nada).
