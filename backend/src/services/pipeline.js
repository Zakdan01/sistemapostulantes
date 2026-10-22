// Servicio del PIPELINE de candidatos. Ya no hay postulacion: la fila la crea el
// staff al TOMAR a alguien de la lista viva de la convocatoria. Al tomarla se congelan
// los snapshots (kpi_al_tomar, match_pct, kpi_perfil); al moverla solo cambia el estado.
const Config = require('../models/config.model');
const Convocatoria = require('../models/convocatoria.model');
const Persona = require('../models/persona.model');
const { conTransaccion } = require('../config/db');
const { HttpError } = require('../utils/errors');
const { puedeTransitar, transicionesPermitidas, ESTADOS_CANDIDATO } = require('../domain/catalogos');
const { calcularKpi } = require('./kpi');
const { calcularKpiConvocatoria } = require('./kpiConvocatoria');
const { matchPct } = require('./candidatos');

const normalizar = Convocatoria.normalizarCandidato;

function validarEstado(estado) {
  if (!ESTADOS_CANDIDATO.includes(estado)) {
    throw HttpError.badRequest(`estado inválido (${ESTADOS_CANDIDATO.join('|')})`);
  }
  return estado;
}

// Toma (o mueve) a una persona en el pipeline de una convocatoria.
//   `convocatoria`: detalle con requisitos (models/convocatoria.model.detalle)
//   `persona`: detalle con habilidades/experiencias/disponibilidad
// Devuelve { fila, kpi_conv, convocatoria, cierre_automatico }.
//
// Reglas de cupos:
// - La convocatoria cerrada/rechazada es SOLO LECTURA (409).
// - Contratar exige cupo libre y, al llenar el ultimo, la convocatoria se cierra
//   en la MISMA transaccion. El SELECT ... FOR UPDATE serializa las contrataciones
//   para que dos pedidos simultaneos no se pasen de los cupos.
async function mover({ convocatoria, persona, estado }) {
  validarEstado(estado);

  // Primera toma: se calculan y congelan los snapshots (fuera de la transaccion,
  // no dependen de la fila del pipeline).
  async function calcularSnapshots() {
    const cfg = await Config.obtenerConfig();
    const kc = calcularKpiConvocatoria({
      requisitos: convocatoria.requisitos,
      habilidades: persona.habilidades,
      experiencias: persona.experiencias,
      dispPersona: persona.disponibilidad,
      anios_min: convocatoria.anios_min,
      disponibilidad: convocatoria.disponibilidad,
      cfg
    });
    const { kpi } = calcularKpi(await Persona.conteoParaKpi(persona.id), cfg);
    return {
      kpi_al_tomar: Math.round(kc.kpi_conv),
      match_pct: matchPct(convocatoria.requisitos, persona.habilidades),
      kpi_perfil: kpi,
      kpi_conv: kc.kpi_conv
    };
  }

  let snapshot = null;
  const previo = await Convocatoria.buscarCandidato(convocatoria.id, persona.id);
  if (!previo) snapshot = await calcularSnapshots();

  return conTransaccion(async (conn) => {
    const conv = await Convocatoria.bloquearConvocatoria(conn, convocatoria.id);
    if (!conv) throw HttpError.notFound('Convocatoria no encontrada');
    if (conv.estado === 'cerrada' || conv.estado === 'rechazada') {
      throw HttpError.conflict('La convocatoria está cerrada: el pipeline es solo lectura.');
    }
    const cupos = Number(conv.cupos);
    let contratados = await Convocatoria.contarContratados(conn, conv.id);

    const estadoConv = () => ({ id: conv.id, estado: conv.estado, cupos, contratados });

    const actual = await Convocatoria.buscarCandidato(conv.id, persona.id, conn);
    if (actual) {
      // Repetir el mismo estado es un no-op (los snapshots no se recalculan).
      if (actual.estado === estado) {
        return { fila: normalizar(actual), kpi_conv: null, convocatoria: estadoConv(), cierre_automatico: false };
      }
      if (!puedeTransitar(actual.estado, estado)) {
        const permitidos = transicionesPermitidas(actual.estado);
        throw HttpError.conflict(
          `Transición inválida: ${actual.estado} → ${estado}. Permitido: ${permitidos.join(', ') || 'ninguno'}`);
      }
      if (estado === 'contratado' && contratados >= cupos) {
        throw HttpError.conflict(`Cupos completos (${contratados}/${cupos})`);
      }
      const fila = await Convocatoria.actualizarEstadoCandidato(conn, actual.id, estado);
      let cierre = false;
      if (estado === 'contratado') {
        contratados += 1;
        if (contratados >= cupos) {
          await Convocatoria.marcarCerrada(conn, conv.id);
          cierre = true;
        }
      }
      return {
        fila: normalizar(fila),
        kpi_conv: null,
        convocatoria: { id: conv.id, estado: cierre ? 'cerrada' : conv.estado, cupos, contratados },
        cierre_automatico: cierre
      };
    }

    // Primera toma (fila nueva en el pipeline).
    if (estado === 'contratado' && contratados >= cupos) {
      throw HttpError.conflict(`Cupos completos (${contratados}/${cupos})`);
    }
    const snap = snapshot || await calcularSnapshots();
    const fila = await Convocatoria.guardarCandidato(conn, {
      convocatoria_id: conv.id,
      persona_id: persona.id,
      estado,
      kpi_al_tomar: snap.kpi_al_tomar,
      match_pct: snap.match_pct,
      kpi_perfil: snap.kpi_perfil
    });
    // bitacora (eventos_postulacion ya NO define disponibilidad ni enlistado)
    await Persona.registrarEvento(conn, persona.id, persona.disponibilidad);
    let cierre = false;
    if (estado === 'contratado') {
      contratados += 1;
      if (contratados >= cupos) {
        await Convocatoria.marcarCerrada(conn, conv.id);
        cierre = true;
      }
    }
    return {
      fila: normalizar(fila),
      kpi_conv: snap.kpi_conv,
      convocatoria: { id: conv.id, estado: cierre ? 'cerrada' : conv.estado, cupos, contratados },
      cierre_automatico: cierre
    };
  });
}

module.exports = { mover, validarEstado };
