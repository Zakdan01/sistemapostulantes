// Servicio de CONVOCATORIAS: orquesta el modelo (SQL puro) con el servicio de
// candidatos (lista VIVA). El controller solo traduce HTTP.
//
// Nada aca se guarda: la lista de candidatos y el umbral efectivo se recalculan en
// cada consulta, por eso "total_candidatos" siempre refleja el CV actual del padron.
const Convocatoria = require('../models/convocatoria.model');
const Config = require('../models/config.model');
const Candidatos = require('./candidatos');
const { pesosDeRequisitos } = require('./kpiConvocatoria');

const r2 = (n) => Math.round(n * 100) / 100;

// Adjunta los requisitos estructurados que necesita el calculo del KPI.
async function conRequisitos(filas) {
  if (!filas.length) return filas;
  const mapa = await Convocatoria.requisitosDe(filas.map((c) => c.id));
  return filas.map((c) => ({ ...c, requisitos_detalle: mapa[c.id] || [] }));
}

// Lista de convocatorias con el total de candidatos VIVO de cada una.
//   `requisitos` se conserva como texto (la UI lo muestra tal cual).
async function listar(estado, duenioId) {
  const filas = await conRequisitos(await Convocatoria.listar(estado, duenioId));
  if (!filas.length) return [];
  const vivos = await Candidatos.calcularVarios(filas.map((c) => ({
    id: c.id,
    anios_min: c.anios_min,
    disponibilidad: c.disponibilidad,
    kpi_minimo: c.kpi_minimo,
    requisitos: c.requisitos_detalle
  })));
  return filas.map((c, i) => {
    const { requisitos_detalle, ...resto } = c; // eslint-disable-line no-unused-vars
    const cupos = Number(resto.cupos || 0);
    const contratados = Number(resto.contratados || 0);
    return {
      ...resto,
      cupos,
      contratados,
      disponibles: Math.max(cupos - contratados, 0),
      completa: cupos > 0 && contratados >= cupos,
      total_candidatos: vivos[i].total
    };
  });
}

// Detalle de la convocatoria con la lista viva resumida (total + patron).
async function detalle(id) {
  const conv = await Convocatoria.detalle(id);
  if (!conv) return null;
  const viva = await Candidatos.calcularCandidatos(conv);
  return {
    ...conv,
    total_candidatos: viva.total,
    total_patron: viva.total_patron,
    umbral: viva.umbral,
    disponibles: Math.max(Number(conv.cupos) - Number(conv.contratados), 0),
    completa: Number(conv.contratados) >= Number(conv.cupos)
  };
}

// Ranking VIVO: quien pasa el umbral (resultados) y quien no (excluidos, con motivo).
// Los requisitos llevan su peso maximo ya calculado (el frontend no repite la formula).
async function ranking(id) {
  const conv = await Convocatoria.detalle(id);
  if (!conv) return null;
  const [viva, cfg] = await Promise.all([
    Candidatos.calcularCandidatos(conv),
    Config.obtenerConfig()
  ]);
  const pesos = pesosDeRequisitos(conv.requisitos, cfg);
  const cupos = Number(conv.cupos);
  const contratados = Number(conv.contratados);
  return {
    convocatoria: {
      ...conv,
      requisitos: conv.requisitos.map((r, i) => ({ ...r, peso_maximo: r2(pesos[i]) }))
    },
    total: viva.total,
    total_patron: viva.total_patron,
    umbral: viva.umbral,
    cupos,
    contratados,
    disponibles: Math.max(cupos - contratados, 0),
    completa: contratados >= cupos,
    resultados: viva.resultados,
    excluidos: viva.excluidos
  };
}

// Postulante: todas las convocatorias abiertas con su KPI, su posicion y si califica.
async function misConvocatorias(personaId) {
  return Candidatos.listaParaPostulante(personaId);
}

// Resumen del tablero: contadores del pipeline + cuantos candidatos hay en las listas
// vivas de las convocatorias abiertas (personas distintas, no filas del pipeline).
async function resumen(duenioId) {
  const [contadores, abiertas] = await Promise.all([
    Convocatoria.resumen(duenioId),
    Convocatoria.listar('abierta', duenioId)
  ]);
  let candidatos = 0;
  if (abiertas.length) {
    const conReq = await conRequisitos(abiertas);
    const vivas = await Candidatos.calcularVarios(conReq.map((c) => ({
      id: c.id,
      anios_min: c.anios_min,
      disponibilidad: c.disponibilidad,
      kpi_minimo: c.kpi_minimo,
      requisitos: c.requisitos_detalle
    })));
    const personas = new Set();
    for (const v of vivas) for (const r of v.resultados) personas.add(r.persona_id);
    candidatos = personas.size;
  }
  return { ...contadores, candidatos: { total: candidatos } };
}

module.exports = { listar, detalle, ranking, resumen, misConvocatorias, conRequisitos };
