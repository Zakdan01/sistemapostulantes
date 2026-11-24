// Catalogos que consume el frontend. Los valores de negocio (estados, transiciones,
// umbral por defecto, factores de nivel) salen de domain/catalogos.js: el frontend NO
// los hardcodea, los pide aca.
const Tecnologia = require('../models/tecnologia.model');
const Candidatos = require('../services/candidatos');
const { HttpError } = require('../utils/errors');
const {
  DISPONIBILIDADES, MODOS_FILTRO, ESTADOS_CANDIDATO, TRANSICIONES, TIPOS_CONVOCATORIA,
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
    tipos_convocatoria: TIPOS_CONVOCATORIA,
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

// Controladores para administración de tecnologías
async function listarAdmin(req, res) {
  const tecnologias = await Tecnologia.listarAdmin();
  res.json(tecnologias);
}

async function crear(req, res) {
  const { nombre, categoria_id, categoria } = req.body || {};
  if (!nombre || !nombre.trim()) throw HttpError.badRequest('El nombre de la tecnología es obligatorio');

  try {
    const nueva = await Tecnologia.crear({ nombre, categoria_id, categoria });
    Candidatos.invalidarPadron();
    res.status(201).json(nueva);
  } catch (err) {
    if (err.code === '23505') {
      throw HttpError.conflict('Ya existe una tecnología registrada con ese nombre');
    }
    throw err;
  }
}

async function actualizar(req, res) {
  const id = Number(req.params.id);
  if (!id) throw HttpError.badRequest('ID de tecnología inválido');

  const existente = await Tecnologia.porId(id);
  if (!existente) throw HttpError.notFound('Tecnología no encontrada');

  const { nombre, categoria_id, categoria } = req.body || {};
  try {
    const actualizada = await Tecnologia.actualizar(id, { nombre, categoria_id, categoria });
    Candidatos.invalidarPadron();
    res.json(actualizada);
  } catch (err) {
    if (err.code === '23505') {
      throw HttpError.conflict('Ya existe una tecnología con ese nombre');
    }
    throw err;
  }
}

async function eliminar(req, res) {
  const id = Number(req.params.id);
  if (!id) throw HttpError.badRequest('ID de tecnología inválido');

  const existente = await Tecnologia.porId(id);
  if (!existente) throw HttpError.notFound('Tecnología no encontrada');

  await Tecnologia.eliminar(id);
  Candidatos.invalidarPadron();
  res.json({ ok: true, mensaje: 'Tecnología eliminada exitosamente' });
}

module.exports = { listar, catalogos, listarAdmin, crear, actualizar, eliminar };
