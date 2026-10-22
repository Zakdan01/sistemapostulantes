const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const Usuario = require('../models/usuario.model');
const Candidatos = require('../services/candidatos');
const { HttpError } = require('../utils/errors');
const { exigirCorreo } = require('../utils/validar');
const { ROLES, ESTADOS_CUENTA } = require('../domain/catalogos');

const ROLES_STAFF = ROLES.filter((r) => r !== 'postulante');

// Solo admin: crea cuentas de staff (reclutador/admin), nacen activas. Sin persona ni CV.
async function crear(req, res) {
  const { correo, password, rol } = req.body;
  const c = exigirCorreo(correo);
  if (!ROLES_STAFF.includes(rol)) {
    throw HttpError.badRequest(`rol debe ser ${ROLES_STAFF.join(' o ')}`);
  }
  if (!password || String(password).length < 8) throw HttpError.badRequest('password mínimo 8 caracteres');
  if (await Usuario.buscarPorCorreo(c)) throw HttpError.conflict('El correo ya está registrado');
  const hash = await bcrypt.hash(String(password), 10);
  const u = await Usuario.crear(pool, { correo: c, password_hash: hash, rol, estado_cuenta: 'activa' });
  res.status(201).json(u);
}

async function listar(req, res) {
  const estado = req.query.estado ? String(req.query.estado) : undefined;
  if (estado && !ESTADOS_CUENTA.includes(estado)) throw HttpError.badRequest('estado inválido');
  res.json(await Usuario.listar(estado));
}

async function aprobar(req, res) {
  const u = await Usuario.cambiarEstado(Number(req.params.id), 'activa');
  if (!u) throw HttpError.conflict('Solo se puede aprobar una cuenta pendiente');
  // la cuenta activa entra al padron de candidatos: hay que recalcular las listas vivas
  Candidatos.invalidarPadron();
  res.json(u);
}

async function rechazar(req, res) {
  const u = await Usuario.buscarPorId(Number(req.params.id));
  if (!u || u.estado_cuenta !== 'pendiente') {
    throw HttpError.conflict('Solo se puede rechazar una cuenta pendiente');
  }
  const ok = await Usuario.eliminarConPersona(u.id);
  if (!ok) throw HttpError.notFound('Cuenta no encontrada');
  Candidatos.invalidarPadron();
  res.json({ mensaje: 'Cuenta rechazada y eliminada' });
}

module.exports = { crear, listar, aprobar, rechazar };
