const { pool } = require('../config/db');

async function catalogo() {
  const { rows } = await pool.query(
    `SELECT t.id, t.nombre, c.nombre AS categoria FROM tecnologias t
     LEFT JOIN catalogo_categoria_tecnologia c ON c.id=t.categoria_id ORDER BY t.nombre`);
  return rows;
}

// Todos los catalogos que viven en la BD, en una sola vuelta.
async function catalogos() {
  const [tec, niv, tipos, cat, inst, nivf] = await Promise.all([
    pool.query(`SELECT t.id, t.nombre, c.nombre AS categoria FROM tecnologias t
      LEFT JOIN catalogo_categoria_tecnologia c ON c.id=t.categoria_id ORDER BY t.nombre`),
    pool.query('SELECT nombre FROM catalogo_nivel_tecnologia'),
    pool.query('SELECT nombre FROM catalogo_tipo_trabajo ORDER BY nombre'),
    pool.query('SELECT nombre FROM catalogo_categoria_tecnologia ORDER BY nombre'),
    pool.query('SELECT nombre FROM catalogo_instituciones ORDER BY nombre'),
    pool.query('SELECT nombre FROM catalogo_nivel_formacion ORDER BY nombre')
  ]);
  return {
    tecnologias: tec.rows.map((t) => t.nombre),
    niveles: niv.rows.map((r) => r.nombre),
    tipos_trabajo: tipos.rows.map((r) => r.nombre),
    categorias: cat.rows.map((r) => r.nombre),
    instituciones: inst.rows.map((r) => r.nombre),
    niveles_formacion: nivf.rows.map((r) => r.nombre),
    detalle_tecnologias: tec.rows
  };
}

module.exports = { catalogo, catalogos };
