# Estructura — Sistema Postulantes v2

Stack: `Node.js + Express 5 + pg` (SQL directo, sin ORM) / `React + Vite + Tailwind v4` / `PostgreSQL`.
Base de datos: `sistemapostulantes` — se crea solo con `backend/sql/final/esquema_final.sql` + `datos_final.sql`.

## Back (`backend/`)

```
backend/
  sql/
    final/
      esquema_final.sql   # 16 tablas + vista (nombres finales, CHECK 4 estados, jornada de 2)
      datos_final.sql     # catálogos + 17 usuarios + 14 personas + CV + 8 convocatorias + 20 postulaciones (snapshots calculados)
    historial/            # 01–07: evolución (evidencia, no se ejecutan)
  src/
    server.js             # arranca en PORT (default 3000)
    app.js                # Express + CORS + JSON + monta /api + 404/500 JSON
    config/db.js          # Pool pg (.env) + conTransaccion BEGIN/COMMIT/ROLLBACK
    utils/
      errors.js           # HttpError(status, msg) -> siempre JSON {error}
      asyncHandler.js     # envuelve async para el manejo central
      validar.js          # correo lower + regex, DISPONIBILIDADES, MODOS, listas de
                          # habilidades/experiencias/formaciones, parsearFiltros
                          # (tec+modo, anios_min, tipo_trabajo, nivel)
    middlewares/auth.js   # autenticar (Bearer JWT 8h), soloRol(...), firmar
    models/               # solo SQL, sin lógica de negocio
      usuario.model.js    # buscarPorCorreo, crear
      persona.model.js    # reemplazarHabilidades/Experiencias/Formaciones,
                          # listar({tecs,modo,anios_min,tipo_trabajo,nivel}),
                          # detalle(id), conteoParaKpi(id)
      tecnologia.model.js # catalogo()
      config.model.js     # obtenerConfig, actualizarConfig (pesos suman 100)
      convocatoria.model.js # crear (con nivel_minimo, default basico), listar (con total_postulados + requisitos
                          # con mínimo), detalle, cerrar, eliminar, ranking (KPI conv + match legacy,
                          # orden score=kpi_conv), resumen, cola
    services/kpi.js       # calcularKpi(conteo, cfg): perfil completo % (5 pesos, binario)
    services/kpiConvocatoria.js # calcularKpiConvocatoria(): contra requisitos por
                          # nivel (1/.75/.5/.25/.1) x años (tope) + exp afín + disponibilidad
    controllers/          # reglas HTTP por recurso
      auth.controller.js        # registro slim SOLO postulante (6 campos, nace pendiente)
                                # + persona base; login con estado_cuenta; upsert por correo
      usuarios.controller.js    # solo admin: crear reclutador/admin + listar +
                                # aprobar/rechazar cuentas (rechazar elimina cuenta+persona)
      personas.controller.js    # listar (+KPI), detalle (+KPI), eventos,
                                # yo (perfil propio), actualizarYo (Mi perfil)
      tecnologias.controller.js # listar, catalogos (listas para formularios)
      configuracion.controller.js # ver/actualizar (solo admin)
      convocatorias.controller.js  # crear (siempre pendiente), aprobar/rechazar
                                # (solo admin), postular (CV completo en transacción
                                # + snapshot kpi/match), misPostulaciones, cambiarEstado
    routes/index.js       # PERMISOS POR ROL (ver tabla abajo)
  tests/                  # node:test contra http://localhost:3000 (61 verdes: api 19 + convocatorias 17 + cuentas 11 + scopes 6 + kpiConv 8)
    api.test.js           # health, login roles, filtros, /yo, config, cuentas slim, 401/403/404/409
    convocatorias.test.js # CRUD, alias, ranking, pipeline, aprobación, nueva-tec, nombres
    cuentas.test.js       # registro pendiente, aprobar/rechazar, staff por admin
    scopes.test.js        # reclutador solo lo suyo, PUT /yo
```

### Permisos (`routes/index.js`)

| Ruta | admin | reclutador | postulante |
|---|---|---|---|
| `POST /auth/registro` (6 campos, siempre postulante `pendiente`) | — | — | ✓ (público) |
| `POST /auth/login` (devuelve `estado_cuenta`; `rechazada`→401) | ✓ | ✓ | ✓ |
| `POST /admin/usuarios`, `GET /admin/usuarios`, `PATCH aprobar/rechazar` | ✓ | 403 | 403 |
| `POST /personas/upsert`, `GET /eventos`, `GET /catalogos`, `GET /personas` (filtros) | ✓ | ✓ | 403 |
| `GET /personas/:id` (reclutador: solo postulantes de lo suyo) | ✓ | propio | 403 |
| `GET /yo`, `PUT /yo` (Mi perfil) | 403 | 403 | ✓ (suyo) |
| `GET/PUT /configuracion` | ✓ | 403 | 403 |
| `POST /convocatorias` (nace `pendiente`) | ✓ | ✓ | 403 |
| `GET /convocatorias` (postulante: solo `abierta`; reclutador: solo suyas) | ✓ | propias | abiertas |
| `GET /convocatorias/:id` (reclutador: solo suya), `GET /:id/ranking` (igual) | ✓ | propia | 403 |
| `PATCH /:id/aprobar\|rechazar`, `DELETE /convocatorias/:id` | ✓ | 403 | 403 |
| `PATCH /:id/cerrar` (reclutador: solo suya) | ✓ | propia | 403 |
| `POST /:id/postular` (cuenta `activa`; guarda nombres+CV) | con `persona_id` | con `persona_id` | ✓ (suya) |
| `GET /mis-postulaciones` | con `?persona_id=` | con `?persona_id=` | ✓ (suyas) |
| `GET /admin/resumen` (reclutador: solo suyo), `GET /postulaciones` (igual; postulante: tablero) | ✓ | propio | tablero |
| `PATCH /postulaciones/:id/estado` (reclutador: solo suyas) | ✓ | propia | 403 |

Flujo de datos: `fetch → routes (autenticar/soloRol) → controller (valida) → model (SQL/transacción) → JSON`. KPI perfil y KPI convocatoria se **calculan** (score=kpi_conv; perfil solo desempata); al postular se guardan como foto (`kpi_al_postular`=conv, `kpi_perfil`, `match_pct` legacy).

## Front (`frontend/src/`)

```
src/
  main.jsx            # monta App + importa index.css
  index.css           # tokens @theme + .card .btn-primary/.btn-secondary .input
                      # .lab .page-title .tbl* (claro + .dark); tema oscuro por defecto
  lib/api.js          # api(path) con Bearer; 401 limpia sesión; sesion()/salir()
  App.jsx             # BrowserRouter + Nav por rol (Gestor/Búsqueda/Convocatorias/
                      # Postular/Mi perfil + ☀/🌙) + Protegida(roles)
  components/
    Toast.jsx         # toasts globales ok/error para los 12 botones de servidor
    TablaKPI.jsx      # Badge + tabla (N.º exps/Años/Habs/Nivel máx)
    FormularioPostulacion.jsx  # Datos personales + contacto + disponibilidad +
                              # habilidades + experiencias + formaciones; props:
                              # convocatoriaId | convocatoriaOpciones, personaId?,
                              # prefill?, soloVista?
  pages/              # Gestor(/, por rol) Buscar Detalle Convocatorias Postular
                      # (preview admin) Ranking (solo postulados + link + acciones)
                      # ComoSeCalcula (solo admin) Login Registro(slim) MiPerfil
                      # MisPostulaciones
```

Flujo: página → `api()` → backend → render. Sin estado global: `localStorage(token,rol,correo)`.

## BD (16 tablas + vista)

```
catalogo_{categoria_tecnologia, nivel_tecnologia, tipo_trabajo(2), nivel_formacion, instituciones}
usuarios(1 admin + 2 reclutadores + 13 postulantes activos + 1 pendiente, con estado_cuenta)
personas(14) --1:N--> eventos_postulacion(19) / experiencias_laborales(27) / formaciones_academicas(20)
personas --N:M--> tecnologias(12) via habilidades_postulante(31: nivel_id, anios_uso)
configuracion_kpi (5 pesos=100 + umbrales)
convocatorias --1:N--> convocatorias_requisitos (obligatorio + nivel_minimo, default basico) --N:1--> tecnologias
convocatorias --1:N--> postulaciones_convocatoria --N:1--> personas
v_perfil_completo (conteos por persona)
```

Estados convocatoria: `pendiente → abierta → cerrada` (o `→ rechazada`). Pipeline: `postulado → preseleccionado → contratado` (o `→ descartado`).
