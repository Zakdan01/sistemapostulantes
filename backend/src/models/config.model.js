const { pool } = require('../config/db');
const { HttpError } = require('../utils/errors');
const { CLAVES_CONFIG_KPI, PESOS_PERFIL } = require('../domain/catalogos');

// La configuracion del KPI se lee en CADA calculo (ranking, perfiles, resumenes).
// Se cachea unos segundos y se invalida al guardar un cambio.
const TTL_MS = 30 * 1000;
let cache = { ts: 0, datos: null };

function invalidarConfig() {
  cache = { ts: 0, datos: null };
}

async function leer() {
  const { rows } = await pool.query('SELECT clave, valor FROM configuracion_kpi');
  const cfg = {};
  for (const r of rows) cfg[r.clave] = Number(r.valor);
  return cfg;
}

async function obtenerConfig() {
  if (cache.datos && Date.now() - cache.ts < TTL_MS) return cache.datos;
  const datos = await leer();
  cache = { ts: Date.now(), datos };
  return datos;
}

async function actualizarConfig(cambios) {
  const actual = await obtenerConfig();
  const merged = { ...actual };
  for (const [k, v] of Object.entries(cambios)) {
    if (!CLAVES_CONFIG_KPI.includes(k)) throw HttpError.badRequest(`clave desconocida: ${k}`);
    if (typeof v !== 'number' || v < 0) throw HttpError.badRequest(`valor inválido para ${k}`);
    merged[k] = v;
  }
  const suma = PESOS_PERFIL.reduce((a, k) => a + Number(merged[k] || 0), 0);
  if (suma !== 100) throw HttpError.badRequest('Los cinco pesos deben sumar 100');
  if (Number(merged.umbral_medio) > Number(merged.umbral_alto)) {
    throw HttpError.badRequest('umbral_medio debe ser <= umbral_alto');
  }
  for (const [k, v] of Object.entries(cambios)) {
    await pool.query(
      'INSERT INTO configuracion_kpi (clave, valor) VALUES ($1,$2) ON CONFLICT (clave) DO UPDATE SET valor=EXCLUDED.valor',
      [k, v]
    );
  }
  invalidarConfig();
  return obtenerConfig();
}

module.exports = { obtenerConfig, actualizarConfig, invalidarConfig };
