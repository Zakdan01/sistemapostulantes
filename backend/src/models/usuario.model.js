const { pool } = require('../config/db');

async function buscarPorCorreo(correo) {
  const { rows } = await pool.query('SELECT * FROM usuarios WHERE correo=$1', [correo]);
  return rows[0] || null;
}

async function buscarPorId(id) {
  const { rows } = await pool.query('SELECT * FROM usuarios WHERE id=$1', [id]);
  return rows[0] || null;
}

async function crear(conn, { correo, password_hash, rol, estado_cuenta }) {
  const q = 'INSERT INTO usuarios (correo, password_hash, rol, estado_cuenta) VALUES ($1,$2,$3,$4) RETURNING id, correo, rol, estado_cuenta';
  const vals = [correo, password_hash, rol || 'postulante', estado_cuenta || 'pendiente'];
  const r = conn.query ? await conn.query(q, vals) : await pool.query(q, vals);
  return r.rows[0];
}

async function listar(estado) {
  const q = estado
    ? 'SELECT id, correo, rol, estado_cuenta, creado_en FROM usuarios WHERE estado_cuenta=$1 ORDER BY id'
    : 'SELECT id, correo, rol, estado_cuenta, creado_en FROM usuarios ORDER BY id';
  const { rows } = await pool.query(q, estado ? [estado] : []);
  return rows;
}

async function cambiarEstado(id, estado) {
  const { rows } = await pool.query(
    "UPDATE usuarios SET estado_cuenta=$1 WHERE id=$2 AND estado_cuenta='pendiente' RETURNING id, correo, rol, estado_cuenta",
    [estado, id]
  );
  return rows[0] || null;
}

async function eliminarConPersona(id) {
  const { pool: p, conTransaccion } = require('../config/db');
  return conTransaccion(async (conn) => {
    await conn.query('DELETE FROM personas WHERE usuario_id=$1', [id]);
    const { rowCount } = await conn.query('DELETE FROM usuarios WHERE id=$1', [id]);
    return rowCount > 0;
  });
}

module.exports = { buscarPorCorreo, buscarPorId, crear, listar, cambiarEstado, eliminarConPersona };
