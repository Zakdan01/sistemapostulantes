const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, servicio: 'postulantes-v2', fase: 'P1' });
});

app.use('/api', require('./routes/index'));

// 404 JSON
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Manejo central errores
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Error interno' });
});

module.exports = app;
