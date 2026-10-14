const { pool, conTransaccion } = require('../config/db');
const Persona = require('../models/persona.model');
const Config = require('../models/config.model');
const { calcularKpi } = require('../services/kpi');
const { HttpError } = require('../utils/errors');
const { parsearFiltros, listaHabilidades, listaExperiencias, listaFormaciones } = require('../utils/validar');

function conKpi(fila, cfg) {
  const conteo = {
    total_eventos: fila.total_eventos, total_experiencias: fila.total_experiencias,
    total_formaciones: fila.total_formaciones, total_habilidades: fila.total_habilidades,
    anios_max: fila.anios_max, nivel_alto: fila.nivel_alto, actuales: fila.actuales
  };
  const { kpi, clasificacion, cumple } = calcularKpi(conteo, cfg);
  const { coincidencias, ...resto } = fila;
  return { ...resto, kpi, clasificacion, cumple };
}

async function listar(req, res) {
  const { tecs, modo, anios_min, tipo_trabajo, nivel } = parsearFiltros(req.query);
  const cfg = await Config.obtenerConfig();
  const filas = await Persona.listar({ tecs, modo, anios_min, tipo_trabajo, nivel });
  const out = filas.map((f) => conKpi(f, cfg)).sort((a, b) => b.kpi - a.kpi || a.id - b.id);
  res.json({ total: out.length, filtro: { tecs, modo, anios_min, tipo_trabajo, nivel }, resultados: out });
}

async function detalle(req, res) {
  const id = Number(req.params.id);
  if (req.usuario.rol === 'reclutador') {
    const chk = await pool.query(
      `SELECT 1 FROM postulaciones_convocatoria pc JOIN convocatorias c ON c.id=pc.convocatoria_id
       WHERE pc.persona_id=$1 AND c.creada_por=$2 LIMIT 1`, [id, req.usuario.id]);
    if (!chk.rows[0]) throw new HttpError(403, 'Solo puedes ver postulantes de tus convocatorias');
  }
  const det = await Persona.detalle(id);
  if (!det) throw new HttpError(404, 'Persona no encontrada');
  const cfg = await Config.obtenerConfig();
  const conteo = await Persona.conteoParaKpi(id);
  const { kpi, clasificacion, cumple } = calcularKpi(conteo, cfg);
  res.json({ ...det, kpi, clasificacion, cumple });
}

async function eventos(req, res) {
  const { rows } = await pool.query(
    `SELECT e.*, p.nombres, p.apellidos, p.correo FROM eventos_postulacion e
     JOIN personas p ON p.id=e.persona_id ORDER BY e.fecha DESC, e.id DESC LIMIT 100`);
  res.json(rows);
}

async function yo(req, res) {
  if (req.usuario.rol !== 'postulante') throw new HttpError(403, 'No tienes permiso');
  const r = await pool.query('SELECT id FROM personas WHERE usuario_id=$1', [req.usuario.id]);
  if (!r.rows[0]) throw new HttpError(404, 'Sin perfil de persona');
  const id = r.rows[0].id;
  const det = await Persona.detalle(id);
  const cfg = await Config.obtenerConfig();
  const conteo = await Persona.conteoParaKpi(id);
  const { kpi, clasificacion, cumple } = calcularKpi(conteo, cfg);
  res.json({ ...det, kpi, clasificacion, cumple });
}

async function actualizarYo(req, res) {
  // Postulante completa su perfil: contacto + CV (reemplazo en transacción)
  const r = await pool.query('SELECT id FROM personas WHERE usuario_id=$1', [req.usuario.id]);
  if (!r.rows[0]) throw new HttpError(404, 'Sin perfil de persona');
  const personaId = r.rows[0].id;
  if (req.body.nombres !== undefined && !String(req.body.nombres).trim()) {
    throw new HttpError(400, 'nombres es requerido');
  }
  const habilidades = req.body.habilidades !== undefined ? listaHabilidades(req.body) : null;
  const experiencias = req.body.experiencias !== undefined ? listaExperiencias(req.body) : null;
  const formaciones = req.body.formaciones !== undefined ? listaFormaciones(req.body) : null;
  await conTransaccion(async (conn) => {
    const sets = [];
    const vals = [personaId];
    for (const col of ['nombres', 'apellidos', 'telefono', 'direccion', 'linkedin', 'github', 'portafolio_url']) {
      if (req.body[col] !== undefined) {
        const raw = String(req.body[col]).trim();
        vals.push(raw ? raw.slice(0, 200) : (col === 'apellidos' ? '' : null));
        sets.push(`${col}=$${vals.length}`);
      }
    }
    if (sets.length) await conn.query(`UPDATE personas SET ${sets.join(', ')} WHERE id=$1`, vals);
    if (habilidades) await Persona.reemplazarHabilidades(conn, personaId, habilidades);
    if (experiencias) await Persona.reemplazarExperiencias(conn, personaId, experiencias);
    if (formaciones) await Persona.reemplazarFormaciones(conn, personaId, formaciones);
  });
  const det = await Persona.detalle(personaId);
  const cfg = await Config.obtenerConfig();
  const conteo = await Persona.conteoParaKpi(personaId);
  const { kpi, clasificacion, cumple } = calcularKpi(conteo, cfg);
  res.json({ ...det, kpi, clasificacion, cumple });
}

module.exports = { listar, detalle, eventos, yo, actualizarYo };
