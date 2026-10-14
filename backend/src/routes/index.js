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

r.post('/auth/registro', asyncHandler(Auth.registro));
r.post('/auth/login', asyncHandler(Auth.login));

r.get('/tecnologias', asyncHandler(Tec.listar));
r.get('/catalogos', autenticar, asyncHandler(Tec.catalogos));

r.post('/personas/upsert', autenticar, soloRol('admin', 'reclutador'), asyncHandler(Auth.upsert));
r.get('/personas', autenticar, soloRol('admin', 'reclutador'), asyncHandler(Personas.listar));
r.get('/yo', autenticar, asyncHandler(Personas.yo));
r.put('/yo', autenticar, soloRol('postulante'), soloActiva, asyncHandler(Personas.actualizarYo));
r.get('/personas/:id', autenticar, soloRol('admin', 'reclutador'), asyncHandler(Personas.detalle));
r.get('/eventos', autenticar, soloRol('admin', 'reclutador'), asyncHandler(Personas.eventos));

r.get('/configuracion', autenticar, soloRol('admin'), asyncHandler(Cfg.ver));
r.put('/configuracion', autenticar, soloRol('admin'), asyncHandler(Cfg.actualizar));

// Convocatorias (alias /vacantes* temporal para compatibilidad)
r.post('/convocatorias', autenticar, soloRol('admin', 'reclutador'), asyncHandler(Conv.crear));
r.get('/convocatorias', autenticar, asyncHandler(Conv.listar));
r.get('/convocatorias/:id', autenticar, asyncHandler(Conv.detalle));
r.patch('/convocatorias/:id/cerrar', autenticar, soloRol('admin', 'reclutador'), asyncHandler(Conv.cerrar));
r.patch('/convocatorias/:id/aprobar', autenticar, soloRol('admin'), asyncHandler(Conv.aprobar));
r.patch('/convocatorias/:id/rechazar', autenticar, soloRol('admin'), asyncHandler(Conv.rechazar));
r.delete('/convocatorias/:id', autenticar, soloRol('admin'), asyncHandler(Conv.eliminar));
r.get('/convocatorias/:id/ranking', autenticar, soloRol('admin', 'reclutador'), asyncHandler(Conv.ranking));
r.post('/convocatorias/:id/postular', autenticar, soloActiva, asyncHandler(Conv.postular));
r.post('/vacantes', autenticar, soloRol('admin', 'reclutador'), asyncHandler(Conv.crear));
r.get('/vacantes', autenticar, asyncHandler(Conv.listar));
r.get('/vacantes/:id', autenticar, asyncHandler(Conv.detalle));
r.patch('/vacantes/:id/cerrar', autenticar, soloRol('admin', 'reclutador'), asyncHandler(Conv.cerrar));
r.delete('/vacantes/:id', autenticar, soloRol('admin'), asyncHandler(Conv.eliminar));
r.get('/vacantes/:id/ranking', autenticar, soloRol('admin', 'reclutador'), asyncHandler(Conv.ranking));
r.post('/vacantes/:id/postular', autenticar, soloActiva, asyncHandler(Conv.postular));
r.get('/mis-postulaciones', autenticar, asyncHandler(Conv.misPostulaciones));
r.patch('/postulaciones/:id/estado', autenticar, soloRol('admin', 'reclutador'), asyncHandler(Conv.cambiarEstado));

// Admin de cuentas: crear staff + aprobar/rechazar registros
r.post('/admin/usuarios', autenticar, soloRol('admin'), asyncHandler(Usuarios.crear));
r.get('/admin/usuarios', autenticar, soloRol('admin'), asyncHandler(Usuarios.listar));
r.patch('/admin/usuarios/:id/aprobar', autenticar, soloRol('admin'), asyncHandler(Usuarios.aprobar));
r.patch('/admin/usuarios/:id/rechazar', autenticar, soloRol('admin'), asyncHandler(Usuarios.rechazar));

// Gestor: resumen + colas (postulante ve el tablero general en su Gestor)
r.get('/admin/resumen', autenticar, soloRol('admin', 'reclutador'), asyncHandler(Conv.resumen));
r.get('/postulaciones', autenticar, asyncHandler(Conv.cola));

module.exports = r;
