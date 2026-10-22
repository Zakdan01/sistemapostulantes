const express = require('express');
const cors = require('cors');
const { HttpError } = require('./utils/errors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, servicio: 'postulantes-v2', fase: 'P1' });
});

app.use('/api', require('./routes/index'));

// 404 JSON (ruta desconocida)
app.use((req, res, next) => next(new HttpError(404, 'Ruta no encontrada')));

// Manejo central de errores: todo error sale como { error }.
// Los errores con status (HttpError) se muestran tal cual; los inesperados (500)
// se registran en consola y NO filtran el detalle interno al cliente.
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const status = Number(err && err.status) || 500;
  if (status >= 500) {
    console.error('[error]', err);
    return res.status(status).json({ error: 'Error interno del servidor' });
  }
  return res.status(status).json({ error: err.message || 'Error' });
});

module.exports = app;
