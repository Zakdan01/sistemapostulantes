const { pool } = require('../config/db');

async function catalogo() {
  const { rows } = await pool.query(
    `SELECT t.id, t.nombre, c.nombre AS categoria FROM tecnologias t
     LEFT JOIN catalogo_categoria_tecnologia c ON c.id=t.categoria_id ORDER BY t.nombre`);
  return rows;
}

module.exports = { catalogo };
