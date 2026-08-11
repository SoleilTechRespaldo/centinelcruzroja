# Design system — Centinela (SoleilTech)

> App de apoyo al monitoreo situacional / BIE para Cruz Roja Valparaíso.
> **Modo: solo claro** (sin modo oscuro). Paleta aprobada el 2026-08-06.
>
> **Nombre y logo son provisionales** — nombre líder "Centinela", mark líder
> "torre con faro" — pendientes de **evaluación final por posible cambio** (ver §7).

## 1. Principios

- **Sala de crisis:** sobrio, alto contraste, legible de un vistazo en emergencia.
- **Base neutra + acento disciplinado:** ~80% grafito/blanco/gris; el rojo se usa
  poco y con intención.
- **Armonizado con Cruz Roja** (rojo/negro/blanco) sin apropiarse del emblema.

## 2. Paleta

### Base / neutros
| Rol | Hex |
|---|---|
| Grafito (barra superior, nav, encabezados) | `#1E222B` |
| Texto primario | `#17181A` |
| Texto secundario | `#5B6472` |
| Texto tenue (captions, metadatos) | `#8A93A0` |
| Fondo de página | `#F5F6F8` |
| Superficie / tarjeta | `#FFFFFF` |
| Superficie alterna (hover, zebra) | `#F0F2F5` |
| Borde (hairline) | `#E4E7EC` |
| Borde fuerte | `#CBD2DA` |

### Marca (acento)
| Rol | Hex |
|---|---|
| Rojo Cruz Roja (primario) | `#E30613` |
| Rojo hover / press | `#C40510` |
| Rojo tenue (fondo suave) | `#FDECEC` |

> El rojo de marca se reserva a **chrome, logo y acción principal**. No se usa
> para el estado "alerta roja" (ver escala de alertas).

### Estados de alerta (semáforo — badges, chips, mapa)
| Estado | Sólido (punto/borde) | Fondo chip | Texto |
|---|---|---|---|
| Sin alerta | `#1F8A54` | `#E7F4EC` | `#14663C` |
| Amarilla | `#E5A400` | `#FBF0CE` | `#7A5A00` |
| Preventiva (celeste) | `#0EA5E9` | `#E0F2FE` | `#075985` |
| Roja | `#C1121F` | `#FADFE1` | `#7A0A12` |

> Doble alerta por incidente (SENAPRED + Cruz Roja): mismos colores; se distinguen
> por etiqueta ("SENAPRED: Amarilla" · "Cruz Roja: Verde").
>
> **Anti-choque marca ↔ alerta:** el rojo de marca (`#E30613`, vivo) vive en el
> chrome; el rojo de alerta (`#C1121F`, más profundo) vive solo en el estado, con
> etiqueta. La base neutra evita que compitan.

### Semánticos de interfaz (fuera de alertas)
| Rol | Sólido | Fondo | Texto |
|---|---|---|---|
| Éxito | `#1F8A54` | `#E7F4EC` | `#14663C` |
| Error / peligro | `#C1121F` | `#FADFE1` | `#7A0A12` |
| Advertencia | `#E5A400` | `#FBF0CE` | `#7A5A00` |
| Información / enlaces | `#2F6FE0` | `#E8F0FE` | `#1E3A8A` |

## 3. Tipografía

- **Familia UI:** Inter. Fallback: `system-ui, "Segoe UI", Roboto, sans-serif`.
  Se **empaqueta** la fuente para funcionar offline.
- **Números tabulares** en datos y tablas: `font-variant-numeric: tabular-nums`.

| Nivel | Tamaño / interlínea | Peso |
|---|---|---|
| H1 | 24 / 30 px | 600 |
| H2 | 20 / 28 px | 600 |
| H3 | 16 / 24 px | 600 |
| Cuerpo | 14 / 22 px | 400 |
| Cuerpo fuerte | 14 / 22 px | 500 |
| Caption | 12 / 16 px | 400 |

Sentence case en toda la interfaz (no ALL CAPS, no Title Case salvo nombres propios).

## 4. Espaciado, bordes y sombras

- **Escala de espaciado (px):** 4, 8, 12, 16, 20, 24, 32, 40.
- **Radios:** 6 px (controles chicos), 8 px (controles/inputs), 12 px (tarjetas),
  999 px (pills/badges).
- **Bordes:** hairline `1px #E4E7EC`; énfasis `#CBD2DA`.
- **Sombras (mínimas, plano por defecto):**
  - `sm`: `0 1px 2px rgba(23,24,26,.06)` — tarjetas elevadas.
  - `md`: `0 4px 16px rgba(23,24,26,.10)` — modales, popovers.
- Sin gradientes, sin glow.

## 5. Iconografía

- Set único: **Material Symbols Outlined** (peso 400) — se empaqueta para offline.
- Uso consistente por concepto (misma icono = mismo significado).

## 6. Estados de componentes

- **Normal / hover / focus / disabled / error** definidos para todo control.
- **Focus visible:** anillo `0 0 0 2px #E30613` (o `#2F6FE0` en campos de texto),
  nunca solo cambio de color.
- **Hover:** superficie alterna `#F0F2F5`.
- **Disabled:** texto tenue + sin sombra; evitar deshabilitar si se puede.
- **Error:** borde `#C1121F` + mensaje bajo el campo.

## 7. Marca (provisional — pendiente evaluación final)

- **Nombre líder:** Centinela. **Alternativas en evaluación:** Atalaya, Vigía.
- **Mark líder:** torre con faro (atalaya en grafito `#1E222B` coronada por un
  faro/luz roja `#E30613` — vigilancia + alerta). **Alternativas:** vigía con
  catalejo, torre simple, ojo vigía.
- **Pendiente:** una **evaluación final** de nombre + mark antes de producir el
  kit de logo (variantes horizontal/vertical, ícono, versión reversa, tamaños).
- **Reglas de marca / legal:**
  - La marca propia **no usa el emblema de la cruz roja** (protegido por ley;
    pertenece a Cruz Roja).
  - El logo de Cruz Roja se muestra solo como *"hecho para Cruz Roja Chilena —
    Comité Regional Valparaíso"* (atribución, con su autorización).
  - El nombre y la estética **no deben aparentar** un producto oficial de Cruz Roja.

## 8. Componentes reutilizables previstos

Botón (primario rojo / secundario borde / ghost / peligro) · Input, select,
textarea · Checkbox, radio, switch · Tarjeta · Tabla (zebra + números tabulares)
· Modal / diálogo · **Badge/chip de alerta** (4 estados) · Tag de comuna ·
Ítem de cronología (timeline) · Toast / notificación · Tabs · Breadcrumb ·
Estado vacío · Skeleton de carga · App bar (grafito) · Nav lateral ·
Metric card (dashboard) · Leyenda del mapa.

## 9. Modo oscuro

**N/A** — el producto es **solo claro** por decisión de producto (2026-08-06).
