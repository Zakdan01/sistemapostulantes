# Sitio público corporativo dentro de la SPA

**Goal:** reemplazar las cuatro páginas públicas de la SPA por el diseño y la estructura del sitio estático `Silver parasoul inc/`, conservando las rutas de React Router, los datos reales de `GET /api/publico/convocatorias` y sin tocar el panel del postulante, `/interno`, el backend ni sus tests.

**Architecture:** el marco público (`PublicoCorporativo`) inyecta un `<link>` a `/corporativo.css` mientras esté montado; ese CSS vive en `frontend/public/` y no pasa por Tailwind, así que no altera las rutas internas. Los iconos son un sprite SVG compartido, los efectos de entrada un hook con `IntersectionObserver`, y las tarjetas leen solo campos públicos. La lógica pura (separación de requisitos, cupos cubiertos, armado del mailto) vive en un módulo con tests de `node --test`.

**Tech Stack:** React 19, Vite 8, Tailwind v4 (solo rutas internas), CSS estático aislado, Node test runner.

**Spec:** brief aprobado por el usuario en la conversación previa (sin archivo de spec). Decisiones fijadas: diseño idéntico al estático; rutas sin cambios; sin pestañas nuevas ni formulario de URL; correo único `contacto@consultora.com`; cifras de ejemplo y credenciales demo se conservan como copy decorativo.

## Global Constraints
- No modificar `backend/`, `tests/` de backend, ni las rutas `/mi-panel`, `/mis-convocatorias`, `/mi-perfil`, `/interno*`.
- No agregar dependencias. `npm run lint` debe seguir en 0 errores (4 warnings conocidos) y `npm run build` debe pasar.
- Todo enlace a la plataforma es `<Link>` interno; no `target="_blank"`, no IPs, no `sp_url_sistema`.
- La API pública solo entrega `id, titulo, tipo, anios_min, disponibilidad, cupos, vacantes, requisitos[]`. No inventar `kpi_minimo`, correos ni conteos internos.
- Un solo origen de tema: `localStorage.tema` → `.dark` **y** `data-theme` en `<html>`.
- `Silver parasoul inc/` es carpeta sin seguimiento: copiar los assets, nunca references en runtime.
- Sin commits: el usuario pidió ver el resultado en el workspace actual, sobre `main`.

## Review Focus
- Que el CSS corporativo no se filtre a rutas internas después de navegar (el `<link>` debe desmontarse).
- Que `/login` y `/registro` conserven su contenido y funcionen dentro del marco sin duplicar cabecera.
- Que no quede ningún `http://localhost:5173`, `target="_blank"` ni dato de demo en las tarjetas.
- Contraste en ambos temas, menú móvil, `prefers-reduced-motion` y foco visible.
- Que las tarjetas muestren requisitos opcionales con el sufijo ` (deseable)` que manda la API.

### Task 1: Helpers puros con tests (RED → GREEN)

**Files:**
- Create: `frontend/tests/corporativo.test.js`
- Create: `frontend/src/lib/corporativo.js`

**Interfaces:**
- Produce `separarRequisitos`, `cuposCubiertos`, `mensajeConvocatoria` para Tasks 2 y 4.

**Step 1 — RED:** escribir `frontend/tests/corporativo.test.js` con casos reales: separar requisitos obligatorios/deseables por el sufijo exacto, cubiertos = `cupos - vacantes` nunca negativo, y mailto con asunto/cuerpo codificados al correo pasado por parámetro.
**Expected:** `cd frontend; node --test tests/corporativo.test.js` falla porque el módulo no existe.

**Step 2 — GREEN:** crear `frontend/src/lib/corporativo.js` con lo mínimo para pasar.
**Expected:** el mismo comando pasa sin errores ni warnings.

### Task 2: Assets y sistema visual aislado

**Files:**
- Create: `frontend/public/corporativo.css`, `frontend/public/hero-scene.svg`, `frontend/public/majestuoso-atardecer-montana-sobre-valle-nubes_23-2152014213.avif`
- Create: `frontend/src/components/IconosCorporativos.jsx`
- Create: `frontend/src/components/ConvocatoriaCardCorporativa.jsx`
- Create: `frontend/src/hooks/useCorporateEffects.js`

**Interfaces:**
- Consume `separarRequisitos` y `cuposCubiertos` de Task 1.
- Produce `<Icono nombre>`, `<ConvocatoriaCardCorporativa c>`, `useCorporateEffects()` para Tasks 3 y 4.

**Step 1:** copiar los dos assets al `public/` y copiar `styles.css` como `public/corporativo.css`, dejando las URLs absolutas (`/hero-scene.svg`, `/…avif`) y `data-theme`.
**Expected:** `Get-ChildItem frontend/public` lista los tres archivos.

**Step 2:** crear el sprite y el componente `Icono` con los 19 símbolos del HTML original; crear la tarjeta con `pill-estado`, tags de tipo/años/disponibilidad, requisitos, progreso de cupos y pie «N vacantes».
**Expected:** `cd frontend; npm run lint` sigue con 0 errores.

**Step 3:** crear `useCorporateEffects` con reveal, contadores y cierre de menú por Escape, reobservando al cambiar `pathname`.
**Expected:** lint en 0 errores.

### Task 3: Marco público y tema único

**Files:**
- Create: `frontend/src/components/PublicoCorporativo.jsx`
- Modify: `frontend/src/App.jsx`

**Interfaces:**
- Consume `Icono` y `useCorporateEffects` de Task 2.
- Produce el `<Route element>` que envuelve las seis rutas públicas en Task 4.

**Step 1:** crear el marco con cabecera sticky, navegación por rutas/hashes internos, toggler de tema, menú móvil, footer de cuatro columnas, `<Outlet>` y sprite; inyectar y limpiar el `<link rel="stylesheet" href="/corporativo.css" id="css-corporativo">` en el ciclo de vida.
**Expected:** lint en 0 errores.

**Step 2:** en `App.jsx`, reemplazar `Publico` por `PublicoCorporativo` en el `<Route element>` público y hacer que `useTema` escriba también `document.documentElement.dataset.theme`.
**Expected:** `cd frontend; npm run build` pasa.

### Task 4: Páginas públicas

**Files:**
- Rewrite: `frontend/src/pages/Inicio.jsx`, `ConvocatoriasPublicas.jsx`, `Empresas.jsx`, `Contacto.jsx`
- Create: `frontend/src/components/FormularioConvocatoriaCorporativo.jsx`

**Interfaces:**
- Consume todas las interfaces anteriores más `mensajeConvocatoria` y `EMPRESA.correo`.

**Step 1:** crear el formulario de convocatoria con modal, `useToast` y copy-to-clipboard con fallback, usando `EMPRESA.correo`.
**Expected:** lint en 0 errores.

**Step 2:** reescribir `Inicio.jsx` con hero, servicios, proceso, convocatorias reales, plataforma (sin URL form), soluciones y contacto; hashscope (`#servicios`, `#proceso`, `#plataforma`) con scroll al llegar.
**Expected:** build pasa; la única fuente de convocatorias es `api('/api/publico/convocatorias')`.

**Step 3:** reescribir `ConvocatoriasPublicas.jsx` (búsqueda + filtro por tipo sobre datos reales), `Empresas.jsx` (split cards) y `Contacto.jsx` (datos + formulario).
**Expected:** lint 0 errores / build pasa; sin `DEMO`, sin `target="_blank"` y sin `localhost:5173` en `frontend/src/pages`.

### Task 5: Verificación final

**Step 1:** correr juntos `npm run lint`, `npm run build` y `node --test tests/corporativo.test.js`.
**Expected:** lint exit 0 con exactamente los 4 warnings conocidos; build exit 0; tests 3/3.

**Step 2:** pasar el detector de Impeccable sobre los archivos cambiados y revisar el render en 1440px y 390px en ambos temas sihay navegador disponible.
**Expected:** sin hallazgos críticos; `git status` muestra solo los archivos previstos.
