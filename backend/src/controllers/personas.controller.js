const { pool, conTransaccion } = require('../config/db');
const Persona = require('../models/persona.model');
const Convocatoria = require('../models/convocatoria.model');
const Config = require('../models/config.model');
const Candidatos = require('../services/candidatos');
const { calcularKpi } = require('../services/kpi');
const { HttpError } = require('../utils/errors');
const {
  parsearFiltros, listaHabilidades, listaExperiencias, listaFormaciones, DISPONIBILIDADES
} = require('../utils/validar');

const COLUMNAS_PERFIL = ['nombres', 'apellidos', 'telefono', 'direccion', 'linkedin', 'github', 'portafolio_url'];

function conKpi(fila, cfg) {
  const conteo = {
    total_eventos: fila.total_eventos, total_experiencias: fila.total_experiencias,
    total_formaciones: fila.total_formaciones, total_habilidades: fila.total_habilidades,
    anios_max: fila.anios_max, nivel_alto: fila.nivel_alto, actuales: fila.actuales,
    actualizado_en: fila.actualizado_en
  };
  const { kpi, clasificacion, cumple } = calcularKpi(conteo, cfg);
  const { coincidencias, ...resto } = fila; // eslint-disable-line no-unused-vars
  return { ...resto, kpi, clasificacion, cumple };
}

async function listar(req, res) {
  const { tecs, modo, anios_min, tipo_trabajo, nivel } = parsearFiltros(req.query);
  const cfg = await Config.obtenerConfig();
  const filas = await Persona.listar({ tecs, modo, anios_min, tipo_trabajo, nivel });
  const out = filas.map((f) => conKpi(f, cfg)).sort((a, b) => b.kpi - a.kpi || a.id - b.id);
  res.json({ total: out.length, filtro: { tecs, modo, anios_min, tipo_trabajo, nivel }, resultados: out });
}

// ¿La persona esta en el pipeline del reclutador o en la lista viva de alguna de sus
// convocatorias? Se resuelve en una sola pasada sobre el padron.
async function visibleParaReclutador(personaId, duenioId) {
  const pipeline = await pool.query(
    `SELECT 1 FROM candidatos_convocatoria pc JOIN convocatorias c ON c.id=pc.convocatoria_id
     WHERE pc.persona_id=$1 AND c.creada_por=$2 LIMIT 1`, [personaId, duenioId]);
  if (pipeline.rows[0]) return true;

  const mias = await Convocatoria.listar(undefined, duenioId);
  if (!mias.length) return false;
  const reqs = await Convocatoria.requisitosDe(mias.map((c) => c.id));
  const listas = await Candidatos.calcularVarios(mias.map((c) => ({
    id: c.id,
    anios_min: c.anios_min,
    disponibilidad: c.disponibilidad,
    kpi_minimo: c.kpi_minimo,
    requisitos: reqs[c.id] || []
  })));
  return listas.some((r) => r.resultados.some((x) => x.persona_id === personaId));
}

async function detalle(req, res) {
  const id = Number(req.params.id);
  if (req.usuario.rol === 'reclutador' && !(await visibleParaReclutador(id, req.usuario.id))) {
    throw HttpError.forbidden('Solo puedes ver postulantes de tus convocatorias');
  }
  const det = await Persona.detalle(id);
  if (!det) throw HttpError.notFound('Persona no encontrada');
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
  if (req.usuario.rol !== 'postulante') throw HttpError.forbidden('No tienes permiso');
  const persona = await Persona.porUsuario(req.usuario.id);
  if (!persona) throw HttpError.notFound('Sin perfil de persona');
  const det = await Persona.detalle(persona.id);
  const cfg = await Config.obtenerConfig();
  const conteo = await Persona.conteoParaKpi(persona.id);
  const { kpi, clasificacion, cumple } = calcularKpi(conteo, cfg);
  res.json({ ...det, kpi, clasificacion, cumple });
}

async function actualizarYo(req, res) {
  // Postulante completa su perfil: contacto + CV (reemplazo en transacción).
  // La disponibilidad vive en personas: es lo que usa el KPI de convocatoria (+10 si coincide).
  const persona = await Persona.porUsuario(req.usuario.id);
  if (!persona) throw HttpError.notFound('Sin perfil de persona');
  const personaId = persona.id;
  if (req.body.nombres !== undefined && !String(req.body.nombres).trim()) {
    throw HttpError.badRequest('nombres es requerido');
  }
  if (req.body.disponibilidad !== undefined && req.body.disponibilidad !== null
    && !DISPONIBILIDADES.includes(req.body.disponibilidad)) {
    throw HttpError.badRequest('disponibilidad inválida');
  }
  const habilidades = req.body.habilidades !== undefined ? listaHabilidades(req.body) : null;
  const experiencias = req.body.experiencias !== undefined ? listaExperiencias(req.body) : null;
  const formaciones = req.body.formaciones !== undefined ? listaFormaciones(req.body) : null;

  await conTransaccion(async (conn) => {
    const sets = COLUMNAS_PERFIL
      .filter((col) => req.body[col] !== undefined)
      .map((col) => ({ col, valor: String(req.body[col]).trim() }));
    const vals = [personaId];
    const asignaciones = [];
    for (const { col, valor } of sets) {
      vals.push(valor ? valor.slice(0, 200) : (col === 'apellidos' ? '' : null));
      asignaciones.push(`${col}=$${vals.length}`);
    }
    if (req.body.disponibilidad !== undefined && req.body.disponibilidad !== null) {
      vals.push(req.body.disponibilidad);
      asignaciones.push(`disponibilidad=$${vals.length}`);
    }
    // todo cambio del perfil marca "actualidad" para el KPI de perfil
    asignaciones.push('actualizado_en=now()');
    await conn.query(`UPDATE personas SET ${asignaciones.join(', ')} WHERE id=$1`, vals);
    if (habilidades) await Persona.reemplazarHabilidades(conn, personaId, habilidades);
    if (experiencias) await Persona.reemplazarExperiencias(conn, personaId, experiencias);
    if (formaciones) await Persona.reemplazarFormaciones(conn, personaId, formaciones);
    await conn.query(
      'INSERT INTO eventos_postulacion (persona_id, fecha, hora, disponibilidad) VALUES ($1, CURRENT_DATE, CURRENT_TIME, $2)',
      [personaId, req.body.disponibilidad || null]
    );
  });

  Candidatos.invalidarPadron();
  const det = await Persona.detalle(personaId);
  const cfg = await Config.obtenerConfig();
  const conteo = await Persona.conteoParaKpi(personaId);
  const { kpi, clasificacion, cumple } = calcularKpi(conteo, cfg);
  res.json({ ...det, kpi, clasificacion, cumple });
}

module.exports = { listar, detalle, eventos, yo, actualizarYo };
