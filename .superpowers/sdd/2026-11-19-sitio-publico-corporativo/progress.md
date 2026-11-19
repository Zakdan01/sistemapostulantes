# SDD ledger — plan: docs/superpowers/plans/2026-11-19-sitio-publico-corporativo.md

Pre-flight: Task 1 produce `src/lib/corporativo.js`; Tasks 2 y 4 lo consumen. Task 2 produce `Icono`, `ConvocatoriaCardCorporativa` y `useCorporateEffects`; Tasks 3 y 4 los consumen. Task 3 produce el marco que envuelve las páginas de Task 4. Sin conflictos de interfaz: las firmas quedan fijadas en el plan.

Ruling: ejecutar sobre `main` y sin worktree — el usuario pidió «ejecuta y veamos el resultado» en el workspace actual y esta máquina no tiene `bash` para los scripts `task-start`/`task-done` — el riesgo es compartir branch con trabajo ajeno; se mitiga con `git status` y sin commits.

Ruling: CSS corporativo en `frontend/public/corporativo.css` en lugar de `import ?url` — Vite sirve el archivo tal cual, sin procesar `url()` ni mezclarlo con Tailwind — costo: no hay hash de caché ni transformación PostCSS, que es justamente lo buscado.

Ruling: navegación a `/convocatorias` y `/contacto` en vez de anclas `#convocatorias`/`#contacto` — el requisito es conservar las rutas React Router y no convertir la SPA en una sola página — costo: las secciones equivalentes del estático quedan repartidas entre rutas.

Task 1: complete (tests: `node --test tests/corporativo.test.js` → RED por módulo ausente, GREEN 3/3, sin warnings).
Task 2: complete (tests: `npm run lint` → exit 0, 4 warnings conocidos, 0 errores; assets y componentes creados).
Task 3: complete (tests: `npm run build` → exit 0; marco público montado y tema espejado en `data-theme`).
Task 4: complete (tests: `npm run lint` → 4 warnings conocidos, `npm run build` → exit 0, `node --test tests/corporativo.test.js` → 3/3; grep confirma que ninguna página pública usa localhost, target="_blank", DEMO ni campos internos).
Ruling: el año del footer se calcula a nivel de módulo y el tema se aplica en `useLayoutEffect` con un script inicial en `index.html` — oxlint marcó `Date` y la mutación del DOM durante el render como impurezas — costo: el tema se sincroniza después del primer render, pero el script inline evita el flash.
Task 5: complete (tests: `npm run lint` → 0 errores / 4 warnings conocidos; `npm run build` → exit 0; `node --test tests/corporativo.test.js` → 6/6; detector de Impeccable → 1 warning de gradiente fijado por el brief; CDP → dark/light, 1440/390 sin overflow, ninguna hoja del frente público en `/interno/login`, trap y restauración de foco del modal verificados; grep sin IPs, pestañas nuevas ni campos internos en las cuatro páginas públicas).
Final: minor (deferred): el detector marca `.grad-text` como gradient text; el diseño aprobado lo exige, se conserva.

## Revisión final y arreglos

Review (agente fresco, solo lectura): sin Critical; 3 Important y varios Minor.

Important 1 — colisión de cascada: `corporativo.css` es una hoja sin capas que se cargaba también en `/login` y `/registro`, por encima de los componentes en `@layer` de Tailwind. Medido en Chrome: el `h1` con `mt-12` del login quedaba con `margin-top: 0`, `.card` con 26px de padding y 18px de radio, `.btn` y `.input` con los valores corporativos. Fix: `public/marco.css` concentra solo cabecera, pie, sprite, iconos, skip-link y toast; `PublicoCorporativo` lo carga siempre y carga `corporativo.css` únicamente cuando `esRutaCorporativa(pathname)` (helper puro con tests). Verificado: `/login` y `/registro` sin `css-corporativo`, `margin-top` 48px y `.card` sin padding own; `/interno` sin ninguna de las dos hojas.

Important 2 — contraste AA: `--muted: #6b7a90` daba 4.36:1 sobre blanco (4.09:1 sobre `--bg`). Fix: `#5c6b80` (~5.4:1) en `corporativo.css` y `marco.css`, con test de regresión que lee ambas hojas y calcula el ratio.

Important 3 — modal sin focus trap: `role="dialog" aria-modal="true"` no contenía el Tab. Fix en `FormularioConvocatoriaCorporativo`: foco inicial en «Abrir correo», ciclo Tab/Shift+Tab dentro del diálogo, Escape y restauración determinista al botón «Preparar envío» mediante ref. Dos bugs aparecidos al verificar y corregidos: `[href]` seleccionaba los `<use href>` del sprite SVG (el "último" enfocable era un icono), y restaurar desde `document.activeElement` apuntaba a `body` cuando el envío no venía de un click.

Minors corregidos: mensajes de error genéricos en las dos páginas con API (detalle solo en `console.error`); horario y dirección leídos de `EMPRESA` en `Inicio` y `Contacto`; `.input:focus-visible` recupera el outline de teclado; comentario heredado «pestaña nueva» reemplazado; tests de casos límite para los helpers.

Minors diferidos: el FOUC al inyectar los `<link>` después del primer render (ya existía; el script de tema de `index.html` evita el flash de color, y arreglarlo implicaría mover los links a `index.html` con `disabled` y cambiar el contrato del marco); el `<pre>` del modal es enfocable en Chrome por ser región con scroll, pero permanece dentro del diálogo, así que el foco sigue confinado.
