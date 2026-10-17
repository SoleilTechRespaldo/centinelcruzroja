# Guía de uso — Centinela

Manual del operador. Explica **qué es cada pantalla**, **qué hace cada botón** y el
**circuito completo** para producir un BIE. Es también la base del tutorial dentro de
la app (botón **"¿Cómo funciona?"** en cada pantalla).

> **Qué es Centinela:** herramienta de **apoyo** al monitoreo situacional y a la
> generación del **BIE / Monitoreo Regional** de la Cruz Roja Chilena, Región de
> Valparaíso. **No es oficial, no emite alertas y no publica sola.** Siempre decide una
> persona (humano al centro).

---

## 1. Ingreso y roles

Se entra con **correo + clave** (no hay auto-registro: el administrador crea a las
personas en **Usuarios** y les asigna un rol).

| Rol | Puede |
|---|---|
| **Administrador** | Todo: usuarios, catálogos, revisar canales, crear/editar, aprobar. |
| **Coordinador** | Crear/editar incidentes y BIE, verificar indicios, **aprobar** BIE. |
| **Operador** | Crear/editar incidentes, capturar y verificar indicios, redactar BIE. |
| **Consulta** | Solo lectura. |

> Los usuarios que vienen hoy (`@cruzroja.cl`) son **de prueba (demo)**. Antes del uso
> real, el administrador los reemplaza por personas reales con clave propia.

---

## 2. El circuito completo (de la información al BIE)

```
Incidente  →  Bandeja (indicios)  →  Verificar  →  Generar BIE  →  Aprobar  →  Descargar  →  Expediente
 (evento)      correo/web/redes/      visto bueno   autollenado +   coordinador   Word / PDF    (archivo del
               manual + IA            = fuente       ajustes         o admin                     evento cerrado)
```

1. **Crea o elige un Incidente** (el "contenedor" del evento). *Menú: Incidentes.*
2. **Llega material a la Bandeja** por 4 canales (ver §4) + apoyo de **IA**.
3. **Revisa cada indicio** y decides: **verificar** (visto bueno) o **descartar**.
   Verificar con *"Agregar como fuente"* lo liga al incidente → así alimenta el BIE.
4. **Genera el BIE**: se **autollena** desde el incidente y sus fuentes; tú ajustas.
5. **Guarda borrador** o **envía a aprobación**; un **coordinador/admin aprueba**.
6. **Descarga** en **Word** o **PDF** (rellena el formato oficial con logos).
7. Al cerrar el evento, queda el **Expediente** (resumen, cronología, lecciones).

---

## 3. Pantalla por pantalla

### Incidentes
El listado de eventos. Cada incidente tiene código (ej. `2026-0014`), tipo, comunas y
alertas (SENAPRED / Cruz Roja). Desde aquí creas uno nuevo o entras al detalle.

### Bandeja de indicios
Donde llega el material a revisar. Columnas: Canal, Indicio, Origen, Recibido, Incidente.
Pestañas: **Por verificar · Verificadas · Descartadas**. Botones:
- **Revisar correo** / **Revisar webs** *(admin)* — fuerza una lectura ahora de los canales
  automáticos (requieren estar configurados en el servidor; ver §4).
- **Capturar de redes** — registra un post **oficial** de redes de forma legal: enlace +
  descripción (+ captura de pantalla opcional). Queda "por verificar" y **fuera del BIE**.
- En cada fila: **verificar** · **descartar** · **ver**.
  - **ver** → detalle del indicio + **Apoyo IA** (botón **"Analizar con IA"**; si ya se
    analizó, dice **"Reanalizar"**). La IA sugiere resumen + tipo + comunas; **es solo
    sugerencia**, la revisas tú.
  - **verificar** → eliges **Incidente**, activas *"Agregar como fuente"*, pones el
    **Organismo** (ej. SENAPRED) y una **Nota de verificación** (comentario de tu chequeo).
  - **descartar** → con motivo opcional.

### Generar BIE
Formulario que se **autollena** desde el incidente y sus fuentes verificadas. Secciones:
Datos oficiales · Afectación · Descripción (16 títulos) · Acciones Cruz Roja · Necesidades ·
Cierre y firma (*Elaborado por* = tú; *Autorizado por* = Ive Manni, fijo). Botones:
- **Guardar borrador** → guarda una **versión** (queda en la lista "Versiones", en la base).
- **Enviar a aprobación** → guarda una versión que el **coordinador/admin** puede **Aprobar**
  (botón "Aprobar" en la lista de versiones). *Hoy la aprobación es dentro de la app, por
  rol; no se envía correo.*
- **Ver completo** → vista previa a página completa.
- **Word** / **PDF** → descarga el documento con el formato y los logos oficiales.
- Marca **N/A** = no aplica a este evento · **"En evaluación"** = aplica pero aún sin dato.

### Expediente
El **archivo del evento cerrado**: duración, BIE emitidos, evidencias, fuentes, comunas,
cronología completa y **conclusiones / lecciones aprendidas**. *(Hoy es una vista de ejemplo;
se conectará a datos reales.)*

### Estadísticas
Panel de **situación regional**: métricas actuales, incidentes activos y comunas por alerta.
*(La sección "Histórico" hoy muestra datos de ejemplo.)*

### Mapa
Mapa de la región (Leaflet + OpenStreetMap, gratis). Marca **afectaciones** por tipo
(incendio, inundación, corte de agua/luz, deslizamiento, albergue…). Botones:
- **Agregar afectación** → clic en el mapa para ubicar el punto y describirlo (puedes ligarlo
  a un incidente).
- **Capas** → muestra/oculta por tipo. **Ampliar** → pantalla grande.

### Cámaras
Transmisiones públicas de YouTube por zona (apoyo visual). *(Hoy es una maqueta; la versión
real se conectará al proyecto "Ojos de Águila" vía la API gratuita de YouTube.)*

### Catálogos
Las **listas maestras** que alimentan los menús del sistema (para no tenerlas fijas en el
código): **Comunas** (las 38 + provincia), **Tipos de evento** y **Fuentes** (organismos
oficiales: SENAPRED, DMC, CONAF…). El admin puede **agregar / activar / desactivar**.
*(Las filiales de Cruz Roja no van aquí; se manejan por evento.)*

### Usuarios *(solo admin)*
Alta de personas por correo + rol. No hay auto-registro.

---

## 4. Canales de entrada e IA

| Canal | Qué es | Cómo se enciende |
|---|---|---|
| **Correo** | Lee buzones IMAP (ej. correos de SENAPRED) | `IMAP_MAILBOXES` en el servidor |
| **Web** | Lee feeds RSS/Atom de sitios oficiales | `WEB_SOURCES` en el servidor |
| **Redes** | Captura **humana y legal** de posts oficiales (enlace + captura) | Siempre disponible |
| **Manual** | Carga a mano | Siempre disponible |
| **IA** (apoyo) | Resume y clasifica un indicio (sugerencia) | `AI_PROVIDER` (ej. Groq, gratis) |

> **Legalidad:** no se hace *scraping* de redes. Las redes entran solo por **captura humana**
> (enlace + captura) y **quedan fuera del BIE** hasta que una persona les da el visto bueno.
> La IA **nunca** inventa ni publica: solo sugiere, y una persona revisa.

---

## 5. Reglas de oro

- **Nada entra al BIE sin visto bueno humano.**
- **Sin dato:** usa **N/A** (no aplica) o **"En evaluación, no hay información verificable al
  momento"** (aplica pero aún sin dato). No inventar.
- **Privacidad:** el BIE **nunca** lleva teléfonos ni datos sensibles de personas
  (nombre/RUT/dirección/salud individual). Se anonimiza con descriptores genéricos.
- **Toda cifra lleva fuente + hora.**

---

## 6. Encender / apagar la app (local)

```
cd server && npm run dev      # API en http://localhost:8787
cd app && npm run dev         # Web en http://localhost:5173
```

Ingreso de prueba: `njerez@cruzroja.cl`. Configuración de canales e IA: `server/.env`
(ver `server/.env.example` y `docs/07-DESPLIEGUE.md`).
