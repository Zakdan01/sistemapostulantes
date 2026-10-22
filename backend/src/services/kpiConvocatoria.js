// KPI de convocatoria: puntaje 0..100 calculado CONTRA los requisitos.
// - Cada requisito pesa segun obligatoriedad (mult_obligatorio x2 por defecto).
// - Ese peso se divide 50% cobertura (tiene la tecnologia) + 50% calidad
//   (nivel minimo, factor de nivel y años de uso hasta tope_anios_req).
// - Años minimos: escala el bloque de requisitos por mejor_anio / anios_min.
// - Experiencia afin +peso_exp_afin; trayectoria general +mitad; sin experiencia 0.
// - Disponibilidad +10 si coincide (o la convocatoria no pide ninguna).
// - Sin filtro duro: quien no cumple nada igual puntua y queda al fondo.
const {
  NIVEL_FACTOR, NIVEL_ORDEN, PARTE_COBERTURA, PUNTOS_REQUISITOS, PUNTOS_DISPONIBILIDAD
} = require('../domain/catalogos');

function redondear(n, decimales = 2) {
  const f = 10 ** decimales;
  return Math.round(n * f) / f;
}

// Peso maximo de cada requisito dentro de los PUNTOS_REQUISITOS, segun su obligatoriedad.
// Lo usa el calculo y tambien la API (para que el frontend no repita la formula).
function pesosDeRequisitos(requisitos, cfg) {
  const c = cfg || {};
  const multOb = Number(c.mult_obligatorio ?? 2);
  const multDe = Number(c.mult_deseable ?? 1);
  const reqs = requisitos || [];
  const nO = reqs.filter((r) => r.obligatorio).length;
  const nD = reqs.length - nO;
  const denom = multOb * nO + multDe * nD;
  return reqs.map((r) => (denom ? (PUNTOS_REQUISITOS * (r.obligatorio ? multOb : multDe)) / denom : 0));
}

function calcularKpiConvocatoria({ requisitos, habilidades, experiencias, dispPersona, anios_min, disponibilidad, cfg }) {
  const c = cfg || {};
  const multOb = Number(c.mult_obligatorio ?? 2);
  const multDe = Number(c.mult_deseable ?? 1);
  const pesoExp = Number(c.peso_exp_afin ?? 10);
  const tope = Number(c.tope_anios_req ?? 3) || 3;
  const reqs = requisitos || [];
  const habs = habilidades || [];
  const exps = experiencias || [];
  const porHab = {};
  for (const h of habs) porHab[String(h.nombre || '').toLowerCase()] = h;

  const pesos = pesosDeRequisitos(reqs, cfg);

  let puntosReq = 0;
  let coberturaPonderada = 0;
  let calidadPonderada = 0;
  let mejorAnio = 0;
  const porRequisito = [];

  for (const [i, r] of reqs.entries()) {
    const nombre = String(r.nombre || '').toLowerCase();
    const h = porHab[nombre];
    const w = pesos[i];
    const minimo = r.nivel_minimo ? String(r.nivel_minimo).toLowerCase() : null;
    const rangoH = NIVEL_ORDEN[String((h && h.nivel) || '').toLowerCase()] || 0;
    const rangoMin = minimo ? (NIVEL_ORDEN[minimo] || 0) : 0;
    const presente = !!h;
    const cumpleNivel = presente && (!rangoMin || rangoH >= rangoMin);
    const anios = presente ? Number(h.anios_uso) || 0 : 0;
    const fNivel = presente ? (NIVEL_FACTOR[String(h.nivel || '').toLowerCase()] ?? 0.5) : 0;
    const fAnios = presente ? Math.min(anios, tope) / tope : 0;
    const calidad = cumpleNivel ? fNivel * fAnios : 0;

    const puntosCobertura = w * PARTE_COBERTURA * (presente ? 1 : 0);
    const puntosCalidad = w * (1 - PARTE_COBERTURA) * calidad;
    const puntos = puntosCobertura + puntosCalidad;

    puntosReq += puntos;
    coberturaPonderada += w * (presente ? 1 : 0);
    calidadPonderada += w * calidad;
    if (presente) mejorAnio = Math.max(mejorAnio, anios);

    porRequisito.push({
      nombre: r.nombre,
      obligatorio: !!r.obligatorio,
      nivel_minimo: r.nivel_minimo || null,
      presente,
      nivel: presente ? (h.nivel || null) : null,
      anios_uso: redondear(anios),
      cumplido: cumpleNivel,
      peso_maximo: redondear(w),
      puntos_cobertura: redondear(puntosCobertura),
      puntos_calidad: redondear(puntosCalidad),
      puntos: redondear(puntos)
    });
  }

  // puntos parciales (0..40 c/u): cobertura y calidad ANTES del factor de anios_min
  let puntosCobertura = reqs.length ? coberturaPonderada * PARTE_COBERTURA : PUNTOS_REQUISITOS * PARTE_COBERTURA;
  let puntosCalidad = reqs.length ? calidadPonderada * (1 - PARTE_COBERTURA) : PUNTOS_REQUISITOS * (1 - PARTE_COBERTURA);

  const pesoTotalReqs = pesos.reduce((a, b) => a + b, 0);
  const cobertura = reqs.length ? (pesoTotalReqs ? coberturaPonderada / pesoTotalReqs : 0) : 1;
  const calidad = reqs.length ? (pesoTotalReqs ? calidadPonderada / pesoTotalReqs : 0) : 1;

  const textosExp = exps.map((e) => `${e.empresa || ''} ${e.cargo || ''} ${e.descripcion || ''}`.toLowerCase());
  const nombresReq = reqs.map((r) => String(r.nombre || '').toLowerCase()).filter(Boolean);
  const afin = nombresReq.length > 0 && textosExp.some((t) => nombresReq.some((n) => n && (t.includes(n) || n.includes(t))));
  const puntosExp = afin ? pesoExp : (exps.length ? redondear(pesoExp / 2) : 0);

  let puntosDisp;
  if (!disponibilidad) puntosDisp = PUNTOS_DISPONIBILIDAD;
  else puntosDisp = dispPersona && dispPersona === disponibilidad ? PUNTOS_DISPONIBILIDAD : 0;

  // anios_min: si su mejor año en lo pedido no llega, escala el bloque de requisitos.
  const mn = Number(anios_min) || 0;
  const fMin = reqs.length && mn ? Math.min(mejorAnio / mn, 1) : 1;
  puntosCobertura = redondear(puntosCobertura * fMin);
  puntosCalidad = redondear(puntosCalidad * fMin);
  // el total de requisitos es exactamente la suma de sus dos parciales
  puntosReq = redondear(puntosCobertura + puntosCalidad);

  const kpiConv = redondear(puntosReq + puntosExp + puntosDisp);
  return {
    kpi_conv: Math.min(kpiConv, 100),
    desglose: {
      por_requisito: porRequisito,
      cobertura: redondear(cobertura, 3),
      calidad: redondear(calidad, 3),
      puntos_cobertura: puntosCobertura,
      puntos_calidad: puntosCalidad,
      puntos_requisitos: puntosReq,
      experiencia_afin: afin,
      puntos_exp: redondear(puntosExp),
      puntos_disp: redondear(puntosDisp),
      mejor_anio: redondear(mejorAnio),
      factor_anios_min: redondear(fMin, 3)
    }
  };
}

module.exports = { calcularKpiConvocatoria, pesosDeRequisitos };
