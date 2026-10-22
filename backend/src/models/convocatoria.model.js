// Modelo de convocatorias: SOLO SQL. Ninguna regla de negocio vive aqui.
// La lista de candidatos (que es VIVA y depende del KPI) la arma
// services/candidatos.js; quien las orquesta es services/convocatorias.service.js.
const { pool, conTransaccion } = require('../config/db');
const { HttpError } = require('../utils/errors');
const { normTec } = require('../utils/validar');
const { KPI_MINIMO, CUPOS } = require('../domain/catalogos');

const KPI_MINIMO_POR_DEFECTO = KPI_MINIMO.POR_DEFECTO;

// ---- Convocatorias --------------------------------------------------------

async function crear({ titulo, descripcion, anios_min, disponibilidad, kpi_minimo, cupos, requisitos, creada_por }) {
  // Todo en una transaccion: si un requisito es invalido (400) no queda una
  // convocatoria a medias sin requisitos.
  return conTransaccion(async (conn) => {
    const r = await conn.query(
      `INSERT INTO convocatorias (titulo, descripcion, anios_min, disponibilidad, kpi_minimo, cupos, creada_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [titulo, descripcion || null, anios_min || 0, disponibilidad || null,
        kpi_minimo === undefined || kpi_minimo === null ? KPI_MINIMO_POR_DEFECTO : Number(kpi_minimo),
        cupos === undefined || cupos === null ? CUPOS.POR_DEFECTO : Number(cupos),
        creada_por || null]
    );
    const conv = r.rows[0];
    await reemplazarRequisitos(conv.id, requisitos || [], conn);
    return detalle(conv.id, conn);
  });
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
        (SELECT COUNT(*) FROM candidatos_convocatoria pc WHERE pc.convocatoria_id=c.id) AS total_postulados,
        (SELECT COUNT(*) FROM candidatos_convocatoria pc WHERE pc.convocatoria_id=c.id AND pc.estado='contratado') AS contratados,
        (SELECT STRING_AGG(t.nombre || CASE WHEN cr.obligatorio THEN ' ★' ELSE ' ○' END || COALESCE('≥' || nt.nombre, ''), ', ' ORDER BY t.nombre)
         FROM convocatorias_requisitos cr JOIN tecnologias t ON t.id=cr.tecnologia_id LEFT JOIN catalogo_nivel_tecnologia nt ON nt.id=cr.nivel_minimo WHERE cr.convocatoria_id=c.id) AS requisitos
       FROM convocatorias c LEFT JOIN usuarios u ON u.id=c.creada_por
       ${where} ORDER BY c.id DESC`;
  const { rows } = await pool.query(q, params);
  return rows.map((r) => ({
    ...r,
    kpi_minimo: Number(r.kpi_minimo),
    cupos: Number(r.cupos),
    contratados: Number(r.contratados),
    total_postulados: Number(r.total_postulados)
  }));
}

async function detalle(id, conn = pool) {
  const { rows } = await conn.query(
    `SELECT c.*, u.correo AS creada_por_correo,
       (SELECT COUNT(*) FROM candidatos_convocatoria pc WHERE pc.convocatoria_id=c.id AND pc.estado='contratado') AS contratados
     FROM convocatorias c LEFT JOIN usuarios u ON u.id=c.creada_por
     WHERE c.id=$1`, [id]);
  const v = rows[0];
  if (!v) return null;
  const req = await conn.query(
    `SELECT t.id AS tecnologia_id, t.nombre, cr.obligatorio, nt.nombre AS nivel_minimo
     FROM convocatorias_requisitos cr
     JOIN tecnologias t ON t.id=cr.tecnologia_id
     LEFT JOIN catalogo_nivel_tecnologia nt ON nt.id=cr.nivel_minimo
     WHERE cr.convocatoria_id=$1 ORDER BY t.nombre`, [id]);
  const cand = await conn.query(
    `SELECT pc.*, p.nombres, p.apellidos, p.correo FROM candidatos_convocatoria pc
     JOIN personas p ON p.id=pc.persona_id WHERE pc.convocatoria_id=$1 ORDER BY pc.id`, [id]);
  return {
    ...v,
    kpi_minimo: Number(v.kpi_minimo),
    cupos: Number(v.cupos),
    contratados: Number(v.contratados),
    requisitos: req.rows,
    candidatos: cand.rows.map(normalizarCandidato)
  };
}

async function cerrar(id) {
  const { rows } = await pool.query(
    "UPDATE convocatorias SET estado='cerrada', actualizado_en=now() WHERE id=$1 RETURNING *", [id]);
  return rows[0] || null;
}

async function eliminar(id) {
  const { rowCount } = await pool.query('DELETE FROM convocatorias WHERE id=$1', [id]);
  return rowCount > 0;
}

// Cambia el KPI minimo (umbral) de la convocatoria: define a quien enlistan.
async function setUmbral(id, kpiMinimo) {
  const { rows } = await pool.query(
    'UPDATE convocatorias SET kpi_minimo=$1, actualizado_en=now() WHERE id=$2 RETURNING *',
    [Number(kpiMinimo), id]);
  return rows[0] || null;
}

// Cambia los cupos (vacantes) de la convocatoria. Quien decide si hay que cerrarla
// es el controller/service (si los contratados ya llenan los cupos nuevos).
async function setCupos(id, cupos) {
  const { rows } = await pool.query(
    'UPDATE convocatorias SET cupos=$1, actualizado_en=now() WHERE id=$2 RETURNING *',
    [Number(cupos), id]);
  return rows[0] ? { ...rows[0], cupos: Number(rows[0].cupos) } : null;
}

// Publica (admin) una convocatoria pendiente.
async function aprobar(id) {
  const { rows } = await pool.query(
    "UPDATE convocatorias SET estado='abierta', actualizado_en=now() WHERE id=$1 AND estado='pendiente' RETURNING *",
    [id]);
  return rows[0] || null;
}

// Rechaza (admin) una convocatoria pendiente.
async function rechazar(id) {
  const { rows } = await pool.query(
    "UPDATE convocatorias SET estado='rechazada', actualizado_en=now() WHERE id=$1 AND estado='pendiente' RETURNING *",
    [id]);
  return rows[0] || null;
}

// ---- Requisitos -----------------------------------------------------------

// Requisitos estructurados de varias convocatorias (nombre, obligatorio, nivel_minimo).
async function requisitosDe(convocatoriaIds) {
  const mapa = {};
  if (!convocatoriaIds || !convocatoriaIds.length) return mapa;
  const { rows } = await pool.query(
    `SELECT cr.convocatoria_id, t.id AS tecnologia_id, t.nombre, cr.obligatorio, nt.nombre AS nivel_minimo
     FROM convocatorias_requisitos cr
     JOIN tecnologias t ON t.id=cr.tecnologia_id
     LEFT JOIN catalogo_nivel_tecnologia nt ON nt.id=cr.nivel_minimo
     WHERE cr.convocatoria_id = ANY($1)
     ORDER BY t.nombre`, [convocatoriaIds]);
  for (const r of rows) {
    (mapa[r.convocatoria_id] = mapa[r.convocatoria_id] || []).push({
      tecnologia_id: r.tecnologia_id,
      nombre: r.nombre,
      obligatorio: r.obligatorio,
      nivel_minimo: r.nivel_minimo
    });
  }
  return mapa;
}

async function reemplazarRequisitos(convocatoriaId, requisitos, conn = pool) {
  // requisitos: [{tecnologia_id} | {nombre, categoria}, obligatorio, nivel_minimo?]
  // nivel_minimo: nombre|id de catálogo (default 'basico'); se valida, 400 si no existe
  await conn.query('DELETE FROM convocatorias_requisitos WHERE convocatoria_id=$1', [convocatoriaId]);
  const vistos = new Set();
  for (const req of requisitos) {
    let tecId = req.tecnologia_id || null;
    if (!tecId) {
      const nombre = normTec(req.nombre || req.tecnologia);
      if (!nombre) continue;
      if (vistos.has(nombre)) continue;
      vistos.add(nombre);
      let t = await conn.query('SELECT id FROM tecnologias WHERE nombre=$1', [nombre]);
      if (!t.rows[0]) {
        let catId = null;
        if (req.categoria) {
          const c = await conn.query('SELECT id FROM catalogo_categoria_tecnologia WHERE nombre=$1', [String(req.categoria).toLowerCase()]);
          catId = c.rows[0] ? c.rows[0].id : null;
        }
        if (!catId) {
          const c = await conn.query("SELECT id FROM catalogo_categoria_tecnologia WHERE nombre='otro'");
          catId = c.rows[0] ? c.rows[0].id : null;
        }
        t = await conn.query('INSERT INTO tecnologias (nombre, categoria_id) VALUES ($1,$2) RETURNING id', [nombre, catId]);
      }
      tecId = t.rows[0].id;
    } else {
      if (vistos.has(`i:${tecId}`)) continue;
      vistos.add(`i:${tecId}`);
      const t = await conn.query('SELECT id FROM tecnologias WHERE id=$1', [tecId]);
      if (!t.rows[0]) continue;
    }
    let nivelMinId = null;
    if (req.nivel_minimo !== undefined && req.nivel_minimo !== null && req.nivel_minimo !== '') {
      const isNum = Number.isInteger(Number(req.nivel_minimo)) && String(req.nivel_minimo).trim() !== '';
      const rn = isNum
        ? await conn.query('SELECT id FROM catalogo_nivel_tecnologia WHERE id=$1', [Number(req.nivel_minimo)])
        : await conn.query('SELECT id FROM catalogo_nivel_tecnologia WHERE nombre=$1', [String(req.nivel_minimo).trim().toLowerCase()]);
      if (!rn.rows[0]) throw HttpError.badRequest(`nivel_minimo inválido: ${req.nivel_minimo}`);
      nivelMinId = rn.rows[0].id;
    } else {
      const rd = await conn.query("SELECT id FROM catalogo_nivel_tecnologia WHERE nombre='basico'");
      nivelMinId = rd.rows[0] ? rd.rows[0].id : null;
    }
    await conn.query(
      'INSERT INTO convocatorias_requisitos (convocatoria_id, tecnologia_id, obligatorio, nivel_minimo) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',
      [convocatoriaId, tecId, req.obligatorio === undefined ? true : !!req.obligatorio, nivelMinId]
    );
  }
}

// ---- Pipeline de candidatos -----------------------------------------------

function normalizarCandidato(r) {
  return {
    ...r,
    kpi_al_tomar: r.kpi_al_tomar === null || r.kpi_al_tomar === undefined ? null : Number(r.kpi_al_tomar),
    match_pct: r.match_pct === null || r.match_pct === undefined ? null : Number(r.match_pct),
    kpi_perfil: r.kpi_perfil === null || r.kpi_perfil === undefined ? null : Number(r.kpi_perfil)
  };
}

async function buscarCandidato(convocatoriaId, personaId, conn = pool) {
  const { rows } = await conn.query(
    'SELECT * FROM candidatos_convocatoria WHERE convocatoria_id=$1 AND persona_id=$2',
    [convocatoriaId, personaId]);
  return rows[0] || null;
}

// Bloquea la fila de la convocatoria hasta el fin de la transaccion (FOR UPDATE).
// Serializa las contrataciones de una misma convocatoria: dos pedidos simultaneos
// no pueden pasarse de los cupos. Devuelve la fila o null si no existe.
async function bloquearConvocatoria(conn, id) {
  const { rows } = await conn.query('SELECT * FROM convocatorias WHERE id=$1 FOR UPDATE', [id]);
  return rows[0] || null;
}

async function contarContratados(conn, convocatoriaId) {
  const { rows } = await conn.query(
    "SELECT COUNT(*) AS total FROM candidatos_convocatoria WHERE convocatoria_id=$1 AND estado='contratado'",
    [convocatoriaId]);
  return Number(rows[0].total);
}

// Cierre automatico: se llama dentro de la misma transaccion que la contratacion.
async function marcarCerrada(conn, id) {
  await conn.query(
    "UPDATE convocatorias SET estado='cerrada', actualizado_en=now() WHERE id=$1 AND estado<>'cerrada'", [id]);
}

// Inserta (o actualiza) la fila del pipeline. La crea el staff al tomar a alguien.
async function guardarCandidato(conn, { convocatoria_id, persona_id, estado, kpi_al_tomar, match_pct, kpi_perfil }) {
  const r = await conn.query(
    `INSERT INTO candidatos_convocatoria (convocatoria_id, persona_id, estado, kpi_al_tomar, match_pct, kpi_perfil)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (convocatoria_id, persona_id)
     DO UPDATE SET estado=EXCLUDED.estado, actualizado_en=now()
     RETURNING *`,
    [convocatoria_id, persona_id, estado, kpi_al_tomar, match_pct, kpi_perfil]);
  return r.rows[0];
}

async function actualizarEstadoCandidato(conn, id, estado) {
  const r = await conn.query(
    'UPDATE candidatos_convocatoria SET estado=$1, actualizado_en=now() WHERE id=$2 RETURNING *',
    [estado, id]);
  return r.rows[0];
}

// Cola del pipeline (alias /api/candidatos y /api/postulaciones).
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
     FROM candidatos_convocatoria pc
     JOIN convocatorias c ON c.id=pc.convocatoria_id
     JOIN personas p ON p.id=pc.persona_id
     ${where} ORDER BY pc.id DESC LIMIT 200`, params);
  return rows.map(normalizarCandidato);
}

// ---- Resumen --------------------------------------------------------------

// Contadores del pipeline. duenioId (reclutador): todo filtrado a sus convocatorias.
async function resumen(duenioId) {
  const own = duenioId ? 'AND c2.creada_por=$1' : '';
  const ownPc = duenioId ? 'AND pc.convocatoria_id IN (SELECT id FROM convocatorias WHERE creada_por=$1)' : '';
  const params = duenioId ? [duenioId] : [];
  const q = `
    SELECT
      (SELECT COUNT(*) FROM convocatorias c2 WHERE c2.estado='abierta' ${own}) AS abiertas,
      (SELECT COUNT(*) FROM convocatorias c2 WHERE c2.estado='cerrada' ${own}) AS cerradas,
      (SELECT COUNT(*) FROM convocatorias c2 WHERE c2.estado='pendiente' ${own}) AS pendientes_aprobacion,
      ${duenioId
        ? '(SELECT COUNT(DISTINCT pc.persona_id) FROM candidatos_convocatoria pc WHERE pc.convocatoria_id IN (SELECT id FROM convocatorias WHERE creada_por=$1)) AS postulantes,'
        : '(SELECT COUNT(*) FROM personas) AS postulantes,'}
      (SELECT COUNT(*) FROM candidatos_convocatoria pc WHERE pc.estado='postulado' ${ownPc}) AS pendientes,
      (SELECT COUNT(*) FROM candidatos_convocatoria pc WHERE pc.estado='consulta' ${ownPc}) AS consultas,
      (SELECT COUNT(*) FROM candidatos_convocatoria pc WHERE pc.estado='preseleccionado' ${ownPc}) AS preseleccionados,
      (SELECT COUNT(*) FROM candidatos_convocatoria pc WHERE pc.estado='contratado' ${ownPc}) AS contratados,
      (SELECT COUNT(*) FROM candidatos_convocatoria pc WHERE pc.estado='descartado' ${ownPc}) AS descartados
  `;
  const { rows } = await pool.query(q, params);
  const r = rows[0];
  const n = (v) => Number(v || 0);
  return {
    abiertas: n(r.abiertas), cerradas: n(r.cerradas), postulantes: n(r.postulantes),
    pendientes: n(r.pendientes), consultas: n(r.consultas), preseleccionados: n(r.preseleccionados),
    contratados: n(r.contratados), descartados: n(r.descartados),
    pendientes_aprobacion: n(r.pendientes_aprobacion)
  };
}

module.exports = {
  crear, listar, detalle, cerrar, eliminar, setUmbral, setCupos, aprobar, rechazar,
  reemplazarRequisitos, requisitosDe, normalizarCandidato,
  buscarCandidato, bloquearConvocatoria, contarContratados, marcarCerrada,
  guardarCandidato, actualizarEstadoCandidato, cola, resumen,
  KPI_MINIMO_POR_DEFECTO
};
