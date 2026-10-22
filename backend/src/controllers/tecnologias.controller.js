// Catalogos que consume el frontend. Los valores de negocio (estados, transiciones,
// umbral por defecto, factores de nivel) salen de domain/catalogos.js: el frontend NO
// los hardcodea, los pide aca.
const Tecnologia = require('../models/tecnologia.model');
const {
  DISPONIBILIDADES, MODOS_FILTRO, ESTADOS_CANDIDATO, TRANSICIONES,
  KPI_MINIMO, CUPOS, PUNTOS_REQUISITOS, PUNTOS_DISPONIBILIDAD, PARTE_COBERTURA, nivelesTecnologia
} = require('../domain/catalogos');

async function listar(req, res) {
  res.json(await Tecnologia.catalogo());
}

async function catalogos(req, res) {
  const db = await Tecnologia.catalogos();
  res.json({
    ...db,
    disponibilidades: DISPONIBILIDADES,
    modos_filtro: MODOS_FILTRO,
    niveles_tecnologia: nivelesTecnologia(),
    kpi_minimo_por_defecto: KPI_MINIMO.POR_DEFECTO,
    kpi_minimo_rango: { min: KPI_MINIMO.MIN, max: KPI_MINIMO.MAX },
    cupos_por_defecto: CUPOS.POR_DEFECTO,
    cupos_rango: { min: CUPOS.MIN, max: CUPOS.MAX },
    // Formula del KPI de convocatoria, para que la UI solo la muestre (no la recalcule).
    puntos: {
      requisitos: PUNTOS_REQUISITOS,
      disponibilidad: PUNTOS_DISPONIBILIDAD,
      cobertura_max: PUNTOS_REQUISITOS * PARTE_COBERTURA,
      calidad_max: PUNTOS_REQUISITOS * (1 - PARTE_COBERTURA)
    },
    pipeline: { estados: ESTADOS_CANDIDATO, transiciones: TRANSICIONES }
  });
}

module.exports = { listar, catalogos };
