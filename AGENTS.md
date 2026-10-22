# AGENTS.md

## Repo map
- Two independent apps, no root `package.json` or workspace tooling: `backend/` (Node + Express 5 + `pg`, raw SQL, CommonJS) and `frontend/` (React 19 + Vite 8 + Tailwind v4). Install and run scripts inside each app.
- No live architecture doc (`ESTRUCTURA.md` is gone from the working tree). Trust `backend/sql/final/esquema_final.sql` for the schema and `backend/src/routes/index.js` for per-route permissions.
- `frontend/README.md` is stock Vite boilerplate — ignore it.
- No CI, no git hooks, no `opencode.json`, no root scripts. Nothing auto-verifies a change; run the commands below yourself.

## Setup
```powershell
cd backend; npm install
cd frontend; npm install
```
- `backend/.env` is **tracked in git** and already points at `DB_NAME=sistemapostulantes`. `backend/.env.example` still says `postulantes_v2`, and `backend/src/config/db.js` falls back to `postulantes_v2` — so a missing/unread `.env` silently targets the wrong database.
- The DB is created by hand; the SQL scripts do **not** `CREATE DATABASE`. To rebuild it from scratch:
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d sistemapostulantes -f backend/sql/final/esquema_final.sql
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d sistemapostulantes -f backend/sql/final/datos_final.sql
```
  `psql` is **not** on PATH on this machine (the service is `postgresql-x64-18`).
- `esquema_final.sql` begins with `DROP ... CASCADE` — it wipes and recreates everything. `backend/sql/historial/` is historical evidence only; never execute it.
- The frontend has **no** `.env` (only `.env.example`); `VITE_API_URL` defaults to `http://localhost:3000`. There is no Vite proxy, so keep that aligned with the backend port.

## Commands
```powershell
cd backend; npm start      # http://localhost:3000, /api/health
cd backend; npm test
cd frontend; npm run dev
cd frontend; npm run build
cd frontend; npm run lint  # oxlint
```
- Run the backend **from `backend/`**: `dotenv.config()` resolves `.env` from the process cwd, so starting it from the repo root falls back to the wrong DB/credentials.
- `npm test` = `node --test tests/api.test.js tests/convocatorias.test.js tests/cuentas.test.js tests/scopes.test.js tests/kpiConv.test.js` (**84 tests**: 70 integration + 14 unit). The four integration files need the server running **and** the seed loaded; `tests/kpiConv.test.js` is pure unit (no server, no DB). Point integration tests elsewhere with `API_URL=http://host:port`.
- Run one file with `node --test tests/convocatorias.test.js`; add `--test-name-pattern="texto del test"` to run a single test. Integration tests use `fetch`, so there is no extra test harness.
- **`npm run lint` passes (exit 0)** with 4 `set-state-in-effect` warnings (`MisConvocatorias.jsx`, `Ranking.jsx`, `Buscar.jsx`, `Convocatorias.jsx`). `npm run build` passes. Keep it that way: `.oxlintrc.json` makes `react/rules-of-hooks` an **error**.
- Backend has no lint/typecheck script; frontend has no tests.

## Architecture and conventions
- **No existe la postulación.** El postulante actualiza su perfil (`PUT /yo`) y el sistema lo enlistan solo: `services/candidatos.js` arma una **lista viva** del padrón para cada convocatoria y la ordena por `kpi_conv`. Las rutas `POST /convocatorias/:id/postular`, `GET /mis-postulaciones` y `PATCH /postulaciones/:id/estado` fueron **eliminadas** (404) y sus páginas/componentes frontend también (`Postular.jsx`, `FormularioPostulacion.jsx`, `MisPostulaciones.jsx`, `EstadoPostulacion.jsx`).
- Padrón de candidatos = personas **sin cuenta** o con usuario `postulante` y `estado_cuenta='activa'` (el staff y las cuentas `pendiente` quedan fuera). Se cachea 60 s en `services/candidatos.js` y se invalida con `Candidatos.invalidarPadron()` al tocar un perfil, crear/actualizar una persona o aprobar/rechazar una cuenta.
- `convocatorias.kpi_minimo` (0-100, default 25) es el **umbral de enlistado**: se cambia con `PATCH /api/convocatorias/:id/umbral` y la lista se recalcula al instante. Quien no lo supera aparece en `excluidos[]` con `motivo_exclusion` — nadie queda oculto.
- `convocatorias.cupos` (entero 1-999, default **1**, catálogo `CUPOS` en `domain/catalogos.js`) son las vacantes. Al marcar `contratado` el último cupo, la convocatoria pasa a `cerrada` **dentro de la misma transacción** y la respuesta trae `cierre_automatico: true`; `services/pipeline.js` hace `SELECT ... FOR UPDATE` sobre la fila de `convocatorias` para que dos contrataciones simultáneas no superen los cupos. `PATCH /api/convocatorias/:id/cupos` los edita mientras no esté cerrada; si quedan por debajo de los contratados, cierra en el acto. Una convocatoria `cerrada`/`rechazada` es **solo lectura**: cualquier movimiento del pipeline o cambio de cupos → **409**.
- `candidatos_convocatoria` (antes `postulaciones_convocatoria`) guarda el pipeline: `estado`, `kpi_al_tomar`, `match_pct`, `kpi_perfil`. La fila la crea el staff al **tomar** a alguien (`PATCH /api/convocatorias/:id/candidatos/:persona_id/estado`, UPSERT). La primera toma puede crear la fila en cualquier estado (no hay transición previa que validar). Transiciones válidas: `postulado→consulta|descartado`, `consulta→preseleccionado|descartado`, `preseleccionado→contratado|descartado`, `descartado→consulta`; `contratado` es terminal. Una transición inválida → **409**; repetir el mismo estado es un no-op.
- Request flow: `routes -> controller -> service -> model (raw SQL) -> JSON`. `models/*` is SQL only (no business rules); orchestration lives in `services/*`. `backend/src/domain/catalogos.js` is the **single source of truth** for domain values (roles, account/convocatoria/candidate states, valid transitions, availability, levels + factors/order, KPI point weights and config keys); the frontend reads them from `GET /api/catalogos` instead of hardcoding copies. Role gates live only in `backend/src/routes/index.js`; row-level scoping (reclutador sees only his own stuff) is enforced in controllers via `exigirDueno` / `creada_por`.
- Throw `HttpError(status, msg)` (or its `badRequest`/`forbidden`/... helpers) in controllers/services/models and wrap async handlers with `asyncHandler`; `app.js` returns every error as JSON `{ error }`, hides 5xx details, and treats any plain `Error` as 500.
- Use `conTransaccion` from `backend/src/config/db.js` for multi-table writes (registro, upsert, `PUT /yo`, toma de candidato).
- Response shapes are inconsistent — check before assuming an array: `GET /api/personas` → `{ total, resultados }`; `GET /api/convocatorias` → plain array (con `total_candidatos` vivo y `total_postulados` del pipeline); `GET /api/convocatorias/:id/ranking` → `{ convocatoria, total, total_patron, umbral, resultados[], excluidos[] }`; `GET /api/mis-convocatorias` → array con `kpi_conv`, `califica`, `posicion`, `total_candidatos`, `motivo_exclusion`, `estado_candidato`.
- `personas.correo` is UNIQUE (one profile row per email). Both `POST /api/personas/upsert` and public registration key on it.
- `convocatorias_requisitos.nivel_minimo` defaults to `basico`; an unknown value → 400. A requirement naming an unknown technology **creates** it in `tecnologias` under category `otro`. `convocatorias_requisitos` has **no `id` column** (PK compuesta) — never `ORDER BY cr.id`.
- KPI is **calculated, never authoritative**: ranking sorts by `score = kpi_conv`, with the profile KPI only breaking ties.
  - `kpi_conv` = 80 pts for requirements (50% coverage + 50% quality: min level, level factor `.1/.25/.5/.75/1`, years up to `tope_anios_req`), both parts scaled by `min(mejor_anio/anios_min, 1)`; plus `peso_exp_afin` (half of it for generic experience, 0 for none); plus 10 when availability matches (or the convocatoria requires none). Capped at 100.
  - Profile KPI = 5 binary criteria weighted by `configuracion_kpi`. The 5 weights must sum to exactly 100, `umbral_medio <= umbral_alto`, and only the whitelisted keys in `models/config.model.js` are writable.
  - "Actualidad" = `actuales > 0` **OR** `personas.actualizado_en` dentro de los últimos `DIAS_ACTUALIDAD = 180` días (`services/kpi.js`).
- KPI changes touch `services/kpi.js`, `services/kpiConvocatoria.js`, `configuracion_kpi` and the tests together. The seeded `kpi_al_tomar` / `match_pct` / `kpi_perfil` values in `datos_final.sql` were computed with the real service — use `cd backend; node tools/seed-snapshots.js --print` to preview, then re-run without `--print` to update the DB and paste the printed literals.
- `personas.disponibilidad` (catálogo `DISPONIBILIDADES` en `backend/src/domain/catalogos.js`) es la disponibilidad que usa el KPI de convocatoria (+10 si coincide con la de la convocatoria). Ya **no** se lee de `eventos_postulacion`; `eventos_postulacion` es solo bitácora.
- Public registration always creates a `postulante` in `pendiente`; the frontend form sends only 6 fields, but the endpoint also accepts optional CV arrays. Staff are created by admin. A `pendiente` user can log in but is blocked by `soloActiva` (403) on `PUT /yo`, and the frontend `Protegida` guard confines them to `/` and `/mi-perfil`. While pending, the person is **not** in the candidate padrón (they join when the admin approves).
- Frontend state is localStorage only (`token`, `rol`, `correo`, `estado_cuenta`, `tema`). Always go through `src/lib/api.js` (`api(path)` adds the Bearer header and clears the session on 401) instead of raw `fetch`.
- `App.jsx` wraps `<Routes>` in `components/ErrorBoundary.jsx` with `key={location.pathname}`: a render crash shows the message instead of a blank app, and the boundary resets when you navigate. If a page ever renders blank, check the browser console — the error is logged there.
- Async catalogs: `useCatalogos()` returns `null` on the first render, so any page that maps catalog arrays must initialize them to `[]` (see `Convocatorias.jsx`) or use `(cats.x || [])`. This exact mistake once blanked `/convocatorias`.
- Pipeline writes go through `services/pipeline.js` (`mover`): validates the transition, freezes the snapshots on the first take, locks the convocatoria row (`FOR UPDATE`), enforces `cupos`, auto-closes the convocatoria when the last vacancy is filled, appends the `eventos_postulacion` bitácora row and runs inside `conTransaccion`. The valid-transition table is **not** duplicated in the frontend: `frontend/src/lib/estados.js` only holds labels/colors and asks `transicionesDe(catalogos, estado)` (from `GET /api/catalogos`). Frontend pages use `hooks/useAccion.js` (`ocupado` + toast on ok/error) and `lib/catalogos.js` (`useCatalogos`, `cargarCatalogos`, `invalidarCatalogos`); `useToast` lives in `lib/toast.js`, while `<ToastProvider>` lives in `components/Toast.jsx`.
- Tailwind v4 is CSS-first: tokens and component classes live in `src/index.css` (`@theme` with `--color-brand-*`; `.card`, `.btn-primary`, `.btn-secondary`, `.input`, `.lab`, `.tbl`, ...). `frontend/tailwind.config.js` exists but is **inert** (no `@config` directive) — don't add classes expecting it to be read. Dark mode is the `.dark` class (default), toggled in `App.jsx` and persisted as `tema`.
- Preserve Spanish API field names, route names, UI text, and the legacy `/vacantes*` aliases (backend routes plus the `/vacantes` → `/convocatorias` redirect in `App.jsx`) unless explicitly renamed.

## Seed and test data
- Demo password for every seeded account: `Admin123!`. Accounts: `admin@consultora.com`, `reclutador1@consultora.com`, `reclutador2@consultora.com`, `postulante01@test.com` … `postulante13@test.com` and `postulante15@test.com` … `postulante21@test.com` (active), `postulante14@test.com` (pending). `rene.bascope@candidatos.test` is a person **without** an account (still in the padrón).
- Seed counts: 24 usuarios, 22 personas, 27 eventos, 40 experiencias, 33 formaciones, 54 habilidades, 8 convocatorias (14 requisitos, cupos 3/2/2/2/1/2/1/1), 20 filas de `candidatos_convocatoria`, padrón de candidatos = 21 personas. «Soporte TI» y «QA Manual» ya tienen 1 contratado; «Pasantia Admin» está `cerrada` con 1 contratado (cupos 1).
- Tests assert on specific seed rows: `postulante04` (the one whose profile the suite rewrites), `postulante08` (the only `modo=solo` python+postgres match), `postulante13` (visible only to `reclutador2`), ≥3 convocatorias owned by `reclutador1`, ≥13 postulantes in `/api/admin/resumen`.
- The suite **mutates the database**: it rewrites `postulante04`'s CV, appends `eventos_postulacion`, and creates `nuevo*`/`rec*`/`adm*` users plus test convocatorias (and it deletes the ones it creates). It is not idempotent against the seed — re-run `esquema_final.sql` + `datos_final.sql` for a clean baseline, and never point it at anything but a disposable dev DB.

## Git/environment gotchas
- `backend/.env` and `backend/node_modules` (905 tracked files) are committed in this repo. Don't print secrets, don't stage unrelated changes to them, and never add new secrets or `node_modules` files.
- `frontend/.gitignore` excludes `node_modules` and `dist`; `backend/` has no `.gitignore`.
- The tree has uncommitted work (the whole v2 refactor: `domain/`, `services/{candidatos,convocatorias.service,pipeline}.js`, `tools/`, frontend `lib/`, `hooks/`, `components/{ErrorBoundary,EstadoCandidato,Iconos,ui}.jsx`, `MisConvocatorias.jsx`). Several files are deleted in the working tree (`ESTRUCTURA.md`, `Postular.jsx`, `MisPostulaciones.jsx`, `FormularioPostulacion.jsx`, root `package-lock.json`). Run `git status` before staging and don't discard changes that aren't yours.
