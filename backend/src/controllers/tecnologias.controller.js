const Tecnologia = require('../models/tecnologia.model');
const { pool } = require('../config/db');
const { DISPONIBILIDADES } = require('../utils/validar');

async function listar(req, res) {
  res.json(await Tecnologia.catalogo());
}

async function catalogos(req, res) {
  const [tec, niv, tipos, resp, inst, nivf] = await Promise.all([
    pool.query(`SELECT t.id, t.nombre, c.nombre AS categoria FROM tecnologias t
      LEFT JOIN catalogo_categoria_tecnologia c ON c.id=t.categoria_id ORDER BY t.nombre`),
    pool.query('SELECT nombre FROM catalogo_nivel_tecnologia'),
    pool.query('SELECT nombre FROM catalogo_tipo_trabajo ORDER BY nombre'),
    pool.query('SELECT nombre FROM catalogo_categoria_tecnologia ORDER BY nombre'),
    pool.query('SELECT nombre FROM catalogo_instituciones ORDER BY nombre'),
    pool.query('SELECT nombre FROM catalogo_nivel_formacion ORDER BY nombre')
  ]);
  res.json({
    tecnologias: tec.rows.map((t) => t.nombre),
    niveles: niv.rows.map((r) => r.nombre),
    tipos_trabajo: tipos.rows.map((r) => r.nombre),
    categorias: resp.rows.map((r) => r.nombre),
    instituciones: inst.rows.map((r) => r.nombre),
    niveles_formacion: nivf.rows.map((r) => r.nombre),
    detalle_tecnologias: tec.rows,
    disponibilidades: DISPONIBILIDADES
  });
}

module.exports = { listar, catalogos };
