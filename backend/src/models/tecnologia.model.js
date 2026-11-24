const { pool, conTransaccion } = require('../config/db');

async function catalogo() {
  const { rows } = await pool.query(
    `SELECT t.id, t.nombre, c.nombre AS categoria FROM tecnologias t
     LEFT JOIN catalogo_categoria_tecnologia c ON c.id=t.categoria_id ORDER BY t.nombre`);
  return rows;
}

// Listar tecnologias para administracion, incluyendo estadisticas de uso
async function listarAdmin() {
  const { rows } = await pool.query(`
    SELECT t.id, t.nombre, c.nombre AS categoria, t.categoria_id,
           (SELECT COUNT(*)::int FROM habilidades_postulante hp WHERE hp.tecnologia_id = t.id) AS total_postulantes,
           (SELECT COUNT(*)::int FROM convocatorias_requisitos cr WHERE cr.tecnologia_id = t.id) AS total_convocatorias
    FROM tecnologias t
    LEFT JOIN catalogo_categoria_tecnologia c ON c.id = t.categoria_id
    ORDER BY t.nombre ASC
  `);
  return rows;
}

async function porId(id) {
  const { rows } = await pool.query(
    `SELECT t.id, t.nombre, c.nombre AS categoria, t.categoria_id
     FROM tecnologias t
     LEFT JOIN catalogo_categoria_tecnologia c ON c.id = t.categoria_id
     WHERE t.id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function crear({ nombre, categoria_id, categoria }) {
  let catId = categoria_id;
  if (!catId && categoria) {
    const c = await pool.query('SELECT id FROM catalogo_categoria_tecnologia WHERE nombre = $1', [categoria]);
    catId = c.rows[0] ? c.rows[0].id : null;
  }
  if (!catId) {
    const c = await pool.query("SELECT id FROM catalogo_categoria_tecnologia WHERE nombre = 'otro'");
    catId = c.rows[0] ? c.rows[0].id : null;
  }
  const { rows } = await pool.query(
    'INSERT INTO tecnologias (nombre, categoria_id) VALUES ($1, $2) RETURNING id, nombre, categoria_id',
    [nombre.trim().toLowerCase(), catId]
  );
  return rows[0];
}

async function actualizar(id, { nombre, categoria_id, categoria }) {
  let catId = categoria_id;
  if (!catId && categoria) {
    const c = await pool.query('SELECT id FROM catalogo_categoria_tecnologia WHERE nombre = $1', [categoria]);
    catId = c.rows[0] ? c.rows[0].id : null;
  }

  const updates = [];
  const params = [id];
  let idx = 2;

  if (nombre !== undefined) {
    updates.push(`nombre = $${idx++}`);
    params.push(nombre.trim().toLowerCase());
  }
  if (catId !== undefined && catId !== null) {
    updates.push(`categoria_id = $${idx++}`);
    params.push(catId);
  }

  if (updates.length === 0) return porId(id);

  await pool.query(
    `UPDATE tecnologias SET ${updates.join(', ')} WHERE id = $1`,
    params
  );
  return porId(id);
}

async function eliminar(id) {
  return conTransaccion(async (client) => {
    // Elimina de forma limpia las referencias en postulantes y convocatorias
    await client.query('DELETE FROM habilidades_postulante WHERE tecnologia_id = $1', [id]);
    await client.query('DELETE FROM convocatorias_requisitos WHERE tecnologia_id = $1', [id]);
    const { rowCount } = await client.query('DELETE FROM tecnologias WHERE id = $1', [id]);
    return rowCount > 0;
  });
}

// Todos los catalogos que viven en la BD, en una sola vuelta.
async function catalogos() {
  const [tec, niv, tipos, cat, inst, nivf] = await Promise.all([
    pool.query(`SELECT t.id, t.nombre, c.nombre AS categoria FROM tecnologias t
      LEFT JOIN catalogo_categoria_tecnologia c ON c.id=t.categoria_id ORDER BY t.nombre`),
    pool.query('SELECT nombre FROM catalogo_nivel_tecnologia'),
    pool.query('SELECT nombre FROM catalogo_tipo_trabajo ORDER BY nombre'),
    pool.query('SELECT id, nombre FROM catalogo_categoria_tecnologia ORDER BY nombre'),
    pool.query('SELECT nombre FROM catalogo_instituciones ORDER BY nombre'),
    pool.query('SELECT nombre FROM catalogo_nivel_formacion ORDER BY nombre')
  ]);
  return {
    tecnologias: tec.rows.map((t) => t.nombre),
    niveles: niv.rows.map((r) => r.nombre),
    tipos_trabajo: tipos.rows.map((r) => r.nombre),
    categorias: cat.rows.map((r) => r.nombre),
    detalle_categorias: cat.rows,
    instituciones: inst.rows.map((r) => r.nombre),
    niveles_formacion: nivf.rows.map((r) => r.nombre),
    detalle_tecnologias: tec.rows
  };
}

module.exports = { catalogo, catalogos, listarAdmin, porId, crear, actualizar, eliminar };
