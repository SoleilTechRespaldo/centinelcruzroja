# Requerimientos — SoleilTech Sentinel

> Sistema de apoyo al monitoreo situacional regional y generación del BIE
> (Boletín de Información de Emergencia) para Cruz Roja Chilena — Región de
> Valparaíso.
>
> **Modo:** MVP acotado. Se modela el dominio para escalar, pero se construye
> pequeño y con valor inmediato. **Versión del documento: 0.2 (Fase 1).**

## 1. Comprensión del proyecto

- **Objetivo del sistema:** centralizar información oficial de emergencias de la
  Región de Valparaíso, organizarla en **incidentes** con evidencia y cronología
  trazables, y **generar el BIE en Word** con validación humana, reduciendo el
  tiempo de elaboración y dejando un repositorio consultable de cada evento.
- **Problema que resuelve:** hoy el BIE se redacta manualmente en Word buscando
  y copiando datos desde múltiples fuentes (SENAPRED, DMC, SEC, Esval, CONAF…).
  Es lento durante la emergencia, la información queda dispersa, no hay
  repositorio central de evidencia ni trazabilidad de "de dónde salió cada dato".
- **Público objetivo:** voluntariado de la Sala de Crisis / Socorros de Cruz Roja
  Chilena, Región de Valparaíso.
- **Actores:**
  - **Administrador** — gestiona usuarios, catálogos (comunas, tipos de evento,
    fuentes) y plantillas; además todo lo que hace el operador.
  - **Coordinador** — revisa y **aprueba** el BIE antes de marcarlo como
    definitivo / exportarlo; puede todo lo del operador. *(Rol previsto; puede no
    usarse al inicio, pero queda implementado.)*
  - **Operador** — crea y edita incidentes, ingresa fuentes y evidencia, redacta
    y genera el borrador del BIE.
  - **Consulta (solo lectura)** — ve dashboard, incidentes y BIE; no edita.
- **Restricciones:**
  - **Legal:** solo información pública; atribución de fuente obligatoria; no
    presentarse como sistema oficial ni emitir alertas propias; datos personales
    bajo Ley 19.628 y la nueva Ley 21.719. **Scraping de redes sociales: no**
    (viola los Términos de Servicio de las plataformas). **Monitoreo de sitios
    web oficiales del Estado: sí** (información pública, respetando robots.txt).
  - **Titularidad:** software de **SoleilTech**, licencia de uso gratuita a Cruz
    Roja vía convenio; los **datos son de Cruz Roja**; cláusula "sin garantía".
  - **Técnicas:** app web instalable (PWA) **multiplataforma** (Windows, macOS,
    Linux) y **offline-resiliente**; sin presupuesto → nube de costo cero/bajo.
  - **Contexto temporal:** temporada de sistemas frontales (invierno) → se
    prioriza tener algo **usable pronto**.

## 2. Requerimientos funcionales

Prioridad ↔ etapa: **Imprescindible = Etapa 1 (MVP núcleo)** · **Importante =
Etapa 1.x (mejoras tempranas)** · **Deseable = Etapa 2+ (visión de plataforma)**.

| # | Funcionalidad | Descripción | Prioridad |
|---|---|---|---|
| RF-01 | Autenticación | Login y recuperación de contraseña (Supabase Auth). | Imprescindible |
| RF-02 | Roles y permisos | admin / coordinador / operador / consulta, aplicados con RLS. | Imprescindible |
| RF-03 | Gestión de incidentes | Crear, editar, listar y cerrar incidentes (objeto central del sistema). | Imprescindible |
| RF-04 | Clasificación | Tipo de evento + **dos niveles de alerta**: SENAPRED (Sin alerta / Temprana Preventiva / Amarilla / Roja) y Cruz Roja interna (Verde / Amarilla / Roja). | Imprescindible |
| RF-05 | Comunas afectadas | Asociar una o varias comunas (catálogo Región de Valparaíso) a cada incidente. | Imprescindible |
| RF-06 | Ingesta manual | Reenviar/pegar texto o enlace de un correo/comunicado oficial → queda registrado como **fuente** del incidente. | Imprescindible |
| RF-07 | Captura de evidencia | Guardar con un clic: enlace + pantallazo/archivo + fecha/hora + fuente. | Imprescindible |
| RF-08 | Cronología | Línea de tiempo del incidente **append-only**; cada novedad con hora y fuente, nunca se borra. | Imprescindible |
| RF-09 | Repositorio de evidencias | Imágenes, PDF, correos y enlaces asociados al incidente. | Imprescindible |
| RF-10 | Generar BIE (Word) | Autollenar la plantilla desde el incidente, editar, y exportar `.docx`, con sello "borrador/apoyo, no oficial". Flujo de aprobación: **borrador → aprobado (coordinador) → exportado**. | Imprescindible |
| RF-11 | Versionado de BIE | Un incidente genera N versiones de BIE en el tiempo; se conserva el historial. | Imprescindible |
| RF-12 | Dashboard mínimo | Incidentes activos, por estado de alerta, por comuna, y última actualización. | Imprescindible |
| RF-13 | Procedencia por dato | Cada dato relevante guarda fuente + URL + timestamp de captura (transversal). | Imprescindible |
| RF-14 | Bitácora / auditoría | Registro append-only de quién hizo qué y cuándo. | Imprescindible |
| RF-15 | Búsqueda y filtros | Por comuna, tipo, estado, fecha y fuente. | Importante |
| RF-16 | Exportar BIE a PDF | Además del Word. | Importante |
| RF-17 | Gestión de catálogos | Editar comunas, tipos de evento y fuentes sin recompilar. | Importante |
| RF-18 | IA de apoyo | Resumir, detectar duplicados y proponer **borrador de redacción** del BIE — nunca inventa hechos, siempre validación humana, nunca publica. | Importante |
| RF-19 | Plantilla de BIE adaptable | Generar desde plantilla `.docx` con **marcadores**; poder **cargar una plantilla nueva** y mapear los campos del incidente; mapeo **asistido por IA** para plantillas sin marcar (con revisión). | Importante |
| RF-20 | Monitoreo de webs oficiales | Vigilar sitios web oficiales del Estado (SENAPRED, DMC, SHOA, CONAF…) vía web/RSS/datos abiertos, respetando robots.txt. **No** redes sociales. | Importante |
| RF-21 | Salud de fuentes + modo degradado | Avisar cuando un dato/fuente está obsoleto; mostrar claramente lo que no está actualizado. | Importante |
| RF-22 | Estadísticas / histórico | Eventos por comuna, por tipo, por año; tiempos. | Importante |
| RF-23 | Expediente del evento | Vista consolidada: descripción, cronología, evidencias, BIE, conclusiones y lecciones aprendidas. | Importante |
| RF-24 | Notificaciones internas | Aviso al ingresar un nuevo comunicado o al cambiar el nivel de alerta. | Importante |
| RF-25 | Versionado de plantilla BIE | Histórico de plantillas; cambiar la plantilla sin tocar el sistema. | Importante |
| RF-26 | Ingesta automática por correo | Leer un buzón institucional (IMAP/API) y detectar comunicados nuevos. | Deseable (Etapa 2) |
| RF-27 | Captura asistida de redes | Clip legal (enlace + captura) desde perfiles oficiales, sin scraping masivo. | Deseable |
| RF-28a | Mapa coropleta por comuna | Comunas de la Región de Valparaíso coloreadas por estado de alerta, con leyenda; clic → incidentes de la comuna; **descargable como imagen (PNG/PDF)** y exportable al BIE; funciona offline (GeoJSON empaquetado). | Importante |
| RF-28b | Mapa avanzado (capas y zonas) | **Zonas estimadas de evento** dibujadas por el operador (incendio, inundación, lluvia, remoción…) con **leyenda por tipo**; puntos geocodificados (sismos, cortes, albergues); y **capas oficiales gratis** activables: NASA FIRMS (focos de incendio), radar de lluvia (RainViewer), sismos (CSN/USGS), con atribución. Todo etiquetado "estimado, no oficial". | Deseable |
| RF-29 | Dashboards ejecutivo/operacional | Sala de crisis avanzada (estado regional, recursos, gráficos). | Deseable |
| RF-30 | Edición colaborativa en tiempo real | Co-edición simultánea del mismo incidente/BIE estilo Google Docs (presencia, cursores, resolución de conflictos). | Deseable |
| RF-31 | Multi-región / multi-organización | Jerarquía país→región→provincia→comuna; otras organizaciones y plantillas. | Deseable |
| RF-32 | Gestión de recursos | Voluntarios, vehículos, filiales e inventario más allá del texto del BIE. | Deseable |
| RF-33 | Cámaras en vivo (YouTube) | Catálogo **curado** de transmisiones en vivo (embed oficial de YouTube) de cámaras que apuntan a zonas de la región, por comuna/zona; descubrimiento opcional vía YouTube Data API (cuota gratuita). Sin descargar/scrapear streams. | Importante |

**Notas:**
- **RF-10 (fidelidad del BIE):** el `.docx` se genera **rellenando el master
  oficial** (`BIE FORMATO.docx`) → **logos y formato exactos**; el PDF = docx→PDF
  (Word COM / LibreOffice); la vista previa HTML solo lo aproxima. La estética del
  documento la define el master, no el design system de la app.
- **RF-18 (IA):** requiere un modelo de lenguaje (LLM). Tiene **costo por uso**
  (API de pago) o exige un modelo local; se evalúa el proveedor y el costo en la
  Fase 2 / Fase 14. Se construye **después** de que el núcleo del MVP funcione.
- **RF-20 (webs oficiales):** legal y estable frente al scraping de redes, pero
  igual es frágil ante cambios de HTML → se implementa con adaptadores por
  fuente (Fase 14) y con RF-21 (salud de fuentes) para avisar si una se cae.
- **RF-28a (mapa por comuna):** usa geometría pública de comunas (BCN / IDE
  Chile) y Leaflet/MapLibre; funciona offline sin tiles. Es un apoyo
  **aproximado a nivel comuna**, etiquetado "no oficial" — no dibuja footprints
  precisos inventados (el detalle fino solo desde capas oficiales, RF-28b).
  **Mapa real** con Leaflet + OpenStreetMap (gratis, sin API key); **Google Maps
  se descarta** por costo/billing — se retoma con presupuesto si se quiere satélite.
  Alternativas gratis si se quiere mejor cartografía: **MapTiler** o **Stadia Maps**
  (free tier con API key, sin tarjeta), o **Protomaps** auto-hospedado (.pmtiles).

## 3. Requerimientos no funcionales

| Aspecto | Requerimiento medible |
|---|---|
| Seguridad | Contraseñas hasheadas (Supabase Auth); autorización por roles con Row Level Security en Postgres; rate limit en login; HTTPS; secretos solo en variables de entorno; ninguna clave en el repositorio. |
| Rendimiento | Consultas y pantallas comunes responden en < 2 s; fluido en una notebook modesta. |
| Multiplataforma | Al ser PWA web, corre en **Windows, macOS y Linux** y en tablets, sobre navegadores modernos; instalable como app; **sin instaladores por sistema operativo**. |
| Colaboración multiusuario | Datos **compartidos en la nube** (Supabase): todos los usuarios autorizados se conectan a los mismos incidentes y los editan; los cambios se comparten. Salvaguarda contra sobrescritura (aviso de "otro usuario está editando" / última-escritura-gana con historial). La co-edición simultánea en vivo (RF-30) es mejora futura. |
| Disponibilidad / Offline | **Resiliencia offline** para un operador: lectura y borrador local (service worker + IndexedDB) con **cola de sincronización** al reconectar. La colaboración en vivo requiere conexión; no se promete co-edición simultánea sin conexión. |
| Escalabilidad | Modelo de datos jerárquico (país→región→provincia→comuna→incidente→BIE) preparado para crecer sin rehacer la arquitectura. |
| Respaldos | Respaldo en la nube (Supabase) + exportación local; **restauración probada** al menos una vez. |
| Trazabilidad / Auditoría | Procedencia por dato; bitácora append-only con sello de tiempo; historial de cambios de alerta que **no se sobrescribe**. |
| Privacidad / Datos personales | Minimización de datos de personas afectadas y voluntarios; política de retención definida; cumplimiento Ley 19.628 / Ley 21.719. |
| Legal / Marca | Disclaimer "borrador / apoyo, no oficial" en cada salida; atribución de fuente obligatoria; no usar logos oficiales de terceros como si se les representara; no scraping de redes sociales. |
| Accesibilidad / Responsive | Responsive (escritorio principal; tablet/móvil útil); contraste WCAG AA. |
| Idioma | Interfaz y documentos en español; código e identificadores en inglés. |

## 4. Fuera de alcance (esta versión NO incluye)

- **Scraping de redes sociales** (Facebook / Instagram / X) — se cubren con
  captura humana (RF-07 / RF-27). *(El monitoreo de webs oficiales SÍ está en
  alcance: RF-20.)*
- **Ingesta automática de correos** (buzón IMAP/API) — es **Etapa 2** (RF-26).
- **Mapa avanzado con capas** (FIRMS, WMS, puntos geocodificados — RF-28b),
  **dashboards ejecutivos avanzados**, **escala nacional / multi-organización** y
  **gestión de recursos** — visión de plataforma, futuro. *(El mapa coropleta por
  comuna, RF-28a, sí está en alcance como Importante.)*
- **Co-edición simultánea en vivo** (estilo Google Docs) — el MVP comparte datos,
  pero no co-edición en tiempo real (RF-30, futuro).
- **Emisión de alertas propias** o cualquier función que aparente ser "oficial".
- **Publicación automática** de cualquier contenido — todo pasa por validación
  humana; el sistema nunca publica solo.
- **App móvil nativa** de tiendas (es una PWA instalable, no un build nativo).

## 5. Confirmación

Aprobado por Nicolás el **2026-08-06** (Puerta G1). Se avanza a la Fase 2 (stack).
Niveles de alerta SENAPRED aceptados como: Sin alerta / Temprana Preventiva /
Amarilla / Roja.
