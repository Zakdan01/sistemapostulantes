const { pool } = require('../config/db');

async function obtenerConfig() {
  const { rows } = await pool.query('SELECT clave, valor FROM configuracion_kpi');
  const cfg = {};
  for (const r of rows) cfg[r.clave] = Number(r.valor);
  return cfg;
}

async function actualizarConfig(cambios) {
  const actual = await obtenerConfig();
  const permitido = ['peso_experiencia', 'peso_formacion', 'peso_tecnologias', 'peso_nivel', 'peso_actualidad', 'umbral_alto', 'umbral_medio', 'anios_referencia',
    'mult_obligatorio', 'mult_deseable', 'peso_exp_afin', 'tope_anios_req'];
  const merged = { ...actual };
  for (const [k, v] of Object.entries(cambios)) {
    if (!permitido.includes(k)) {
      const e = new Error(`clave desconocida: ${k}`);
      e.status = 400;
      throw e;
    }
    if (typeof v !== 'number' || v < 0) {
      const e = new Error(`valor inválido para ${k}`);
      e.status = 400;
      throw e;
    }
    merged[k] = v;
  }
  const suma = ['peso_experiencia', 'peso_formacion', 'peso_tecnologias', 'peso_nivel', 'peso_actualidad']
    .reduce((a, k) => a + Number(merged[k] || 0), 0);
  if (suma !== 100) {
    const e = new Error('Los cinco pesos deben sumar 100');
    e.status = 400;
    throw e;
  }
  if (Number(merged.umbral_medio) > Number(merged.umbral_alto)) {
    const e = new Error('umbral_medio debe ser <= umbral_alto');
    e.status = 400;
    throw e;
  }
  for (const [k, v] of Object.entries(cambios)) {
    await pool.query(
      'INSERT INTO configuracion_kpi (clave, valor) VALUES ($1,$2) ON CONFLICT (clave) DO UPDATE SET valor=EXCLUDED.valor',
      [k, v]
    );
  }
  return obtenerConfig();
}

module.exports = { obtenerConfig, actualizarConfig };
