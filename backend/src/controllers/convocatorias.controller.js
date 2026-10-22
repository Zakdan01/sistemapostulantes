// Controller de CONVOCATORIAS: solo traduce HTTP. La logica vive en
// services/convocatorias.service.js, services/pipeline.js y models/convocatoria.model.js.
const Convocatoria = require('../models/convocatoria.model');
const Persona = require('../models/persona.model');
const Convocatorias = require('../services/convocatorias.service');
const Pipeline = require('../services/pipeline');
const { HttpError } = require('../utils/errors');
const { DISPONIBILIDADES } = require('../utils/validar');
const { ESTADOS_CONVOCATORIA, ESTADOS_CANDIDATO, KPI_MINIMO, CUPOS } = require('../domain/catalogos');

// Reclutador: solo puede gestionar las convocatorias que el mismo creo.
function exigirDueno(req, creadaPor) {
  if (req.usuario.rol === 'reclutador' && creadaPor !== req.usuario.id) {
    throw HttpError.forbidden('Solo puedes gestionar tus propias convocatorias');
  }
}

function validarKpiMinimo(valor) {
  const k = Number(valor);
  if (!Number.isInteger(k) || k < KPI_MINIMO.MIN || k > KPI_MINIMO.MAX) {
    throw HttpError.badRequest(`kpi_minimo inválido (${KPI_MINIMO.MIN}-${KPI_MINIMO.MAX})`);
  }
  return k;
}

// Cupos (vacantes): entero entre 1 y 999. Al llenarse, la convocatoria se cierra.
function validarCupos(valor) {
  const c = Number(valor);
  if (!Number.isInteger(c) || c < CUPOS.MIN || c > CUPOS.MAX) {
    throw HttpError.badRequest(`cupos inválido (${CUPOS.MIN}-${CUPOS.MAX})`);
  }
  return c;
}

async function crear(req, res) {
  const { titulo, requisitos, disponibilidad, kpi_minimo, cupos } = req.body;
  if (!titulo || !String(titulo).trim()) throw HttpError.badRequest('titulo es requerido');
  if (req.body.anios_min !== undefined
    && (Number.isNaN(Number(req.body.anios_min)) || Number(req.body.anios_min) < 0)) {
    throw HttpError.badRequest('anios_min inválido');
  }
  if (disponibilidad !== undefined && disponibilidad !== null && !DISPONIBILIDADES.includes(disponibilidad)) {
    throw HttpError.badRequest('disponibilidad inválida');
  }
  if (requisitos !== undefined && !Array.isArray(requisitos)) {
    throw HttpError.badRequest('requisitos debe ser arreglo');
  }
  const v = await Convocatoria.crear({
    titulo: String(titulo).slice(0, 120),
    descripcion: req.body.descripcion,
    anios_min: req.body.anios_min === undefined ? 0 : Number(req.body.anios_min),
    disponibilidad: disponibilidad || null,
    kpi_minimo: kpi_minimo === undefined || kpi_minimo === null
      ? Convocatoria.KPI_MINIMO_POR_DEFECTO
      : validarKpiMinimo(kpi_minimo),
    cupos: cupos === undefined || cupos === null ? CUPOS.POR_DEFECTO : validarCupos(cupos),
    requisitos: requisitos || [],
    creada_por: req.usuario.id
  });
  res.status(201).json(v);
}

async function listar(req, res) {
  let estado = req.query.estado ? String(req.query.estado) : undefined;
  if (estado && !ESTADOS_CONVOCATORIA.includes(estado)) throw HttpError.badRequest('estado inválido');
  if (req.usuario.rol === 'postulante') estado = 'abierta'; // el postulante solo ve publicadas
  const duenioId = req.usuario.rol === 'reclutador' ? req.usuario.id : undefined;
  res.json(await Convocatorias.listar(estado, duenioId));
}

async function detalle(req, res) {
  const v = await Convocatorias.detalle(Number(req.params.id));
  if (!v) throw HttpError.notFound('Convocatoria no encontrada');
  exigirDueno(req, v.creada_por);
  res.json(v);
}

async function cerrar(req, res) {
  const v = await Convocatoria.detalle(Number(req.params.id));
  if (!v) throw HttpError.notFound('Convocatoria no encontrada');
  exigirDueno(req, v.creada_por);
  res.json(await Convocatoria.cerrar(v.id));
}

async function aprobar(req, res) {
  const v = await Convocatoria.aprobar(Number(req.params.id));
  if (!v) throw HttpError.conflict('Solo se puede aprobar una convocatoria pendiente');
  res.json(v);
}

async function rechazar(req, res) {
  const v = await Convocatoria.rechazar(Number(req.params.id));
  if (!v) throw HttpError.conflict('Solo se puede rechazar una convocatoria pendiente');
  res.json(v);
}

async function eliminar(req, res) {
  const ok = await Convocatoria.eliminar(Number(req.params.id));
  if (!ok) throw HttpError.notFound('Convocatoria no encontrada');
  res.json({ mensaje: 'Convocatoria eliminada' });
}

async function ranking(req, res) {
  const r = await Convocatorias.ranking(Number(req.params.id));
  if (!r) throw HttpError.notFound('Convocatoria no encontrada');
  exigirDueno(req, r.convocatoria.creada_por);
  res.json(r);
}

// Cambia el KPI minimo (umbral) de la convocatoria: de ahi sale la lista de candidatos.
async function umbral(req, res) {
  const id = Number(req.params.id);
  const conv = await Convocatoria.detalle(id);
  if (!conv) throw HttpError.notFound('Convocatoria no encontrada');
  exigirDueno(req, conv.creada_por);
  const k = validarKpiMinimo(req.body.kpi_minimo);
  res.json(await Convocatoria.setUmbral(id, k));
}

// Cambia los cupos (vacantes) mientras la convocatoria no este cerrada. Si los
// contratados ya llenan los cupos nuevos, se cierra en el acto.
async function cupos(req, res) {
  const id = Number(req.params.id);
  const conv = await Convocatoria.detalle(id);
  if (!conv) throw HttpError.notFound('Convocatoria no encontrada');
  exigirDueno(req, conv.creada_por);
  if (conv.estado === 'cerrada' || conv.estado === 'rechazada') {
    throw HttpError.conflict('La convocatoria está cerrada: no se pueden cambiar los cupos');
  }
  const nuevos = validarCupos(req.body.cupos);
  const actualizada = await Convocatoria.setCupos(id, nuevos);
  let estado = actualizada.estado;
  let cierre = false;
  if (Number(conv.contratados) >= nuevos) {
    const cerrada = await Convocatoria.cerrar(id);
    if (cerrada) {
      estado = cerrada.estado;
      cierre = true;
    }
  }
  res.json({ ...actualizada, estado, contratados: Number(conv.contratados), cierre_automatico: cierre });
}

// El staff toma a un candidato de la lista y lo mueve por el pipeline.
// La fila la crea el staff (nadie se postula): UPSERT sobre (convocatoria, persona).
async function estadoCandidato(req, res) {
  const convId = Number(req.params.id);
  const personaId = Number(req.params.persona_id);
  const estado = String(req.body.estado || '');
  Pipeline.validarEstado(estado);

  const conv = await Convocatoria.detalle(convId);
  if (!conv) throw HttpError.notFound('Convocatoria no encontrada');
  exigirDueno(req, conv.creada_por);

  const persona = await Persona.detalle(personaId);
  if (!persona) throw HttpError.notFound('Persona no encontrada');

  const { fila, kpi_conv, convocatoria, cierre_automatico } = await Pipeline.mover({
    convocatoria: conv, persona, estado
  });
  res.json({
    ...fila,
    kpi_conv,
    estado_candidato: fila.estado,
    convocatoria,
    cierre_automatico: !!cierre_automatico
  });
}

// Postulante: que convocatorias abiertas hay y si califica. No se le oculta ninguna:
// si no pasa el umbral ve la convocatoria con el motivo.
async function misConvocatorias(req, res) {
  let personaId = null;
  if (req.usuario.rol === 'postulante') {
    const persona = await Persona.porUsuario(req.usuario.id);
    if (!persona) return res.json([]);
    personaId = persona.id;
  } else {
    personaId = Number(req.query.persona_id);
    if (!personaId) throw HttpError.badRequest('persona_id es requerido');
  }
  res.json(await Convocatorias.misConvocatorias(personaId));
}

async function resumen(req, res) {
  const duenioId = req.usuario.rol === 'reclutador' ? req.usuario.id : undefined;
  res.json(await Convocatorias.resumen(duenioId));
}

async function cola(req, res) {
  const { estado, convocatoria_id } = req.query;
  if (estado && !ESTADOS_CANDIDATO.includes(String(estado))) throw HttpError.badRequest('estado inválido');
  res.json(await Convocatoria.cola({
    estado: estado ? String(estado) : undefined,
    convocatoria_id: convocatoria_id ? Number(convocatoria_id) : undefined,
    duenioId: req.usuario.rol === 'reclutador' ? req.usuario.id : undefined
  }));
}

module.exports = {
  crear, listar, detalle, cerrar, eliminar, aprobar, rechazar, ranking,
  umbral, cupos, estadoCandidato, misConvocatorias, resumen, cola
};
