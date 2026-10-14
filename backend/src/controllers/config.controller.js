const Config = require('../models/config.model');

async function ver(req, res) {
  res.json(await Config.obtenerConfig());
}

async function actualizar(req, res) {
  res.json(await Config.actualizarConfig(req.body || {}));
}

module.exports = { ver, actualizar };
