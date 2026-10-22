const { pool } = require('../config/db');
const { NIVEL_ORDEN } = require('../domain/catalogos');

async function catalogoId(conn, tabla, nombre) {
  if (!nombre) return null;
  const { rows } = await conn.query(`SELECT id FROM ${tabla} WHERE nombre=$1`, [nombre]);
  return rows[0] ? rows[0].id : null;
}

async function reemplazarHabilidades(conn, personaId, habilidades) {
  await conn.query('DELETE FROM habilidades_postulante WHERE persona_id=$1', [personaId]);
  const vistos = new Set();
  for (const h of habilidades) {
    let tecId = h.tecnologia_id || null;
    if (!tecId) {
      const nombre = String(h.nombre).trim().toLowerCase();
      if (vistos.has(`n:${nombre}`)) continue;
      vistos.add(`n:${nombre}`);
      let r = await conn.query('SELECT id FROM tecnologias WHERE nombre=$1', [nombre]);
      if (!r.rows[0]) {
        const cat = await conn.query("SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='otro'");
        r = await conn.query(
          'INSERT INTO tecnologias (nombre, categoria_id) VALUES ($1,$2) RETURNING id',
          [nombre, cat.rows[0] ? cat.rows[0].id : null]
        );
      }
      tecId = r.rows[0].id;
    } else {
      if (vistos.has(`i:${tecId}`)) continue;
      vistos.add(`i:${tecId}`);
      const r = await conn.query('SELECT id FROM tecnologias WHERE id=$1', [tecId]);
      if (!r.rows[0]) continue;
    }
    let nivelId = null;
    if (h.nivel) {
      const r = await conn.query('SELECT id FROM catalogo_nivel_tecnologia WHERE nombre=$1', [h.nivel]);
      nivelId = r.rows[0] ? r.rows[0].id : null;
    }
    await conn.query(
      `INSERT INTO habilidades_postulante (persona_id, tecnologia_id, nivel_id, anios_uso)
       VALUES ($1,$2,$3,$4) ON CONFLICT (persona_id, tecnologia_id)
       DO UPDATE SET nivel_id=EXCLUDED.nivel_id, anios_uso=EXCLUDED.anios_uso`,
      [personaId, tecId, nivelId, h.anios_uso || 0]
    );
  }
}

async function reemplazarExperiencias(conn, personaId, experiencias) {
  await conn.query('DELETE FROM experiencias_laborales WHERE persona_id=$1', [personaId]);
  for (const e of experiencias) {
    const tipoId = await catalogoId(conn, 'catalogo_tipo_trabajo', e.tipo_trabajo);
    await conn.query(
      `INSERT INTO experiencias_laborales (persona_id, empresa, cargo, descripcion, tipo_trabajo_id, fecha_inicio, fecha_fin, es_actual)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [personaId, e.empresa, e.cargo, e.descripcion, tipoId, e.fecha_inicio, e.fecha_fin, e.es_actual ? 1 : 0]
    );
  }
}

async function reemplazarFormaciones(conn, personaId, formaciones) {
  await conn.query('DELETE FROM formaciones_academicas WHERE persona_id=$1', [personaId]);
  for (const f of formaciones) {
    const instId = await catalogoId(conn, 'catalogo_instituciones', f.institucion);
    const nivId = await catalogoId(conn, 'catalogo_nivel_formacion', f.nivel);
    await conn.query(
      `INSERT INTO formaciones_academicas (persona_id, institucion_id, titulo, nivel_id, fecha_inicio, fecha_fin, certificado_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [personaId, instId, f.titulo, nivId, f.fecha_inicio, f.fecha_fin, f.certificado_url]
    );
  }
}

function whereFiltro(tecs, params) {
  // devuelve { joinCoincidencias, having } para modos; el conteo base siempre trae n_tecs
  if (!tecs.length) return { extra: '', having: '' };
  params.push(tecs);
  return { extra: ', COUNT(*) FILTER (WHERE t.nombre = ANY ($' + params.length + ')) AS coincidencias', having: '' };
}

async function listar({ tecs, modo, anios_min, tipo_trabajo, nivel }) {
  const params = [];
  const { extra } = whereFiltro(tecs, params);
  const joins = [];
  if (tipo_trabajo) {
    params.push(tipo_trabajo);
    joins.push(`JOIN (SELECT DISTINCT persona_id FROM experiencias_laborales x2 JOIN catalogo_tipo_trabajo c2 ON c2.id=x2.tipo_trabajo_id WHERE c2.nombre=$${params.length}) xt ON xt.persona_id=p.id`);
  }
  const q = `
    SELECT p.id, p.nombres, p.apellidos, p.correo, p.telefono, p.disponibilidad, p.actualizado_en,
      COALESCE(e.total_eventos,0) AS total_eventos,
      COALESCE(x.total_experiencias,0) AS total_experiencias,
      COALESCE(f.total_formaciones,0) AS total_formaciones,
      COALESCE(h.total_habilidades,0) AS total_habilidades,
      COALESCE(h.anios_max,0) AS anios_max,
      COALESCE(h.nivel_alto,0) AS nivel_alto,
      COALESCE(h.nivel_max,0) AS nivel_max,
      COALESCE(x.actuales,0) AS actuales,
      STRING_AGG(DISTINCT t.nombre, ', ' ORDER BY t.nombre) AS lenguajes
      ${extra}
    FROM personas p
    ${joins.join('\n')}
    LEFT JOIN (SELECT persona_id, COUNT(*) AS total_eventos FROM eventos_postulacion GROUP BY persona_id) e ON e.persona_id=p.id
    LEFT JOIN (SELECT persona_id, COUNT(*) AS total_experiencias, COUNT(*) FILTER (WHERE es_actual=1) AS actuales FROM experiencias_laborales GROUP BY persona_id) x ON x.persona_id=p.id
    LEFT JOIN (SELECT persona_id, COUNT(*) AS total_formaciones FROM formaciones_academicas GROUP BY persona_id) f ON f.persona_id=p.id
    LEFT JOIN (
      SELECT hp.persona_id, COUNT(*) AS total_habilidades, MAX(hp.anios_uso) AS anios_max,
        COUNT(*) FILTER (WHERE nt.nombre IN ('intermedio','avanzado','experto')) AS nivel_alto,
        MAX(CASE nt.nombre WHEN 'experto' THEN 5 WHEN 'avanzado' THEN 4 WHEN 'intermedio' THEN 3 WHEN 'basico' THEN 2 WHEN 'principiante' THEN 1 ELSE 0 END) AS nivel_max
      FROM habilidades_postulante hp
      LEFT JOIN catalogo_nivel_tecnologia nt ON nt.id=hp.nivel_id
      GROUP BY hp.persona_id
    ) h ON h.persona_id=p.id
    LEFT JOIN habilidades_postulante hp2 ON hp2.persona_id=p.id
    LEFT JOIN tecnologias t ON t.id=hp2.tecnologia_id
    GROUP BY p.id, e.total_eventos, x.total_experiencias, x.actuales, f.total_formaciones, h.total_habilidades, h.anios_max, h.nivel_alto, h.nivel_max
  `;
  const { rows } = await pool.query(q, params);
  let out = rows.map((r) => ({
    ...r,
    anios_max: Number(r.anios_max || 0),
    total_eventos: Number(r.total_eventos || 0),
    total_experiencias: Number(r.total_experiencias || 0),
    total_formaciones: Number(r.total_formaciones || 0),
    total_habilidades: Number(r.total_habilidades || 0),
    nivel_alto: Number(r.nivel_alto || 0),
    nivel_max: Number(r.nivel_max || 0),
    actuales: Number(r.actuales || 0),
    coincidencias: r.coincidencias !== undefined ? Number(r.coincidencias) : 0,
    lenguajes: r.lenguajes ? r.lenguajes.split(', ') : []
  }));
  if (tecs.length) {
    if (modo === 'cualquiera') out = out.filter((r) => r.coincidencias >= 1);
    if (modo === 'todos') out = out.filter((r) => r.coincidencias === tecs.length);
    if (modo === 'solo') out = out.filter((r) => r.coincidencias === tecs.length && r.total_habilidades === tecs.length);
  }
  if (anios_min !== undefined && anios_min !== null) out = out.filter((r) => r.anios_max >= anios_min);
  if (nivel) out = out.filter((r) => r.nivel_max >= (NIVEL_ORDEN[nivel] || 0));
  return out;
}

async function detalle(id) {
  const { rows } = await pool.query('SELECT * FROM personas WHERE id=$1', [id]);
  const p = rows[0];
  if (!p) return null;
  const hab = await pool.query(
    `SELECT t.id, t.nombre, nt.nombre AS nivel, hp.anios_uso
     FROM habilidades_postulante hp
     JOIN tecnologias t ON t.id=hp.tecnologia_id
     LEFT JOIN catalogo_nivel_tecnologia nt ON nt.id=hp.nivel_id
     WHERE hp.persona_id=$1 ORDER BY t.nombre`, [id]);
  const exp = await pool.query(
    `SELECT x.*, c.nombre AS tipo_trabajo FROM experiencias_laborales x
     LEFT JOIN catalogo_tipo_trabajo c ON c.id=x.tipo_trabajo_id
     WHERE persona_id=$1 ORDER BY id`, [id]);
  const form = await pool.query(
    `SELECT f.*, ci.nombre AS institucion, cn.nombre AS nivel FROM formaciones_academicas f
     LEFT JOIN catalogo_instituciones ci ON ci.id=f.institucion_id
     LEFT JOIN catalogo_nivel_formacion cn ON cn.id=f.nivel_id
     WHERE persona_id=$1 ORDER BY id`, [id]);
  const ev = await pool.query('SELECT * FROM eventos_postulacion WHERE persona_id=$1 ORDER BY fecha DESC, id DESC', [id]);
  return { ...p, habilidades: hab.rows, experiencias: exp.rows, formaciones: form.rows, eventos: ev.rows };
}

async function porUsuario(usuarioId) {
  const { rows } = await pool.query('SELECT * FROM personas WHERE usuario_id=$1', [usuarioId]);
  return rows[0] || null;
}

// Bitacora del padron (eventos_postulacion). Ya NO define disponibilidad ni enlistado:
// solo deja constancia de que la persona toco su perfil o de que el staff la tomo.
async function registrarEvento(conn, personaId, disponibilidad) {
  await conn.query(
    'INSERT INTO eventos_postulacion (persona_id, fecha, hora, disponibilidad) VALUES ($1, CURRENT_DATE, CURRENT_TIME, $2)',
    [personaId, disponibilidad || null]);
}

async function conteoParaKpi(id) {
  const { rows } = await pool.query(`
    SELECT
      COALESCE((SELECT COUNT(*) FROM eventos_postulacion WHERE persona_id=$1),0) AS total_eventos,
      COALESCE((SELECT COUNT(*) FROM experiencias_laborales WHERE persona_id=$1),0) AS total_experiencias,
      COALESCE((SELECT COUNT(*) FROM formaciones_academicas WHERE persona_id=$1),0) AS total_formaciones,
      COALESCE((SELECT COUNT(*) FROM habilidades_postulante WHERE persona_id=$1),0) AS total_habilidades,
      COALESCE((SELECT MAX(anios_uso) FROM habilidades_postulante WHERE persona_id=$1),0) AS anios_max,
      COALESCE((SELECT COUNT(*) FROM habilidades_postulante hp JOIN catalogo_nivel_tecnologia nt ON nt.id=hp.nivel_id
        WHERE hp.persona_id=$1 AND nt.nombre IN ('intermedio','avanzado','experto')),0) AS nivel_alto,
      COALESCE((SELECT COUNT(*) FROM experiencias_laborales WHERE persona_id=$1 AND es_actual=1),0) AS actuales,
      (SELECT actualizado_en FROM personas WHERE id=$1) AS actualizado_en
  `, [id]);
  const r = rows[0];
  return {
    total_eventos: Number(r.total_eventos), total_experiencias: Number(r.total_experiencias),
    total_formaciones: Number(r.total_formaciones), total_habilidades: Number(r.total_habilidades),
    anios_max: Number(r.anios_max), nivel_alto: Number(r.nivel_alto), actuales: Number(r.actuales),
    actualizado_en: r.actualizado_en
  };
}

module.exports = {
  reemplazarHabilidades, reemplazarExperiencias, reemplazarFormaciones,
  listar, detalle, porUsuario, registrarEvento, conteoParaKpi
};
