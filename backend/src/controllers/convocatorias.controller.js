const { pool, conTransaccion } = require('../config/db');
const Convocatoria = require('../models/convocatoria.model');
const Persona = require('../models/persona.model');
const Config = require('../models/config.model');
const { calcularKpi } = require('../services/kpi');
const { calcularKpiConvocatoria } = require('../services/kpiConvocatoria');
const { HttpError } = require('../utils/errors');
const { listaHabilidades, listaExperiencias, listaFormaciones, DISPONIBILIDADES } = require('../utils/validar');

const ESTADOS = ['postulado', 'preseleccionado', 'descartado', 'contratado'];

async function crear(req, res) {
  const { titulo, anios_min, requisitos, disponibilidad } = req.body;
  if (!titulo || !String(titulo).trim()) throw new HttpError(400, 'titulo es requerido');
  if (anios_min !== undefined && (Number.isNaN(Number(anios_min)) || Number(anios_min) < 0)) {
    throw new HttpError(400, 'anios_min inválido');
  }
  if (disponibilidad !== undefined && disponibilidad !== null && !DISPONIBILIDADES.includes(disponibilidad)) {
    throw new HttpError(400, 'disponibilidad inválida');
  }
  if (requisitos !== undefined && !Array.isArray(requisitos)) throw new HttpError(400, 'requisitos debe ser arreglo');
  const v = await Convocatoria.crear({
    titulo: String(titulo).slice(0, 120),
    descripcion: req.body.descripcion,
    anios_min: req.body.anios_min === undefined ? 0 : Number(req.body.anios_min),
    disponibilidad: req.body.disponibilidad || null,
    requisitos: requisitos || [],
    creada_por: req.usuario.id
  });
  res.status(201).json(v);
}

async function listar(req, res) {
  const ESTADOS_LISTA = ['pendiente', 'abierta', 'cerrada', 'rechazada'];
  let estado = req.query.estado ? String(req.query.estado) : undefined;
  if (estado && !ESTADOS_LISTA.includes(estado)) throw new HttpError(400, 'estado inválido');
  if (req.usuario.rol === 'postulante') estado = 'abierta'; // el postulante solo ve publicadas
  const duenioId = req.usuario.rol === 'reclutador' ? req.usuario.id : undefined;
  res.json(await Convocatoria.listar(estado, duenioId));
}

function exigirDueno(req, creadaPor) {
  if (req.usuario.rol === 'reclutador' && creadaPor !== req.usuario.id) {
    throw new HttpError(403, 'Solo puedes gestionar tus propias convocatorias');
  }
}

async function detalle(req, res) {
  const v = await Convocatoria.detalle(Number(req.params.id));
  if (!v) throw new HttpError(404, 'Convocatoria no encontrada');
  exigirDueno(req, v.creada_por);
  res.json(v);
}

async function cerrar(req, res) {
  const v = await Convocatoria.detalle(Number(req.params.id));
  if (!v) throw new HttpError(404, 'Convocatoria no encontrada');
  exigirDueno(req, v.creada_por);
  res.json(await Convocatoria.cerrar(v.id));
}

async function aprobar(req, res) {
  const { rows } = await pool.query(
    "UPDATE convocatorias SET estado='abierta' WHERE id=$1 AND estado='pendiente' RETURNING *",
    [Number(req.params.id)]
  );
  if (!rows[0]) throw new HttpError(409, 'Solo se puede aprobar una convocatoria pendiente');
  res.json(rows[0]);
}

async function rechazar(req, res) {
  const { rows } = await pool.query(
    "UPDATE convocatorias SET estado='rechazada' WHERE id=$1 AND estado='pendiente' RETURNING *",
    [Number(req.params.id)]
  );
  if (!rows[0]) throw new HttpError(409, 'Solo se puede rechazar una convocatoria pendiente');
  res.json(rows[0]);
}

async function eliminar(req, res) {
  const ok = await Convocatoria.eliminar(Number(req.params.id));
  if (!ok) throw new HttpError(404, 'Convocatoria no encontrada');
  res.json({ mensaje: 'Convocatoria eliminada' });
}

async function ranking(req, res) {
  const r = await Convocatoria.ranking(Number(req.params.id));
  if (!r) throw new HttpError(404, 'Convocatoria no encontrada');
  exigirDueno(req, r.convocatoria.creada_por);
  res.json(r);
}

async function postular(req, res) {
  const convocatoriaId = Number(req.params.id);
  const conv = await Convocatoria.detalle(convocatoriaId);
  if (!conv) throw new HttpError(404, 'Convocatoria no encontrada');
  if (conv.estado !== 'abierta') throw new HttpError(409, 'Convocatoria no abierta (pendiente, cerrada o rechazada)');
  // postulante postula su propia persona; admin/reclutador puede indicar persona_id
  let personaId = null;
  if (req.usuario.rol === 'postulante') {
    const r = await pool.query('SELECT id FROM personas WHERE usuario_id=$1', [req.usuario.id]);
    if (!r.rows[0]) throw new HttpError(400, 'Tu usuario no tiene perfil de persona');
    personaId = r.rows[0].id;
  } else {
    personaId = Number(req.body.persona_id);
    if (!personaId) throw new HttpError(400, 'persona_id es requerido');
  }
  // Formulario CV completo: si vienen habilidades/experiencias/formaciones, actualizan el CV en transacción
  const disp = req.body.disponibilidad || 'Inmediata';
  if (!DISPONIBILIDADES.includes(disp)) throw new HttpError(400, 'disponibilidad inválida');
  const nuevasHab = req.body.habilidades !== undefined ? listaHabilidades(req.body) : null;
  const nuevasExp = req.body.experiencias !== undefined ? listaExperiencias(req.body) : null;
  const nuevasForm = req.body.formaciones !== undefined ? listaFormaciones(req.body) : null;
  const nuevosNombres = req.body.nombres !== undefined ? String(req.body.nombres).trim().slice(0, 100) : null;
  const nuevosApellidos = req.body.apellidos !== undefined ? String(req.body.apellidos).trim().slice(0, 100) : null;
  if (nuevosNombres !== null && !nuevosNombres) throw new HttpError(400, 'nombres es requerido');
  if (nuevasHab || nuevasExp || nuevasForm || nuevosNombres !== null || nuevosApellidos !== null) {
    await conTransaccion(async (conn) => {
      if (nuevosNombres !== null || nuevosApellidos !== null) {
        const sets = [];
        const vals = [personaId];
        if (nuevosNombres !== null) { vals.push(nuevosNombres); sets.push(`nombres=$${vals.length}`); }
        if (nuevosApellidos !== null) { vals.push(nuevosApellidos); sets.push(`apellidos=$${vals.length}`); }
        await conn.query(`UPDATE personas SET ${sets.join(', ')} WHERE id=$1`, vals);
      }
      if (['telefono', 'direccion', 'linkedin', 'github', 'portafolio_url'].some((k) => req.body[k] !== undefined)) {
        const sets = [];
        const vals = [personaId];
        for (const col of ['telefono', 'direccion', 'linkedin', 'github', 'portafolio_url']) {
          if (req.body[col] !== undefined) {
            vals.push(req.body[col] ? String(req.body[col]).slice(0, 200) : null);
            sets.push(`${col}=$${vals.length}`);
          }
        }
        if (sets.length) await conn.query(`UPDATE personas SET ${sets.join(', ')} WHERE id=$1`, vals);
      }
      if (nuevasHab) await Persona.reemplazarHabilidades(conn, personaId, nuevasHab);
      if (nuevasExp) await Persona.reemplazarExperiencias(conn, personaId, nuevasExp);
      if (nuevasForm) await Persona.reemplazarFormaciones(conn, personaId, nuevasForm);
      await conn.query(
        'INSERT INTO eventos_postulacion (persona_id, fecha, hora, disponibilidad) VALUES ($1, CURRENT_DATE, CURRENT_TIME, $2)',
        [personaId, disp]
      );
    });
  }
  const p = await Persona.detalle(personaId);
  if (!p) throw new HttpError(404, 'Persona no encontrada');
  const dup = await pool.query('SELECT id FROM postulaciones_convocatoria WHERE convocatoria_id=$1 AND persona_id=$2', [convocatoriaId, personaId]);
  if (dup.rows[0]) throw new HttpError(409, 'Ya postulado a esta convocatoria');
  const cfg = await Config.obtenerConfig();
  const conteo = await Persona.conteoParaKpi(personaId);
  const { kpi } = calcularKpi(conteo, cfg);
  const oblig = conv.requisitos.filter((r) => r.obligatorio).map((r) => r.nombre.toLowerCase());
  const sabe = new Set(p.habilidades.map((h) => String(h.nombre).toLowerCase()));
  const match = oblig.length ? (oblig.filter((o) => sabe.has(o)).length / oblig.length) * 100 : 100;
  const kc = calcularKpiConvocatoria({
    requisitos: conv.requisitos,
    habilidades: p.habilidades,
    experiencias: p.experiencias,
    dispPersona: p.eventos && p.eventos[0] ? p.eventos[0].disponibilidad : null,
    anios_min: conv.anios_min, disponibilidad: conv.disponibilidad, cfg
  });
  const ev = p.eventos && p.eventos[0] ? p.eventos[0].id : null;
  const r = await pool.query(
    `INSERT INTO postulaciones_convocatoria (convocatoria_id, persona_id, evento_id, kpi_al_postular, match_pct, kpi_perfil)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [convocatoriaId, personaId, ev, Math.round(kc.kpi_conv), Math.round(match * 100) / 100, kpi]
  );
  const row = r.rows[0];
  row.kpi_al_postular = Number(row.kpi_al_postular);
  row.match_pct = Number(row.match_pct);
  row.kpi_perfil = row.kpi_perfil === null ? null : Number(row.kpi_perfil);
  res.status(201).json(row);
}

async function cambiarEstado(req, res) {
  const estado = String(req.body.estado || '');
  if (!ESTADOS.includes(estado)) throw new HttpError(400, 'estado inválido (postulado|preseleccionado|descartado|contratado)');
  const id = Number(req.params.id);
  if (req.usuario.rol === 'reclutador') {
    const chk = await pool.query(
      `SELECT c.creada_por FROM postulaciones_convocatoria pc JOIN convocatorias c ON c.id=pc.convocatoria_id WHERE pc.id=$1`, [id]);
    if (!chk.rows[0]) throw new HttpError(404, 'Postulación no encontrada');
    exigirDueno(req, chk.rows[0].creada_por);
  }
  const { rows } = await pool.query('UPDATE postulaciones_convocatoria SET estado=$1 WHERE id=$2 RETURNING *', [estado, id]);
  if (!rows[0]) throw new HttpError(404, 'Postulación no encontrada');
  res.json(rows[0]);
}

async function misPostulaciones(req, res) {
  // Postulante: solo las suyas. Admin/reclutador: ?persona_id=
  let personaId = null;
  if (req.usuario.rol === 'postulante') {
    const r = await pool.query('SELECT id FROM personas WHERE usuario_id=$1', [req.usuario.id]);
    if (!r.rows[0]) return res.json([]);
    personaId = r.rows[0].id;
  } else {
    personaId = Number(req.query.persona_id);
    if (!personaId) throw new HttpError(400, 'persona_id es requerido');
  }
  const { rows } = await pool.query(
    `SELECT pc.*, c.titulo AS convocatoria_titulo, c.estado AS convocatoria_estado
     FROM postulaciones_convocatoria pc JOIN convocatorias c ON c.id=pc.convocatoria_id
     WHERE pc.persona_id=$1 ORDER BY pc.id DESC`, [personaId]);
  res.json(rows.map((r) => ({ ...r, kpi_al_postular: r.kpi_al_postular === null ? null : Number(r.kpi_al_postular), match_pct: r.match_pct === null ? null : Number(r.match_pct), kpi_perfil: r.kpi_perfil === null || r.kpi_perfil === undefined ? null : Number(r.kpi_perfil) })));
}

async function resumen(req, res) {
  const duenioId = req.usuario.rol === 'reclutador' ? req.usuario.id : undefined;
  res.json(await Convocatoria.resumen(duenioId));
}

async function cola(req, res) {
  const { estado, convocatoria_id } = req.query;
  if (estado && ![...ESTADOS].includes(String(estado))) throw new HttpError(400, 'estado inválido');
  res.json(await Convocatoria.cola({
    estado: estado ? String(estado) : undefined,
    convocatoria_id: convocatoria_id ? Number(convocatoria_id) : undefined,
    duenioId: req.usuario.rol === 'reclutador' ? req.usuario.id : undefined
  }));
}

module.exports = { crear, listar, detalle, cerrar, eliminar, aprobar, rechazar, ranking, postular, cambiarEstado, misPostulaciones, resumen, cola };
