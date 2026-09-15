# Etapa 2 — Ingesta automática y mapa operativo — Centinela (SoleilTech)

> Cómo lograr que el sistema **ingrese información por sí solo** (correo oficial,
> webs oficiales y captura legal de redes), la deje **como indicio para revisar**
> —nunca la publica solo— y permita **documentar afectaciones en el mapa**.
>
> **Principios que no se tocan:** herramienta de **apoyo** (no oficial), **persona
> al centro** (todo pasa por visto bueno humano), **nada ilegal** (sin scraping de
> redes), y cada dato con **fuente + hora**. **Versión del documento: 0.1 (borrador para decidir).**

---

## 1. Idea central: la «Bandeja de indicios»

Hoy la ingesta es manual (pegar/reenviar). La Etapa 2 agrega **canales que traen
material solos**, pero todos caen en un mismo lugar nuevo: una **bandeja de indicios**
por incidente. Un indicio nunca entra al BIE automáticamente; tiene un **estado**:

| Estado | Qué significa | ¿Sale en el BIE? |
|--------|---------------|------------------|
| **Por verificar** | Llegó de un canal (correo/web/redes). Nadie lo revisó aún. | No |
| **Verificado** | Un operador lo cotejó con fuente oficial y le dio **visto bueno**. | Sí (como fuente/hito) |
| **Descartado** | Falso, duplicado o irrelevante. Queda registrado igual (trazabilidad). | No |

Esto resuelve tu punto de las redes: lo no oficial **se ve dentro del sistema**,
marcado como tal, y **solo se suma al BIE cuando alguien lo aprueba**.

---

## 2. Canal A — Correo oficial de SENAPRED (RF-26) · *lo primero*

**Qué hace:** un buzón dedicado (ej. Gmail gratuito) recibe los comunicados de
SENAPRED (suscribiéndolo a sus listas o reenviándole los correos). El servidor lo
lee por **IMAP** cada pocos minutos, detecta correos nuevos de remitentes oficiales,
y crea un **indicio “por verificar”** con el texto y los **adjuntos** (los PDF de
alerta), enlazándolo al incidente que corresponda.

- **Costo:** US$0 (Gmail gratis + IMAP; librerías `imapflow`/`mailparser`).
- **Legal:** total — es tu propio buzón recibiendo lo que te mandan.
- **Requisito real:** que SENAPRED efectivamente te llegue por correo (ya sueles
  estar en esas listas) o reenviar esos correos al buzón del sistema.
- **Ojo (ver §8):** para revisar el correo **24/7** el servidor debe estar siempre
  encendido; en tu PC solo revisa cuando el PC está prendido.

## 3. Canal B — Webs oficiales (RF-20) · *lo segundo*

**Qué hace:** “conectores” que vigilan sitios oficiales (SENAPRED, DMC, SHOA,
CONAF, SEC, Esval, Vialidad…) y avisan de novedades como indicios.

- **Orden de preferencia:** **RSS / datos abiertos** (estable) → y solo si no hay,
  leer una página concreta (respetando `robots.txt`). El scraping mínimo **puede
  romperse** si el sitio cambia; por eso se prioriza RSS.
- **Detección de cambios (tu sugerencia):** cada conector se **autochequea**. Si el
  sitio no responde o cambió su estructura, genera un indicio especial **“fuente
  caída / posible cambio”** con la última URL buena y los enlaces nuevos que
  encuentre en la portada/mapa del sitio, para que **tú corrijas la fuente**.
  > Honesto: detectar **que** cambió es factible; adivinar **la nueva URL exacta**
  > no siempre — por eso se te muestra para que la ajustes en 1 clic.
- **Costo:** US$0 + **mantención** (ajustar conectores cuando un sitio cambia).

## 4. Canal C — Redes sociales, **legal** (RF-27)

Nada de entrar a leer redes por nuestra cuenta (viola los Términos de Servicio de
X/Meta y hoy sus APIs útiles son de pago). En su lugar, **captura humana asistida**,
tal como pediste:

- Un espacio **“Indicios de redes”** dentro del incidente donde el operador **pega
  el enlace del post oficial + una captura**, indica de qué perfil es y una nota.
- Queda marcado **“no oficial · por verificar”** y **fuera del BIE**.
- Cuando se **coteja con la fuente oficial** y se le da el **visto bueno**, pasa a
  “verificado” y recién ahí **puede** entrar al BIE, citando la verificación oficial.
- **Costo:** US$0. **Legal:** sí (es documentación manual con atribución).

---

## 5. IA de apoyo (RF-18) — qué hace y **cuánto cuesta**

La IA es **opcional y separable**: la ingesta funciona **sin** ella (guarda el
material crudo para revisión humana). La IA solo **agrega comodidad**: resume un
correo/aviso, dice a qué **comunas** afecta, **detecta duplicados** y **pre-rellena**
campos del BIE. Nunca inventa ni publica.

**Costos (pago por uso, sin costo fijo; US$0 si no se usa).** Estimación con el
modelo más económico (Claude Haiku), *aproximada — a confirmar con el precio vigente
de Anthropic*:

| Escenario | Uso aprox. | Costo estimado |
|-----------|-----------|----------------|
| Resumir/clasificar un correo o aviso | 1 operación | **~US$0,005–0,02** |
| Asistir el borrador de un BIE completo | ~10 fuentes + 1 redacción | **~US$0,05–0,15** |
| **Mes tranquilo** (pocas o ninguna alerta) | casi sin uso | **≈ US$0** |
| **Mes activo** (varios eventos, decenas de BIE) | cientos de operaciones | **~US$5–20** |

Para un equipo **< 10 personas** y uso **solo durante eventos**, lo realista es
**cerca de US$0 la mayoría del tiempo** y **unos pocos dólares** en meses movidos.
Se puede **poner un tope mensual**, usar **caché de prompts** y **procesamiento por
lotes (−50%)** para abaratar. **Recomendación:** construir la ingesta primero (US$0)
y **activar la IA después**, cuando veas el volumen real.

---

## 6. Mapa operativo por capas (tu pregunta del mapa)

**Sí, el mapa puede reflejar la información.** Se extiende el mapa (Leaflet, gratis)
para **documentar afectaciones georreferenciadas**:

- El operador marca en el mapa un **punto** (clic) o una **zona/comuna** e indica el
  **tipo**: deslizamiento, socavón, corte de agua, corte de luz, corte de redes,
  incendio, inundación, ruta cortada, etc.
- Cada tipo tiene su **ícono y color**; se puede **filtrar por capa** (“ver solo
  cortes de agua”) y por incidente.
- Los indicios verificados con ubicación pueden **proponer** un marcador (que el
  operador confirma).
- **Costo:** US$0 (Leaflet + mapa base OpenStreetMap). Ubicación por clic manual;
  opcionalmente geocodificar direcciones con Nominatim (gratis, con límite de uso).

Esto es en parte **paralelo** a la ingesta (es visualización), pero encaja porque
documenta lo que la ingesta y el equipo van registrando.

---

## 7. Lo que **faltó** y conviene decidir (yo lo agregaría)

1. **Servidor siempre encendido.** “Que busque solo” 24/7 exige un host **always-on**;
   tu PC solo revisa cuando está prendido. Hay opciones baratas/gratis (ver §9).
2. **Dónde guardar los adjuntos** (PDF de SENAPRED, capturas de redes). Se resuelve
   con **Cloudflare R2** (capa gratis 10 GB, sin costo de salida) — ya estaba pendiente.
3. **Deduplicación.** El mismo hecho puede llegar por correo + web + redes; hay que
   **agruparlo** para no triplicar cifras (regla simple; la IA lo mejora).
4. **Aviso interno al equipo** cuando llega un indicio importante (ej. alerta roja).
   *Ojo:* “no emitir alertas” es hacia afuera; un **aviso interno** al equipo de
   monitoreo sí se puede (correo/notificación). ¿Lo quieres?
5. **A qué incidente se pega cada indicio** entrante (por tipo/comuna/palabras clave)
   o si cae en una **bandeja general** para asignar a mano.
6. **Privacidad (Ley 19.628 / 21.719).** El material crudo puede traer datos
   personales; el BIE ya anonimiza, pero el **acceso al crudo** debe quedar
   restringido por rol.

---

## 8. Qué SÍ y qué NO hace la Etapa 2

**SÍ:** traer material solo desde correo y webs oficiales; documentar redes de forma
legal; bandeja de indicios con visto bueno humano; detección de fuentes caídas;
mapa por capas; (opcional) IA para resumir/clasificar/pre-rellenar.

**NO:** entrar a leer redes sociales por su cuenta; publicar nada automáticamente;
emitir alertas hacia afuera; inventar datos.

---

## 9. Fases, esfuerzo y costos

> **Estado al 2026-09-15: ETAPA 2 COMPLETA (2.0–2.6).** ✅ 2.0 bandeja · 2.1 correo IMAP ·
> 2.2 almacenamiento local/R2 + evidencia (RF-09) · 2.3 webs oficiales RSS/Atom (RF-20) ·
> 2.4 adjuntos redes/correo (RF-27) · 2.5 mapa operativo · **2.6 IA de apoyo intercambiable
> (RF-18)**. **40 pruebas verdes**; 2.0 y 2.5 verificadas en navegador. Todo funciona local;
> los canales y la IA quedan **apagados** hasta cargar `.env` (`IMAP_MAILBOXES`,
> `WEB_SOURCES`, `R2_*`, `AI_PROVIDER`). La **IA es US$0 por defecto** (apagada; con Ollama
> local sigue en $0; opción hosteada/pago se enciende con una variable).
> **Sigue: producción — GitHub → Turso → R2 → hosting Node + dominio.**

Esfuerzo relativo (S = chico, M = medio, L = grande). Son **estimaciones**, no fechas.

| Fase | Contenido | Esfuerzo | Costo mensual |
|------|-----------|----------|---------------|
| **2.0** | Bandeja de indicios (estados + revisión) — base común | M | US$0 |
| **2.1** | Canal **Correo** (RF-26) | M | US$0 |
| **2.2** | Almacenamiento de adjuntos (R2) | S | US$0 (capa gratis) |
| **2.3** | Canal **Webs oficiales** (RF-20) + detección de cambios | L | US$0 |
| **2.4** | **Redes** legales (RF-27) + zona “por verificar” | S–M | US$0 |
| **2.5** | **Mapa** por capas/tipos | M | US$0 |
| **2.6** | **IA** (RF-18) opcional | M | pago por uso (~US$0–20) |
| — | **Hosting always-on** (para 24/7) | S (config) | US$0–5 (según opción) |

**Casi todo es US$0.** Los únicos costos posibles: **IA** (pago por uso, evitable/
topable) y **hosting** si quieres 24/7 real (hay capas gratis con límites; a confirmar).

**Orden propuesto (el que pediste):** 2.0 → **2.1 Correo** → 2.2 → **2.3 Webs** →
2.4 Redes → 2.5 Mapa → 2.6 IA (al final, si el costo te convence).

---

## 10. Decisiones

**Resueltas (2026-08-15):**
- **Hosting:** el servicio vivirá **siempre encendido en la nube** (SaaS), con la BD
  en **Turso** — **no** depende del PC de nadie; el equipo entra por internet cuando
  quiera. Nicolás gestiona **hosting + dominio + Turso** al concretar la empresa.
  ⇒ El diseño de ingesta asume **24/7** (sin la salvedad de “solo cuando el PC está
  encendido”).
- **Orden:** Correo → Webs → Redes (legal) → Mapa → IA. Confirmado.
- **Buzón:** ya existen **2 correos** que reciben SENAPRED; se conectan por **IMAP**
  (solo lectura) y el sistema **corrobora** las cifras, **no las duplica**.

**Pendientes:**
- **Aviso interno** al equipo cuando entra un indicio importante: ¿sí o no?
- **IA (RF-18):** dejarla para el final (recomendado) y decidir con el volumen real.

## 11. Dos vías en paralelo (no se bloquean)

- **Vía A — desarrollo (Claude, ahora):** construir la ingesta. **No depende** de que
  la empresa esté lista: se construye y prueba **local**, y al haber hosting + Turso,
  **se despliega igual** (mismo código — ese fue el diseño desde el inicio).
- **Vía B — empresa (Nicolás, cuando pueda):** constituir la empresa y contratar
  **hosting + dominio + Turso** (+ servicios). Al estar, se **despliega** la Vía A.

> Credenciales: las **direcciones** de correo se pueden compartir; las **claves**
> (contraseñas de aplicación de Gmail) van directo al archivo `.env` del servidor
> (que **no** se sube al repo), **nunca por chat**.

> Relacionado: [`01-REQUERIMIENTOS.md`](01-REQUERIMIENTOS.md) (RF-06/18/20/26/27),
> [`DECISIONES.md`](DECISIONES.md) (ingesta y redes, 2026-08-06) y
> [`CHECKLIST.md`](../CHECKLIST.md).
