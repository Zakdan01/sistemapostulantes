// Servicio de CANDIDATOS: arma EN VIVO la lista de postulantes elegibles de una
// convocatoria. Ya no existe la postulacion: el postulante actualiza su perfil y el
// sistema lo enlista solo si su KPI de convocatoria (kpi_conv) pasa el umbral
// (convocatorias.kpi_minimo). La lista se recalcula en cada consulta, asi que refleja
// siempre el estado actual del CV.
//
// Reglas:
// - Padron: personas SIN cuenta o con usuario postulante en estado 'activa'.
//   (excluye cuentas pendientes/rechazadas y al staff)
// - kpi_conv se calcula con el mismo servicio que usa el ranking historico
//   (services/kpiConvocatoria.js) y el KPI de perfil con services/kpi.js.
// - El padron se cachea unos segundos y se invalida cuando alguien toca su perfil,
//   se crea/actualiza una persona o se aprueba una cuenta.
const { pool } = require('../config/db');
const Config = require('../models/config.model');
const Convocatoria = require('../models/convocatoria.model');
const { calcularKpi } = require('./kpi');
const { calcularKpiConvocatoria } = require('./kpiConvocatoria');
const { KPI_MINIMO } = require('../domain/catalogos');

const TTL_MS = 60 * 1000;
let cache = { ts: 0, datos: null };

// Invalida el padron cacheado. Llamar cuando cambia un perfil, una persona o una cuenta.
function invalidarPadron() {
  cache = { ts: 0, datos: null };
}

async function cargarPadron() {
  const { rows: personas } = await pool.query(`
    SELECT p.id, p.nombres, p.apellidos, p.correo, p.telefono, p.direccion, p.linkedin,
      p.github, p.portafolio_url, p.disponibilidad, p.actualizado_en,
      COALESCE(x.total_experiencias,0) AS total_experiencias,
      COALESCE(x.actuales,0) AS actuales,
      COALESCE(f.total_formaciones,0) AS total_formaciones,
      COALESCE(h.total_habilidades,0) AS total_habilidades,
      COALESCE(h.anios_max,0) AS anios_max,
      COALESCE(h.nivel_alto,0) AS nivel_alto,
      COALESCE(h.nivel_max,0) AS nivel_max,
      COALESCE(e.total_eventos,0) AS total_eventos
    FROM personas p
    LEFT JOIN usuarios u ON u.id = p.usuario_id
    LEFT JOIN (SELECT persona_id, COUNT(*) AS total_experiencias,
                 COUNT(*) FILTER (WHERE es_actual=1) AS actuales
               FROM experiencias_laborales GROUP BY persona_id) x ON x.persona_id=p.id
    LEFT JOIN (SELECT persona_id, COUNT(*) AS total_formaciones
               FROM formaciones_academicas GROUP BY persona_id) f ON f.persona_id=p.id
    LEFT JOIN (SELECT persona_id, COUNT(*) AS total_eventos
               FROM eventos_postulacion GROUP BY persona_id) e ON e.persona_id=p.id
    LEFT JOIN (SELECT hp.persona_id, COUNT(*) AS total_habilidades, MAX(hp.anios_uso) AS anios_max,
                 COUNT(*) FILTER (WHERE nt.nombre IN ('intermedio','avanzado','experto')) AS nivel_alto,
                 MAX(CASE nt.nombre WHEN 'experto' THEN 5 WHEN 'avanzado' THEN 4 WHEN 'intermedio' THEN 3
                                   WHEN 'basico' THEN 2 WHEN 'principiante' THEN 1 ELSE 0 END) AS nivel_max
               FROM habilidades_postulante hp
               LEFT JOIN catalogo_nivel_tecnologia nt ON nt.id=hp.nivel_id
               GROUP BY hp.persona_id) h ON h.persona_id=p.id
    WHERE u.id IS NULL OR (u.rol = 'postulante' AND u.estado_cuenta = 'activa')
    ORDER BY p.id
  `);

  const ids = personas.map((p) => p.id);
  const habsPorPersona = {};
  const expsPorPersona = {};
  const lengsPorPersona = {};
  if (ids.length) {
    const { rows: habs } = await pool.query(
      `SELECT hp.persona_id, t.nombre, nt.nombre AS nivel, hp.anios_uso
       FROM habilidades_postulante hp
       JOIN tecnologias t ON t.id=hp.tecnologia_id
       LEFT JOIN catalogo_nivel_tecnologia nt ON nt.id=hp.nivel_id
       WHERE hp.persona_id = ANY($1) ORDER BY t.nombre`, [ids]);
    for (const h of habs) {
      (habsPorPersona[h.persona_id] = habsPorPersona[h.persona_id] || []).push(h);
      (lengsPorPersona[h.persona_id] = lengsPorPersona[h.persona_id] || []).push(h.nombre);
    }
    const { rows: exps } = await pool.query(
      `SELECT persona_id, empresa, cargo, descripcion
       FROM experiencias_laborales WHERE persona_id = ANY($1) ORDER BY id`, [ids]);
    for (const e of exps) (expsPorPersona[e.persona_id] = expsPorPersona[e.persona_id] || []).push(e);
  }

  return {
    personas: personas.map((p) => ({
      id: p.id,
      persona_id: p.id,
      nombres: p.nombres,
      apellidos: p.apellidos,
      correo: p.correo,
      telefono: p.telefono,
      direccion: p.direccion,
      linkedin: p.linkedin,
      github: p.github,
      portafolio_url: p.portafolio_url,
      disponibilidad: p.disponibilidad,
      actualizado_en: p.actualizado_en,
      total_eventos: Number(p.total_eventos),
      total_experiencias: Number(p.total_experiencias),
      total_formaciones: Number(p.total_formaciones),
      total_habilidades: Number(p.total_habilidades),
      anios_max: Number(p.anios_max),
      nivel_alto: Number(p.nivel_alto),
      nivel_max: Number(p.nivel_max),
      actuales: Number(p.actuales),
      lenguajes: lengsPorPersona[p.id] || [],
      habilidades: habsPorPersona[p.id] || [],
      experiencias: expsPorPersona[p.id] || [],
      conteo: {
        total_eventos: Number(p.total_eventos),
        total_experiencias: Number(p.total_experiencias),
        total_formaciones: Number(p.total_formaciones),
        total_habilidades: Number(p.total_habilidades),
        anios_max: Number(p.anios_max),
        nivel_alto: Number(p.nivel_alto),
        actuales: Number(p.actuales),
        actualizado_en: p.actualizado_en
      }
    }))
  };
}

async function padron() {
  if (cache.datos && Date.now() - cache.ts < TTL_MS) return cache.datos;
  const datos = await cargarPadron();
  cache = { ts: Date.now(), datos };
  return datos;
}

// % de requisitos OBLIGATORIOS que la persona tiene en su CV (metrica legacy del pipeline).
function matchPct(requisitos, habilidades) {
  const oblig = (requisitos || []).filter((r) => r.obligatorio).map((r) => String(r.nombre).toLowerCase());
  if (!oblig.length) return 100;
  const sabe = new Set((habilidades || []).map((h) => String(h.nombre).toLowerCase()));
  return Math.round((oblig.filter((o) => sabe.has(o)).length / oblig.length) * 100 * 100) / 100;
}

function umbralDe(convocatoria) {
  return convocatoria.kpi_minimo === undefined || convocatoria.kpi_minimo === null
    ? KPI_MINIMO.POR_DEFECTO
    : Number(convocatoria.kpi_minimo);
}

// Calcula la lista viva de UNA convocatoria con el padron ya cargado.
function calcularUno(convocatoria, personas, cfg, estados, umbral) {
  const requisitos = convocatoria.requisitos || [];
  const resultados = [];
  const excluidos = [];
  for (const p of personas) {
    const kc = calcularKpiConvocatoria({
      requisitos,
      habilidades: p.habilidades,
      experiencias: p.experiencias,
      dispPersona: p.disponibilidad,
      anios_min: convocatoria.anios_min,
      disponibilidad: convocatoria.disponibilidad,
      cfg
    });
    const { kpi, clasificacion, cumple } = calcularKpi(p.conteo, cfg);
    const est = estados[p.id] || null;
    if (kc.kpi_conv >= umbral) {
      resultados.push({
        id: p.id,
        persona_id: p.id,
        nombres: p.nombres,
        apellidos: p.apellidos,
        correo: p.correo,
        telefono: p.telefono,
        direccion: p.direccion,
        linkedin: p.linkedin,
        github: p.github,
        portafolio_url: p.portafolio_url,
        disponibilidad: p.disponibilidad,
        disponibilidad_persona: p.disponibilidad,
        actualizado_en: p.actualizado_en,
        total_eventos: p.total_eventos,
        total_experiencias: p.total_experiencias,
        total_formaciones: p.total_formaciones,
        total_habilidades: p.total_habilidades,
        anios_max: p.anios_max,
        nivel_alto: p.nivel_alto,
        nivel_max: p.nivel_max,
        actuales: p.actuales,
        lenguajes: p.lenguajes,
        kpi,
        clasificacion,
        cumple,
        kpi_conv: kc.kpi_conv,
        score: kc.kpi_conv,
        match: matchPct(requisitos, p.habilidades),
        desglose: kc.desglose,
        estado_candidato: est ? est.estado : null,
        candidato_id: est ? est.candidato_id : null
      });
    } else {
      excluidos.push({
        persona_id: p.id,
        nombres: p.nombres,
        apellidos: p.apellidos,
        correo: p.correo,
        kpi_conv: kc.kpi_conv,
        motivo_exclusion: `KPI ${kc.kpi_conv} < umbral ${umbral}`
      });
    }
  }
  resultados.sort((a, b) => b.score - a.score || b.kpi - a.kpi || a.id - b.id);
  excluidos.sort((a, b) => b.kpi_conv - a.kpi_conv || a.persona_id - b.persona_id);
  return { total: resultados.length, total_patron: personas.length, umbral, resultados, excluidos };
}

// Lista viva de VARIAS convocatorias: carga el padron y la config UNA sola vez.
// `convocatorias` necesita: [{ id, anios_min, disponibilidad, kpi_minimo, requisitos }]
async function calcularVarios(convocatorias, opciones = {}) {
  if (!convocatorias.length) return [];
  const [cfg, padronDatos] = await Promise.all([Config.obtenerConfig(), padron()]);
  const { personas } = padronDatos;
  const porConv = {};
  if (convocatorias.length) {
    const { rows } = await pool.query(
      `SELECT convocatoria_id, id AS candidato_id, persona_id, estado
       FROM candidatos_convocatoria WHERE convocatoria_id = ANY($1)`,
      [convocatorias.map((c) => c.id)]);
    for (const r of rows) {
      (porConv[r.convocatoria_id] = porConv[r.convocatoria_id] || {})[r.persona_id] = r;
    }
  }
  return convocatorias.map((c) => calcularUno(
    c,
    personas,
    cfg,
    porConv[c.id] || {},
    opciones.umbral !== undefined && opciones.umbral !== null ? Number(opciones.umbral) : umbralDe(c)
  ));
}

// Lista VIVA de candidatos de una convocatoria.
//   { total, total_patron, umbral, resultados: [...], excluidos: [...] }
// `convocatoria` necesita: { id, anios_min, disponibilidad, kpi_minimo, requisitos:[{nombre,obligatorio,nivel_minimo}] }
async function calcularCandidatos(convocatoria, opciones = {}) {
  const [r] = await calcularVarios([convocatoria], opciones);
  return r;
}

// Datos de UNA persona (habilidades, experiencias y conteo), sea parte del padron o no.
async function datosDePersona(personaId) {
  const { rows } = await pool.query(
    `SELECT p.id, p.nombres, p.apellidos, p.correo, p.disponibilidad, p.actualizado_en,
       COALESCE((SELECT COUNT(*) FROM experiencias_laborales x WHERE x.persona_id=p.id),0) AS total_experiencias,
       COALESCE((SELECT COUNT(*) FROM experiencias_laborales x WHERE x.persona_id=p.id AND x.es_actual=1),0) AS actuales,
       COALESCE((SELECT COUNT(*) FROM formaciones_academicas f WHERE f.persona_id=p.id),0) AS total_formaciones,
       COALESCE((SELECT COUNT(*) FROM habilidades_postulante h WHERE h.persona_id=p.id),0) AS total_habilidades,
       COALESCE((SELECT MAX(anios_uso) FROM habilidades_postulante h WHERE h.persona_id=p.id),0) AS anios_max,
       COALESCE((SELECT COUNT(*) FROM habilidades_postulante hp JOIN catalogo_nivel_tecnologia nt ON nt.id=hp.nivel_id
         WHERE hp.persona_id=p.id AND nt.nombre IN ('intermedio','avanzado','experto')),0) AS nivel_alto
     FROM personas p WHERE p.id=$1`, [personaId]);
  const p = rows[0];
  if (!p) return null;
  const { rows: habs } = await pool.query(
    `SELECT t.nombre, nt.nombre AS nivel, hp.anios_uso
     FROM habilidades_postulante hp
     JOIN tecnologias t ON t.id=hp.tecnologia_id
     LEFT JOIN catalogo_nivel_tecnologia nt ON nt.id=hp.nivel_id
     WHERE hp.persona_id=$1 ORDER BY t.nombre`, [personaId]);
  const { rows: exps } = await pool.query(
    'SELECT empresa, cargo, descripcion FROM experiencias_laborales WHERE persona_id=$1 ORDER BY id', [personaId]);
  return {
    id: p.id,
    nombres: p.nombres,
    apellidos: p.apellidos,
    correo: p.correo,
    disponibilidad: p.disponibilidad,
    actualizado_en: p.actualizado_en,
    habilidades: habs,
    experiencias: exps,
    conteo: {
      total_eventos: 0,
      total_experiencias: Number(p.total_experiencias),
      total_formaciones: Number(p.total_formaciones),
      total_habilidades: Number(p.total_habilidades),
      anios_max: Number(p.anios_max),
      nivel_alto: Number(p.nivel_alto),
      actuales: Number(p.actuales),
      actualizado_en: p.actualizado_en
    }
  };
}

// Vista del postulante: todas las convocatorias abiertas, con su kpi_conv, su posicion
// y si califica. No excluye a nadie: si no califica sigue viendo la convocatoria (con el motivo).
async function listaParaPostulante(personaId) {
  const cfg = await Config.obtenerConfig();
  const yo = await datosDePersona(personaId);
  if (!yo) return [];
  const { rows: convs } = await pool.query(
    "SELECT * FROM convocatorias WHERE estado='abierta' ORDER BY id DESC");
  if (!convs.length) return [];

  const reqs = await Convocatoria.requisitosDe(convs.map((c) => c.id));
  const conReqs = convs.map((c) => ({ ...c, requisitos: reqs[c.id] || [] }));
  // una sola pasada sobre el padron para todas las convocatorias abiertas
  const listas = await calcularVarios(conReqs);

  const { rows: pipeline } = await pool.query(
    'SELECT id AS candidato_id, convocatoria_id, estado FROM candidatos_convocatoria WHERE persona_id=$1',
    [personaId]);
  const mioPorConv = {};
  for (const p of pipeline) mioPorConv[p.convocatoria_id] = p;

  return conReqs.map((c, i) => {
    const calc = listas[i];
    const kc = calcularKpiConvocatoria({
      requisitos: c.requisitos,
      habilidades: yo.habilidades,
      experiencias: yo.experiencias,
      dispPersona: yo.disponibilidad,
      anios_min: c.anios_min,
      disponibilidad: c.disponibilidad,
      cfg
    });
    const umbral = calc.umbral;
    const califica = kc.kpi_conv >= umbral;
    const idx = calc.resultados.findIndex((r) => r.persona_id === Number(personaId));
    const mio = mioPorConv[c.id] || null;
    return {
      convocatoria_id: c.id,
      id: c.id,
      titulo: c.titulo,
      descripcion: c.descripcion,
      estado: c.estado,
      anios_min: c.anios_min,
      disponibilidad: c.disponibilidad,
      kpi_minimo: umbral,
      kpi_conv: kc.kpi_conv,
      desglose: kc.desglose,
      requisitos: c.requisitos,
      califica,
      posicion: idx >= 0 ? idx + 1 : null,
      total_candidatos: calc.total,
      motivo_exclusion: califica ? null : `KPI ${kc.kpi_conv} < umbral ${umbral}`,
      estado_candidato: mio ? mio.estado : null,
      candidato_id: mio ? mio.candidato_id : null
    };
  });
}

module.exports = {
  calcularCandidatos, calcularVarios, listaParaPostulante, invalidarPadron, padron,
  matchPct, datosDePersona
};
