// KPI v1 (N1): cada criterio cumplido suma su peso (sobre 100).
// cumple: experiencia (anios_max>=anios_referencia o total_exp>0), formacion, tecnologias,
// nivel (al menos 1 intermedio+), actualidad (trabajo actual o perfil actualizado hace poco).
// La actualidad ya NO se mide con "se postuló" (ya no existe la postulacion): se mide con
// que el postulante tenga un trabajo actual o que haya actualizado su perfil hace <= 180 días.
const DIAS_ACTUALIDAD = 180;

function esActual(fecha) {
  if (!fecha) return false;
  const t = new Date(fecha).getTime();
  if (!Number.isFinite(t)) return false;
  return Date.now() - t <= DIAS_ACTUALIDAD * 24 * 60 * 60 * 1000;
}

function calcularKpi(conteo, cfg) {
  const cumple = {
    experiencia: Number(conteo.anios_max || 0) >= Number(cfg.anios_referencia || 5) || Number(conteo.total_experiencias || 0) > 0,
    formacion: Number(conteo.total_formaciones || 0) > 0,
    tecnologias: Number(conteo.total_habilidades || 0) > 0,
    nivel: Number(conteo.nivel_alto || 0) > 0,
    actualidad: Number(conteo.actuales || 0) > 0 || esActual(conteo.actualizado_en)
  };
  let kpi = 0;
  if (cumple.experiencia) kpi += Number(cfg.peso_experiencia || 0);
  if (cumple.formacion) kpi += Number(cfg.peso_formacion || 0);
  if (cumple.tecnologias) kpi += Number(cfg.peso_tecnologias || 0);
  if (cumple.nivel) kpi += Number(cfg.peso_nivel || 0);
  if (cumple.actualidad) kpi += Number(cfg.peso_actualidad || 0);
  const clasificacion = kpi >= Number(cfg.umbral_alto || 80) ? 'Alto'
    : kpi >= Number(cfg.umbral_medio || 50) ? 'Medio' : 'Bajo';
  return { kpi, clasificacion, cumple };
}

module.exports = { calcularKpi, DIAS_ACTUALIDAD, esActual };
