const jwt = require('jsonwebtoken');
const { HttpError } = require('../utils/errors');

function autenticar(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return next(HttpError.unauthorized('Primero inicia sesión'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev');
    req.usuario = {
      id: payload.id,
      rol: payload.rol,
      estado_cuenta: payload.estado_cuenta || 'activa'
    };
    return next();
  } catch {
    return next(HttpError.unauthorized('Sesión inválida o vencida'));
  }
}

function soloRol(...roles) {
  return (req, res, next) => {
    if (!req.usuario) return next(HttpError.unauthorized('Primero inicia sesión'));
    if (!roles.includes(req.usuario.rol)) return next(HttpError.forbidden('No tienes permiso'));
    return next();
  };
}

function firmar(usuario) {
  return jwt.sign(
    { id: usuario.id, rol: usuario.rol, estado_cuenta: usuario.estado_cuenta || 'activa' },
    process.env.JWT_SECRET || 'dev',
    { expiresIn: '8h' }
  );
}

function soloActiva(req, res, next) {
  if (req.usuario.estado_cuenta !== 'activa') {
    return next(HttpError.forbidden('Cuenta pendiente de aprobación por el admin'));
  }
  return next();
}

module.exports = { autenticar, soloRol, soloActiva, firmar };
