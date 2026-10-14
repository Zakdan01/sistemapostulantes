const { pool } = require('../config/db');
const Persona = require('./persona.model');
const Config = require('./config.model');
const { calcularKpi } = require('../services/kpi');
const { calcularKpiConvocatoria } = require('../services/kpiConvocatoria');
const { normTec } = require('../utils/validar');

async function crear({ titulo, descripcion, anios_min, disponibilidad, requisitos, creada_por }) {
  const r = await pool.query(
    `INSERT INTO convocatorias (titulo, descripcion, anios_min, disponibilidad, creada_por)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [titulo, descripcion || null, anios_min || 0, disponibilidad || null, creada_por || null]
  );
  const conv = r.rows[0];
  await reemplazarRequisitos(conv.id, requisitos || []);
  return detalle(conv.id);
}

async function reemplazarRequisitos(convocatoriaId, requisitos) {
  // requisitos: [{tecnologia_id} | {nombre, categoria}, obligatorio, nivel_minimo?]
  // nivel_minimo: nombre|id de catálogo (default 'basico'); se valida, 400 si no existe
  await pool.query('DELETE FROM convocatorias_requisitos WHERE convocatoria_id=$1', [convocatoriaId]);
  const vistos = new Set();
  for (const req of requisitos) {
    let tecId = req.tecnologia_id || null;
    if (!tecId) {
      const nombre = normTec(req.nombre || req.tecnologia);
      if (!nombre) continue;
      if (vistos.has(nombre)) continue;
      vistos.add(nombre);
      let t = await pool.query('SELECT id FROM tecnologias WHERE nombre=$1', [nombre]);
      if (!t.rows[0]) {
        let catId = null;
        if (req.categoria) {
          const c = await pool.query('SELECT id FROM catalogo_categoria_tecnologia WHERE nombre=$1', [String(req.categoria).toLowerCase()]);
          catId = c.rows[0] ? c.rows[0].id : null;
        }
        if (!catId) {
          const c = await pool.query("SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='otro'");
          catId = c.rows[0] ? c.rows[0].id : null;
        }
        t = await pool.query('INSERT INTO tecnologias (nombre, categoria_id) VALUES ($1,$2) RETURNING id', [nombre, catId]);
      }
      tecId = t.rows[0].id;
    } else {
      if (vistos.has(`i:${tecId}`)) continue;
      vistos.add(`i:${tecId}`);
      const t = await pool.query('SELECT id FROM tecnologias WHERE id=$1', [tecId]);
      if (!t.rows[0]) continue;
    }
    let nivelMinId = null;
    if (req.nivel_minimo !== undefined && req.nivel_minimo !== null && req.nivel_minimo !== '') {
      const isNum = Number.isInteger(Number(req.nivel_minimo)) && String(req.nivel_minimo).trim() !== '';
      const rn = isNum
        ? await pool.query('SELECT id FROM catalogo_nivel_tecnologia WHERE id=$1', [Number(req.nivel_minimo)])
        : await pool.query('SELECT id FROM catalogo_nivel_tecnologia WHERE nombre=$1', [String(req.nivel_minimo).trim().toLowerCase()]);
      if (!rn.rows[0]) {
        const e = new Error(`nivel_minimo inválido: ${req.nivel_minimo}`);
        e.status = 400;
        throw e;
      }
      nivelMinId = rn.rows[0].id;
    } else {
      const rd = await pool.query("SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='basico'");
      nivelMinId = rd.rows[0] ? rd.rows[0].id : null;
    }
    await pool.query(
      'INSERT INTO convocatorias_requisitos (convocatoria_id, tecnologia_id, obligatorio, nivel_minimo) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',
      [convocatoriaId, tecId, req.obligatorio === undefined ? true : !!req.obligatorio, nivelMinId]
    );
  }
}

async function listar(estado, duenioId) {
  const conds = [];
  const params = [];
  if (estado) {
    params.push(estado);
    conds.push(`c.estado=$${params.length}`);
  }
  if (duenioId) {
    params.push(duenioId);
    conds.push(`c.creada_por=$${params.length}`);
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const q = `SELECT c.*, u.correo AS creada_por_correo,
        (SELECT COUNT(*) FROM postulaciones_convocatoria pc WHERE pc.convocatoria_id=c.id) AS total_postulados,
        (SELECT STRING_AGG(t.nombre || CASE WHEN cr.obligatorio THEN ' ★' ELSE ' ○' END || COALESCE('≥' || nt.nombre, ''), ', ' ORDER BY t.nombre)
         FROM convocatorias_requisitos cr JOIN tecnologias t ON t.id=cr.tecnologia_id LEFT JOIN catalogo_nivel_tecnologia nt ON nt.id=cr.nivel_minimo WHERE cr.convocatoria_id=c.id) AS requisitos
       FROM convocatorias c LEFT JOIN usuarios u ON u.id=c.creada_por
       ${where} ORDER BY c.id DESC`;
  const { rows } = await pool.query(q, params);
  return rows.map((r) => ({ ...r, total_postulados: Number(r.total_postulados) }));
}

async function detalle(id) {
  const { rows } = await pool.query('SELECT * FROM convocatorias WHERE id=$1', [id]);
  const v = rows[0];
  if (!v) return null;
  const req = await pool.query(
    `SELECT t.id AS tecnologia_id, t.nombre, cr.obligatorio, nt.nombre AS nivel_minimo
     FROM convocatorias_requisitos cr
     JOIN tecnologias t ON t.id=cr.tecnologia_id
     LEFT JOIN catalogo_nivel_tecnologia nt ON nt.id=cr.nivel_minimo
     WHERE cr.convocatoria_id=$1 ORDER BY t.nombre`, [id]);
  const post = await pool.query(
    `SELECT pc.*, p.nombres, p.apellidos, p.correo FROM postulaciones_convocatoria pc
     JOIN personas p ON p.id=pc.persona_id WHERE pc.convocatoria_id=$1 ORDER BY pc.id`, [id]);
  return { ...v, requisitos: req.rows, postulaciones: post.rows };
}

async function cerrar(id) {
  const { rows } = await pool.query("UPDATE convocatorias SET estado='cerrada' WHERE id=$1 RETURNING *", [id]);
  return rows[0] || null;
}

async function eliminar(id) {
  const { rowCount } = await pool.query('DELETE FROM convocatorias WHERE id=$1', [id]);
  return rowCount > 0;
}

async function ranking(convocatoriaId) {
  const conv = await detalle(convocatoriaId);
  if (!conv) return null;
  const oblig = conv.requisitos.filter((r) => r.obligatorio).map((r) => r.nombre.toLowerCase());
  const cfg = await Config.obtenerConfig();
  const personas = await Persona.listar({ tecs: [], modo: 'cualquiera' });
  const { rows: habs } = await pool.query(
    `SELECT hp.persona_id, t.nombre, nt.nombre AS nivel, hp.anios_uso
     FROM habilidades_postulante hp
     JOIN tecnologias t ON t.id=hp.tecnologia_id
     LEFT JOIN catalogo_nivel_tecnologia nt ON nt.id=hp.nivel_id`);
  const porPersona = {};
  for (const h of habs) {
    (porPersona[h.persona_id] = porPersona[h.persona_id] || []).push(h);
  }
  const { rows: exps } = await pool.query(
    'SELECT persona_id, empresa, cargo, descripcion FROM experiencias_laborales');
  const porExp = {};
  for (const e of exps) {
    (porExp[e.persona_id] = porExp[e.persona_id] || []).push(e);
  }
  const { rows: disps } = await pool.query(
    `SELECT DISTINCT ON (persona_id) persona_id, disponibilidad FROM eventos_postulacion
     ORDER BY persona_id, fecha DESC, id DESC`);
  const porDisp = {};
  for (const x of disps) porDisp[x.persona_id] = x.disponibilidad;
  const { rows: estados } = await pool.query('SELECT id AS postulacion_id, persona_id, estado FROM postulaciones_convocatoria WHERE convocatoria_id=$1', [convocatoriaId]);
  const estMap = {};
  for (const e of estados) estMap[e.persona_id] = e;
  // Solo quienes se postularon a ESTA convocatoria (sin filtro duro previo,
  // pero el ranking es la cola de esa convocatoria, no el padrón general)
  const out = personas.map((p) => {
    const habList = porPersona[p.id] || [];
    const sabe = new Set(habList.map((h) => String(h.nombre).toLowerCase()));
    const cumplidos = oblig.filter((o) => sabe.has(o)).length;
    const match = oblig.length ? (cumplidos / oblig.length) * 100 : 100;
    const conteo = {
      total_eventos: p.total_eventos, total_experiencias: p.total_experiencias,
      total_formaciones: p.total_formaciones, total_habilidades: p.total_habilidades,
      anios_max: p.anios_max, nivel_alto: p.nivel_alto, actuales: p.actuales
    };
    const { kpi, clasificacion } = calcularKpi(conteo, cfg);
    const kc = calcularKpiConvocatoria({
      requisitos: conv.requisitos, habilidades: habList, experiencias: porExp[p.id] || [],
      dispPersona: porDisp[p.id] || null, anios_min: conv.anios_min, disponibilidad: conv.disponibilidad, cfg
    });
    const score = kc.kpi_conv;
    return {
      ...p, match: Math.round(match * 100) / 100, score,
      kpi, clasificacion, kpi_conv: kc.kpi_conv, desglose: kc.desglose,
      estado_postulacion: estMap[p.id] ? estMap[p.id].estado : null,
      postulacion_id: estMap[p.id] ? estMap[p.id].postulacion_id : null
    };
  }).filter((r) => r.estado_postulacion !== null)
    .sort((a, b) => b.score - a.score || b.kpi - a.kpi || a.id - b.id);
  return { convocatoria: { id: conv.id, titulo: conv.titulo, estado: conv.estado, creada_por: conv.creada_por }, total: out.length, resultados: out };
}

async function resumen(duenioId) {
  // duenioId (reclutador): todo filtrado a sus convocatorias; admin: global
  const own = duenioId ? 'AND c2.creada_por=$1' : '';
  const ownPc = duenioId ? 'AND pc.convocatoria_id IN (SELECT id FROM convocatorias WHERE creada_por=$1)' : '';
  const params = duenioId ? [duenioId] : [];
  const q = `
    SELECT
      (SELECT COUNT(*) FROM convocatorias c2 WHERE c2.estado='abierta' ${own}) AS abiertas,
      (SELECT COUNT(*) FROM convocatorias c2 WHERE c2.estado='cerrada' ${own}) AS cerradas,
      (SELECT COUNT(*) FROM convocatorias c2 WHERE c2.estado='pendiente' ${own}) AS pendientes_aprobacion,
      ${duenioId
        ? '(SELECT COUNT(DISTINCT pc.persona_id) FROM postulaciones_convocatoria pc WHERE pc.convocatoria_id IN (SELECT id FROM convocatorias WHERE creada_por=$1)) AS postulantes,'
        : '(SELECT COUNT(*) FROM personas) AS postulantes,'}
      (SELECT COUNT(*) FROM postulaciones_convocatoria pc WHERE pc.estado='postulado' ${ownPc}) AS pendientes,
      (SELECT COUNT(*) FROM postulaciones_convocatoria pc WHERE pc.estado='preseleccionado' ${ownPc}) AS preseleccionados,
      (SELECT COUNT(*) FROM postulaciones_convocatoria pc WHERE pc.estado='contratado' ${ownPc}) AS contratados,
      (SELECT COUNT(*) FROM postulaciones_convocatoria pc WHERE pc.estado='descartado' ${ownPc}) AS descartados
  `;
  const { rows } = await pool.query(q, params);
  const r = rows[0];
  const n = (v) => Number(v || 0);
  return {
    abiertas: n(r.abiertas), cerradas: n(r.cerradas), postulantes: n(r.postulantes),
    pendientes: n(r.pendientes), preseleccionados: n(r.preseleccionados),
    contratados: n(r.contratados), descartados: n(r.descartados),
    pendientes_aprobacion: n(r.pendientes_aprobacion)
  };
}

async function cola({ estado, convocatoria_id, duenioId }) {
  const conds = [];
  const params = [];
  if (estado) {
    params.push(estado);
    conds.push(`pc.estado=$${params.length}`);
  }
  if (convocatoria_id) {
    params.push(convocatoria_id);
    conds.push(`pc.convocatoria_id=$${params.length}`);
  }
  if (duenioId) {
    params.push(duenioId);
    conds.push(`pc.convocatoria_id IN (SELECT id FROM convocatorias WHERE creada_por=$${params.length})`);
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT pc.*, c.titulo AS convocatoria_titulo, p.nombres, p.apellidos, p.correo
     FROM postulaciones_convocatoria pc
     JOIN convocatorias c ON c.id=pc.convocatoria_id
     JOIN personas p ON p.id=pc.persona_id
     ${where} ORDER BY pc.id DESC LIMIT 200`, params);
  return rows.map((r) => ({ ...r, kpi_al_postular: r.kpi_al_postular === null ? null : Number(r.kpi_al_postular), match_pct: r.match_pct === null ? null : Number(r.match_pct), kpi_perfil: r.kpi_perfil === null || r.kpi_perfil === undefined ? null : Number(r.kpi_perfil) }));
}

module.exports = { crear, reemplazarRequisitos, listar, detalle, cerrar, eliminar, ranking, resumen, cola };
