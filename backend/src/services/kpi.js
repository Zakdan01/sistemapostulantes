/**
 * Calificación del perfil (kpi_perfil):
 * Mide el nivel de completitud del CV en 5 dimensiones (20% cada una):
 * - Experiencias >= 1
 * - Formaciones >= 1
 * - Habilidades/Tecnologías >= 1
 * - Disponibilidad declarada
 * - Datos de contacto (al menos uno: correo/teléfono/dirección/linkedin/github/portafolio_url)
 *
 * NOTA DE ARQUITECTURA:
 * El ordenamiento del ranking principal se realiza por `kpi_conv` (calculado en
 * `kpiConvocatoria.js` en base a requisitos y `configuracion_kpi`).
 * Este `kpi_perfil` actúa como indicador de calidad/completitud general y criterio
 * de desempate en caso de puntuaciones idénticas.
 */
const DIAS_ACTUALIDAD = 180;

function esActual(fecha) {
  if (!fecha) return false;
  const t = new Date(fecha).getTime();
  if (!Number.isFinite(t)) return false;
  return Date.now() - t <= DIAS_ACTUALIDAD * 24 * 60 * 60 * 1000;
}

function tieneContacto(p = {}) {
  return !!(p.correo || p.telefono || p.direccion || p.linkedin || p.github || p.portafolio_url);
}

function calcularKpi(conteo = {}, cfg = {}, persona = null) {
  const c = conteo || {};
  const p = persona || c || {};

  const cumple = {
    experiencia: Number(c.total_experiencias || p.total_experiencias || 0) > 0,
    formacion: Number(c.total_formaciones || p.total_formaciones || 0) > 0,
    tecnologias: Number(c.total_habilidades || p.total_habilidades || 0) > 0,
    nivel: !!(p.disponibilidad || c.disponibilidad),
    actualidad: tieneContacto(p) || tieneContacto(c)
  };

  const checks = [cumple.experiencia, cumple.formacion, cumple.tecnologias, cumple.nivel, cumple.actualidad];
  const completos = checks.filter(Boolean).length;
  const kpi = Math.round((completos / checks.length) * 100);

  const clasificacion = kpi >= 80 ? 'Alto'
    : kpi >= 60 ? 'Medio' : 'Bajo';
  return { kpi, clasificacion, cumple };
}

module.exports = { calcularKpi, DIAS_ACTUALIDAD, esActual, tieneContacto };
