const bcrypt = require('bcryptjs');
const Usuario = require('../models/usuario.model');
const { HttpError } = require('../utils/errors');
const { exigirCorreo } = require('../utils/validar');

// Solo admin: crea cuentas de staff (reclutador/admin), nacen activas. Sin persona ni CV.
async function crear(req, res) {
  const { correo, password, rol } = req.body;
  const c = exigirCorreo(correo);
  if (!['reclutador', 'admin'].includes(rol)) throw new HttpError(400, 'rol debe ser reclutador o admin');
  if (!password || String(password).length < 8) throw new HttpError(400, 'password mínimo 8 caracteres');
  const existe = await Usuario.buscarPorCorreo(c);
  if (existe) throw new HttpError(409, 'El correo ya está registrado');
  const hash = await bcrypt.hash(String(password), 10);
  const u = await Usuario.crear(require('../config/db').pool, { correo: c, password_hash: hash, rol, estado_cuenta: 'activa' });
  res.status(201).json(u);
}

async function listar(req, res) {
  const estado = req.query.estado ? String(req.query.estado) : undefined;
  if (estado && !['pendiente', 'activa', 'rechazada'].includes(estado)) throw new HttpError(400, 'estado inválido');
  res.json(await Usuario.listar(estado));
}

async function aprobar(req, res) {
  const u = await Usuario.cambiarEstado(Number(req.params.id), 'activa');
  if (!u) throw new HttpError(409, 'Solo se puede aprobar una cuenta pendiente');
  res.json(u);
}

async function rechazar(req, res) {
  const u = await Usuario.buscarPorId(Number(req.params.id));
  if (!u || u.estado_cuenta !== 'pendiente') throw new HttpError(409, 'Solo se puede rechazar una cuenta pendiente');
  const ok = await Usuario.eliminarConPersona(u.id);
  if (!ok) throw new HttpError(404, 'Cuenta no encontrada');
  res.json({ mensaje: 'Cuenta rechazada y eliminada' });
}

module.exports = { crear, listar, aprobar, rechazar };
