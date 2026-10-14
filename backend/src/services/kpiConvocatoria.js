// KPI de convocatoria: puntaje 0..100 calculado CONTRA los requisitos.
// - Cada requisito reparte puntos según obligatoriedad (mult_obligatorio x2 por defecto),
//   nivel (experto 1 ... principiante 0.1) y años de uso (tope_anios_req, default 3).
// - Experiencia afín (menciona alguna tecnología pedida): +peso_exp_afin (10);
//   con trayectoria pero no afín: +5; sin experiencia: 0.
// - Disponibilidad: +10 si su último evento coincide con la pedida (o la
//   convocatoria no pide ninguna); si no, 0. Sin requisitos: parte neutral 80.
// - Sin filtro duro: quien no cumple nada igual puntúa (perfil/experiencia) y
//   queda al fondo, nunca fuera.
const NIVEL_FACTOR = { principiante: 0.1, basico: 0.25, intermedio: 0.5, avanzado: 0.75, experto: 1 };
const NIVEL_ORDEN = { principiante: 1, basico: 2, intermedio: 3, avanzado: 4, experto: 5 };

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

  const nO = reqs.filter((r) => r.obligatorio).length;
  const nD = reqs.length - nO;
  const denom = multOb * nO + multDe * nD;
  const wOb = denom ? (80 * multOb) / denom : 0;
  const wDe = denom ? (80 * multDe) / denom : 0;

  let puntosReq = reqs.length ? 0 : 80;
  const porRequisito = [];
  for (const r of reqs) {
    const nombre = String(r.nombre || '').toLowerCase();
    const h = porHab[nombre];
    const w = r.obligatorio ? wOb : wDe;
    const minimo = r.nivel_minimo ? String(r.nivel_minimo).toLowerCase() : null;
    const rangoH = NIVEL_ORDEN[String((h && h.nivel) || '').toLowerCase()] || 0;
    const rangoMin = minimo ? (NIVEL_ORDEN[minimo] || 0) : 0;
    if (!h || (rangoMin && rangoH < rangoMin)) {
      porRequisito.push({ nombre: r.nombre, obligatorio: !!r.obligatorio, nivel_minimo: r.nivel_minimo || null, cumplido: false, puntos: 0 });
      continue;
    }
    const fNivel = NIVEL_FACTOR[String(h.nivel || '').toLowerCase()] ?? 0.5;
    const fAnios = Math.min(Number(h.anios_uso) || 0, tope) / tope;
    const puntos = Math.round(w * fNivel * fAnios * 100) / 100;
    puntosReq += puntos;
    porRequisito.push({ nombre: r.nombre, obligatorio: !!r.obligatorio, nivel_minimo: r.nivel_minimo || null, cumplido: true, puntos });
  }

  const textosExp = exps.map((e) => `${e.empresa || ''} ${e.cargo || ''} ${e.descripcion || ''}`.toLowerCase());
  const nombresReq = reqs.map((r) => String(r.nombre || '').toLowerCase()).filter(Boolean);
  const afin = nombresReq.length > 0 && textosExp.some((t) => nombresReq.some((n) => n && (t.includes(n) || n.includes(t))));
  const puntosExp = afin ? pesoExp : (exps.length ? Math.round((pesoExp / 2) * 100) / 100 : 0);

  let puntosDisp;
  if (!disponibilidad) puntosDisp = 10;
  else puntosDisp = dispPersona && dispPersona === disponibilidad ? 10 : 0;

  // anios_min: si su mejor año en lo pedido no llega, escala la parte de requisitos
  // (pg devuelve DECIMAL como string: se coerce a número primero)
  let mejorAnio = 0;
  for (const r of reqs) {
    const h = porHab[String(r.nombre || '').toLowerCase()];
    if (h) mejorAnio = Math.max(mejorAnio, Number(h.anios_uso) || 0);
  }
  const mn = Number(anios_min) || 0;
  const fMin = mn ? Math.min(mejorAnio / mn, 1) : 1;
  puntosReq = Math.round(puntosReq * fMin * 100) / 100;

  const kpiConv = Math.round((puntosReq + puntosExp + puntosDisp) * 100) / 100;
  return {
    kpi_conv: Math.min(kpiConv, 100),
    desglose: { por_requisito: porRequisito, experiencia_afin: afin, puntos_exp: puntosExp, puntos_disp: puntosDisp, factor_anios_min: Math.round(fMin * 100) / 100 }
  };
}

module.exports = { calcularKpiConvocatoria, NIVEL_FACTOR };
