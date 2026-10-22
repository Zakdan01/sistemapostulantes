const { Router } = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { autenticar, soloRol, soloActiva } = require('../middlewares/auth');
const Auth = require('../controllers/auth.controller');
const Personas = require('../controllers/personas.controller');
const Tec = require('../controllers/tecnologias.controller');
const Cfg = require('../controllers/config.controller');
const Conv = require('../controllers/convocatorias.controller');
const Usuarios = require('../controllers/usuarios.controller');

const r = Router();

// Los permisos por ROL viven SOLO aca. El scoping por fila (reclutador = solo lo suyo)
// lo hacen los controllers (exigirDueno) y los modelos.
const staff = soloRol('admin', 'reclutador');
const admin = soloRol('admin');

// ---- Publico ----------------------------------------------------------------
r.post('/auth/registro', asyncHandler(Auth.registro));
r.post('/auth/login', asyncHandler(Auth.login));
r.get('/tecnologias', asyncHandler(Tec.listar));

// ---- Catalogos (el frontend NO hardcodea estados ni factores) ---------------
r.get('/catalogos', autenticar, asyncHandler(Tec.catalogos));

// ---- Personas / perfil ------------------------------------------------------
r.post('/personas/upsert', autenticar, staff, asyncHandler(Auth.upsert));
r.get('/personas', autenticar, staff, asyncHandler(Personas.listar));
r.get('/personas/:id', autenticar, staff, asyncHandler(Personas.detalle));
r.get('/eventos', autenticar, staff, asyncHandler(Personas.eventos));
r.get('/yo', autenticar, asyncHandler(Personas.yo));
// Solo un postulante ACTIVO puede editar su CV (un pendiente recibe 403 de soloActiva).
r.put('/yo', autenticar, soloRol('postulante'), soloActiva, asyncHandler(Personas.actualizarYo));

// ---- Configuracion del KPI de perfil ---------------------------------------
r.get('/configuracion', autenticar, admin, asyncHandler(Cfg.ver));
r.put('/configuracion', autenticar, admin, asyncHandler(Cfg.actualizar));

// ---- Convocatorias ----------------------------------------------------------
// Ya no existe la postulacion: el postulante actualiza su perfil y el sistema lo
// enlista solo (lista viva, ordenada por kpi_conv) segun el umbral de la convocatoria.
function montarConvocatorias(prefijo) {
  const p = `/${prefijo}`;
  r.post(p, autenticar, staff, asyncHandler(Conv.crear));
  r.get(p, autenticar, asyncHandler(Conv.listar));
  r.get(`${p}/:id`, autenticar, asyncHandler(Conv.detalle));
  r.patch(`${p}/:id/cerrar`, autenticar, staff, asyncHandler(Conv.cerrar));
  r.patch(`${p}/:id/aprobar`, autenticar, admin, asyncHandler(Conv.aprobar));
  r.patch(`${p}/:id/rechazar`, autenticar, admin, asyncHandler(Conv.rechazar));
  r.delete(`${p}/:id`, autenticar, admin, asyncHandler(Conv.eliminar));
  r.get(`${p}/:id/ranking`, autenticar, staff, asyncHandler(Conv.ranking));
  // Umbral de enlistado (kpi_minimo): define a quien aparece en la lista de candidatos.
  r.patch(`${p}/:id/umbral`, autenticar, staff, asyncHandler(Conv.umbral));
  // Cupos (vacantes): al llenarse la convocatoria se cierra sola.
  r.patch(`${p}/:id/cupos`, autenticar, staff, asyncHandler(Conv.cupos));
  // El staff toma a un candidato de la lista y lo mueve por el pipeline.
  r.patch(`${p}/:id/candidatos/:persona_id/estado`, autenticar, staff, asyncHandler(Conv.estadoCandidato));
}
montarConvocatorias('convocatorias');
montarConvocatorias('vacantes'); // alias legacy (la UI vieja apuntaba a /vacantes)

// Postulante: convocatorias abiertas donde califica (y donde no, con el motivo).
r.get('/mis-convocatorias', autenticar, asyncHandler(Conv.misConvocatorias));

// ---- Admin de cuentas -------------------------------------------------------
r.post('/admin/usuarios', autenticar, admin, asyncHandler(Usuarios.crear));
r.get('/admin/usuarios', autenticar, admin, asyncHandler(Usuarios.listar));
r.patch('/admin/usuarios/:id/aprobar', autenticar, admin, asyncHandler(Usuarios.aprobar));
r.patch('/admin/usuarios/:id/rechazar', autenticar, admin, asyncHandler(Usuarios.rechazar));
r.get('/admin/resumen', autenticar, staff, asyncHandler(Conv.resumen));

// ---- Cola del pipeline (dos nombres para el mismo recurso) ------------------
r.get('/postulaciones', autenticar, asyncHandler(Conv.cola));
r.get('/candidatos', autenticar, asyncHandler(Conv.cola));

module.exports = r;
