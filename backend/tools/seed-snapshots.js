// Herramienta de seed: recalcula los snapshots de candidatos_convocatoria con el
// servicio REAL de KPI y los deja listos para copiar como literales en datos_final.sql.
//
//   cd backend; node tools/seed-snapshots.js           # recalcula y actualiza la BD
//   cd backend; node tools/seed-snapshots.js --print   # solo muestra (no escribe)
//
// Escribe en la BD: kpi_al_tomar, match_pct, kpi_perfil de cada fila del pipeline.
require('dotenv').config();
const { pool } = require('../src/config/db');
const { calcularKpi } = require('../src/services/kpi');
const { calcularKpiConvocatoria } = require('../src/services/kpiConvocatoria');

const SOLO_PRINT = process.argv.includes('--print');

// --- padron: personas sin cuenta o con usuario postulante activo -------------
async function cargarPadron() {
  const { rows } = await pool.query(`
    SELECT p.id, p.nombres, p.apellidos, p.correo, p.disponibilidad, p.actualizado_en,
      COALESCE(x.total_experiencias,0) AS total_experiencias,
      COALESCE(x.actuales,0) AS actuales,
      COALESCE(f.total_formaciones,0) AS total_formaciones,
      COALESCE(h.total_habilidades,0) AS total_habilidades,
      COALESCE(h.anios_max,0) AS anios_max,
      COALESCE(h.nivel_alto,0) AS nivel_alto
    FROM personas p
    LEFT JOIN usuarios u ON u.id = p.usuario_id
    LEFT JOIN (SELECT persona_id, COUNT(*) AS total_experiencias,
                 COUNT(*) FILTER (WHERE es_actual=1) AS actuales
               FROM experiencias_laborales GROUP BY persona_id) x ON x.persona_id=p.id
    LEFT JOIN (SELECT persona_id, COUNT(*) AS total_formaciones
               FROM formaciones_academicas GROUP BY persona_id) f ON f.persona_id=p.id
    LEFT JOIN (SELECT hp.persona_id, COUNT(*) AS total_habilidades, MAX(hp.anios_uso) AS anios_max,
                 COUNT(*) FILTER (WHERE nt.nombre IN ('intermedio','avanzado','experto')) AS nivel_alto
               FROM habilidades_postulante hp
               LEFT JOIN catalogo_nivel_tecnologia nt ON nt.id=hp.nivel_id
               GROUP BY hp.persona_id) h ON h.persona_id=p.id
    WHERE u.id IS NULL OR (u.rol='postulante' AND u.estado_cuenta='activa')
    ORDER BY p.id
  `);
  const ids = rows.map((r) => r.id);
  const habs = {};
  if (ids.length) {
    const h = await pool.query(
      `SELECT hp.persona_id, t.nombre, nt.nombre AS nivel, hp.anios_uso
       FROM habilidades_postulante hp
       JOIN tecnologias t ON t.id=hp.tecnologia_id
       LEFT JOIN catalogo_nivel_tecnologia nt ON nt.id=hp.nivel_id
       WHERE hp.persona_id = ANY($1) ORDER BY t.nombre`, [ids]);
    for (const r of h.rows) (habs[r.persona_id] = habs[r.persona_id] || []).push(r);
  }
  const exps = {};
  if (ids.length) {
    const e = await pool.query(
      `SELECT persona_id, empresa, cargo, descripcion FROM experiencias_laborales
       WHERE persona_id = ANY($1) ORDER BY id`, [ids]);
    for (const r of e.rows) (exps[r.persona_id] = exps[r.persona_id] || []).push(r);
  }
  return rows.map((r) => ({
    id: r.id,
    nombre: `${r.nombres} ${r.apellidos}`.trim(),
    correo: r.correo,
    disponibilidad: r.disponibilidad,
    actualizado_en: r.actualizado_en,
    habilidades: habs[r.id] || [],
    experiencias: exps[r.id] || [],
    conteo: {
      total_experiencias: Number(r.total_experiencias),
      total_formaciones: Number(r.total_formaciones),
      total_habilidades: Number(r.total_habilidades),
      anios_max: Number(r.anios_max),
      nivel_alto: Number(r.nivel_alto),
      actuales: Number(r.actuales)
    }
  }));
}

async function cargarConvocatorias() {
  const { rows } = await pool.query('SELECT * FROM convocatorias ORDER BY id');
  const reqs = await pool.query(
    `SELECT cr.convocatoria_id, t.nombre, cr.obligatorio, nt.nombre AS nivel_minimo
     FROM convocatorias_requisitos cr
     JOIN tecnologias t ON t.id=cr.tecnologia_id
     LEFT JOIN catalogo_nivel_tecnologia nt ON nt.id=cr.nivel_minimo
     ORDER BY cr.convocatoria_id, t.nombre`);
  const porConv = {};
  for (const r of reqs.rows) (porConv[r.convocatoria_id] = porConv[r.convocatoria_id] || []).push(r);
  return rows.map((c) => ({
    ...c,
    kpi_minimo: Number(c.kpi_minimo),
    requisitos: (porConv[c.id] || []).map((r) => ({
      nombre: r.nombre, obligatorio: r.obligatorio, nivel_minimo: r.nivel_minimo
    }))
  }));
}

function matchPct(requisitos, habilidades) {
  const oblig = requisitos.filter((r) => r.obligatorio).map((r) => r.nombre.toLowerCase());
  if (!oblig.length) return 100;
  const sabe = new Set(habilidades.map((h) => String(h.nombre).toLowerCase()));
  return Math.round((oblig.filter((o) => sabe.has(o)).length / oblig.length) * 100 * 100) / 100;
}

(async () => {
  const cfgRows = await pool.query('SELECT clave, valor FROM configuracion_kpi');
  const cfg = {};
  for (const r of cfgRows.rows) cfg[r.clave] = Number(r.valor);

  const padron = await cargarPadron();
  const convs = await cargarConvocatorias();

  // kpi de perfil por persona
  const kpiPerfil = {};
  for (const p of padron) kpiPerfil[p.id] = calcularKpi(p.conteo, cfg).kpi;

  // matriz de candidatos viva
  const matriz = {}; // convId -> [{persona, kpi_conv, ...}]
  for (const c of convs) {
    const lista = padron.map((p) => {
      const kc = calcularKpiConvocatoria({
        requisitos: c.requisitos,
        habilidades: p.habilidades,
        experiencias: p.experiencias,
        dispPersona: p.disponibilidad,
        anios_min: c.anios_min,
        disponibilidad: c.disponibilidad,
        cfg
      });
      return { persona: p, kpi_conv: kc.kpi_conv, desglose: kc.desglose };
    }).sort((a, b) => b.kpi_conv - a.kpi_conv || a.persona.id - b.persona.id);
    matriz[c.id] = lista;
  }

  console.log(`\nPADRON: ${padron.length} personas`);
  console.log(`CONVOCATORIAS: ${convs.length}\n`);
  for (const c of convs) {
    const todos = matriz[c.id];
    const pasan = todos.filter((x) => x.kpi_conv >= c.kpi_minimo);
    console.log(`#${c.id} ${c.titulo} [${c.estado}] kpi_minimo=${c.kpi_minimo} -> ${pasan.length} candidatos de ${todos.length}`);
    for (const x of pasan) {
      console.log(`    ${String(x.kpi_conv).padStart(6)}  ${x.persona.nombre} (${x.persona.correo})`);
    }
    const fuera = todos.filter((x) => x.kpi_conv < c.kpi_minimo);
    if (fuera.length) {
      console.log('    excluidos: ' + fuera.map((x) => `${x.persona.nombre}=${x.kpi_conv}`).join(', '));
    }
  }

  // --- recalcular snapshots del pipeline -----------------------------------
  const { rows: pipeline } = await pool.query(
    `SELECT pc.id, pc.convocatoria_id, pc.persona_id, c.titulo, p.correo
     FROM candidatos_convocatoria pc
     JOIN convocatorias c ON c.id=pc.convocatoria_id
     JOIN personas p ON p.id=pc.persona_id
     ORDER BY pc.id`);

  for (const row of pipeline) {
    const c = convs.find((x) => x.id === row.convocatoria_id);
    const p = padron.find((x) => x.id === row.persona_id);
    if (!p) { console.log(`  !! persona ${row.persona_id} fuera del padron`); continue; }
    const kc = calcularKpiConvocatoria({
      requisitos: c.requisitos,
      habilidades: p.habilidades,
      experiencias: p.experiencias,
      dispPersona: p.disponibilidad,
      anios_min: c.anios_min,
      disponibilidad: c.disponibilidad,
      cfg
    });
    const kpiAlTomar = Math.round(kc.kpi_conv);
    const mp = matchPct(c.requisitos, p.habilidades);
    const kp = kpiPerfil[p.id];
    const pasa = kc.kpi_conv >= c.kpi_minimo;
    console.log(`  ${pasa ? 'OK ' : '!! '}${c.titulo} / ${row.correo}: kpi_conv=${kc.kpi_conv} (umbral ${c.kpi_minimo}) match=${mp} perfil=${kp}`);
    if (!SOLO_PRINT) {
      await pool.query(
        'UPDATE candidatos_convocatoria SET kpi_al_tomar=$1, match_pct=$2, kpi_perfil=$3 WHERE id=$4',
        [kpiAlTomar, mp, kp, row.id]);
    }
    if (!pasa) console.log('  (revisar: no pasa el umbral)');
  }

  // texto listo para pegar en datos_final.sql
  if (!SOLO_PRINT) {
    const { rows: upd } = await pool.query(
      `SELECT c.titulo, p.correo, pc.estado, pc.kpi_al_tomar, pc.match_pct, pc.kpi_perfil
       FROM candidatos_convocatoria pc
       JOIN convocatorias c ON c.id=pc.convocatoria_id
       JOIN personas p ON p.id=pc.persona_id ORDER BY pc.id`);
    console.log('\n--- literales para datos_final.sql ---');
    for (const u of upd) {
      console.log(`  ((SELECT id FROM convocatorias WHERE titulo='${u.titulo}'),(SELECT id FROM personas WHERE correo='${u.correo}'),'${u.estado}',${u.kpi_al_tomar},${u.match_pct},${u.kpi_perfil}),`);
    }
  }

  await pool.end();
})().catch(async (e) => { console.error(e); await pool.end(); process.exit(1); });
