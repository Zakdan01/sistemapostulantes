// Modelo de inscripciones voluntarias del postulante: SOLO SQL.
// Registra si un postulante acepta (true) o rechaza (false) participar en una convocatoria.
const { pool } = require('../config/db');

async function buscar(personaId, convocatoriaId) {
  const { rows } = await pool.query(
    `SELECT persona_id, convocatoria_id, aceptado, fecha
     FROM inscripciones_postulante
     WHERE persona_id = $1 AND convocatoria_id = $2`,
    [personaId, convocatoriaId]
  );
  return rows[0] || null;
}

async function upsert(personaId, convocatoriaId, aceptado) {
  const { rows } = await pool.query(
    `INSERT INTO inscripciones_postulante (persona_id, convocatoria_id, aceptado, fecha)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (persona_id, convocatoria_id)
     DO UPDATE SET aceptado = EXCLUDED.aceptado, fecha = now()
     RETURNING persona_id, convocatoria_id, aceptado, fecha`,
    [personaId, convocatoriaId, aceptado]
  );
  return rows[0];
}

async function porConvocatoria(convocatoriaId) {
  const { rows } = await pool.query(
    `SELECT persona_id, aceptado
     FROM inscripciones_postulante
     WHERE convocatoria_id = $1`,
    [convocatoriaId]
  );
  const mapa = {};
  for (const r of rows) mapa[r.persona_id] = r.aceptado;
  return mapa;
}

async function porPersona(personaId) {
  const { rows } = await pool.query(
    `SELECT convocatoria_id, aceptado
     FROM inscripciones_postulante
     WHERE persona_id = $1`,
    [personaId]
  );
  const mapa = {};
  for (const r of rows) mapa[r.convocatoria_id] = r.aceptado;
  return mapa;
}

module.exports = { buscar, upsert, porConvocatoria, porPersona };
