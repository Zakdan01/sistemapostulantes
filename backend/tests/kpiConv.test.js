const { test } = require('node:test');
const assert = require('node:assert');
const { calcularKpiConvocatoria } = require('../src/services/kpiConvocatoria');

const CFG = { mult_obligatorio: 2, mult_deseable: 1, peso_exp_afin: 10, tope_anios_req: 3 };

// Caso del usuario: convoca c++, A sabe todo menos c++, B solo c++ básico
test('B (solo c++ basico) supera a A (todo menos c++)', async () => {
  const reqs = [{ nombre: 'c++', obligatorio: true }];
  const a = calcularKpiConvocatoria({
    requisitos: reqs,
    habilidades: [
      { nombre: 'java', nivel: 'avanzado', anios_uso: 4 },
      { nombre: 'python', nivel: 'avanzado', anios_uso: 4 },
      { nombre: 'react', nivel: 'intermedio', anios_uso: 2 }
    ],
    experiencias: [{ empresa: 'Soft', cargo: 'Dev Java', descripcion: 'APIs java' }],
    dispPersona: 'Inmediata', anios_min: 0, disponibilidad: 'Inmediata', cfg: CFG
  });
  const b = calcularKpiConvocatoria({
    requisitos: reqs,
    habilidades: [{ nombre: 'c++', nivel: 'basico', anios_uso: 1 }],
    experiencias: [],
    dispPersona: 'Inmediata', anios_min: 0, disponibilidad: 'Inmediata', cfg: CFG
  });
  assert.ok(b.kpi_conv > a.kpi_conv, `B=${b.kpi_conv} debe superar A=${a.kpi_conv}`);
});

test('a igualdad de requisitos, nivel experto supera a basico', async () => {
  const reqs = [{ nombre: 'python', obligatorio: true }];
  const mk = (nivel) => calcularKpiConvocatoria({
    requisitos: reqs,
    habilidades: [{ nombre: 'python', nivel, anios_uso: 3 }],
    experiencias: [], dispPersona: null, anios_min: 0, disponibilidad: null, cfg: CFG
  });
  assert.ok(mk('experto').kpi_conv > mk('basico').kpi_conv);
  assert.ok(mk('basico').kpi_conv > 0);
});

test('sin obligatorios cumplidos puntua bajo pero presente (sin filtro duro)', async () => {
  const r = calcularKpiConvocatoria({
    requisitos: [{ nombre: 'cobol', obligatorio: true }],
    habilidades: [{ nombre: 'java', nivel: 'avanzado', anios_uso: 4 }],
    experiencias: [{ empresa: 'X', cargo: 'Y', descripcion: 'Z' }],
    dispPersona: null, anios_min: 0, disponibilidad: null, cfg: CFG
  });
  assert.ok(r.kpi_conv >= 0 && r.kpi_conv < 40);
  assert.ok(Array.isArray(r.desglose.por_requisito));
});

test('anios_min como string de pg ("0") no produce NaN', async () => {
  const r = calcularKpiConvocatoria({
    requisitos: [{ nombre: 'cobol', obligatorio: true }],
    habilidades: [{ nombre: 'java', nivel: 'avanzado', anios_uso: '4.0' }],
    experiencias: [],
    dispPersona: null, anios_min: '0', disponibilidad: null, cfg: {}
  });
  assert.ok(typeof r.kpi_conv === 'number' && !Number.isNaN(r.kpi_conv));
});

test('por debajo del minimo conserva cobertura y pierde calidad (sin expulsar)', async () => {
  const reqs = [{ nombre: 'python', obligatorio: true, nivel_minimo: 'avanzado' }];
  const base = {
    requisitos: reqs, dispPersona: null, anios_min: 0, disponibilidad: null, cfg: CFG,
    experiencias: []
  };
  const bajo = calcularKpiConvocatoria({ ...base, habilidades: [{ nombre: 'python', nivel: 'intermedio', anios_uso: 5 }] });
  const alto = calcularKpiConvocatoria({ ...base, habilidades: [{ nombre: 'python', nivel: 'experto', anios_uso: 5 }] });
  const reqBajo = bajo.desglose.por_requisito[0];
  assert.equal(reqBajo.cumplido, false);
  assert.equal(reqBajo.puntos_calidad, 0);
  assert.ok(reqBajo.puntos_cobertura > 0, 'la cobertura se mantiene aunque no llegue al nivel');
  assert.ok(reqBajo.puntos > 0);
  assert.ok(alto.desglose.por_requisito[0].puntos > reqBajo.puntos);
  assert.ok(alto.kpi_conv > bajo.kpi_conv);
});

test('sin minimo (NULL) mantiene conducta anterior', async () => {
  const r = calcularKpiConvocatoria({
    requisitos: [{ nombre: 'python', obligatorio: true, nivel_minimo: null }],
    habilidades: [{ nombre: 'python', nivel: 'basico', anios_uso: 3 }],
    experiencias: [], dispPersona: null, anios_min: 0, disponibilidad: null, cfg: CFG
  });
  assert.ok(r.desglose.por_requisito[0].puntos > 0);
});

test('experiencia afin suma mas que trayectoria general', async () => {
  const reqs = [{ nombre: 'react', obligatorio: true }];
  const base = {
    requisitos: reqs,
    habilidades: [{ nombre: 'react', nivel: 'intermedio', anios_uso: 2 }],
    dispPersona: null, anios_min: 0, disponibilidad: null, cfg: CFG
  };
  const afin = calcularKpiConvocatoria({ ...base, experiencias: [{ empresa: 'A', cargo: 'Dev', descripcion: 'Dashboards React' }] });
  const general = calcularKpiConvocatoria({ ...base, experiencias: [{ empresa: 'A', cargo: 'Dev', descripcion: 'Soporte redes' }] });
  assert.ok(afin.kpi_conv > general.kpi_conv);
});

test('tener todos los lenguajes basicos supera a tener uno solo experto', async () => {
  const reqs = [
    { nombre: 'python', obligatorio: true },
    { nombre: 'react', obligatorio: true }
  ];
  const base = { requisitos: reqs, experiencias: [], dispPersona: null, anios_min: 0, disponibilidad: null, cfg: CFG };
  const todos = calcularKpiConvocatoria({
    ...base,
    habilidades: [
      { nombre: 'python', nivel: 'basico', anios_uso: 3 },
      { nombre: 'react', nivel: 'basico', anios_uso: 3 }
    ]
  });
  const uno = calcularKpiConvocatoria({
    ...base,
    habilidades: [{ nombre: 'python', nivel: 'experto', anios_uso: 3 }]
  });
  assert.equal(todos.desglose.cobertura, 1);
  assert.ok(todos.desglose.calidad > 0);
  assert.ok(todos.kpi_conv > uno.kpi_conv, `todos=${todos.kpi_conv} debe superar a uno=${uno.kpi_conv}`);
  assert.equal(uno.desglose.por_requisito.find((r) => r.nombre === 'react').puntos, 0);
});

test('faltar un requisito obligatorio baja la cobertura y el puntaje', async () => {
  const reqs = [
    { nombre: 'python', obligatorio: true },
    { nombre: 'react', obligatorio: true }
  ];
  const base = { requisitos: reqs, experiencias: [], dispPersona: null, anios_min: 0, disponibilidad: null, cfg: CFG };
  const completo = calcularKpiConvocatoria({
    ...base,
    habilidades: [
      { nombre: 'python', nivel: 'intermedio', anios_uso: 3 },
      { nombre: 'react', nivel: 'intermedio', anios_uso: 3 }
    ]
  });
  const incompleto = calcularKpiConvocatoria({
    ...base,
    habilidades: [{ nombre: 'python', nivel: 'intermedio', anios_uso: 3 }]
  });
  assert.ok(incompleto.desglose.cobertura < completo.desglose.cobertura);
  assert.ok(incompleto.kpi_conv < completo.kpi_conv);
});

test('el factor de anios_min reduce el bloque de requisitos', async () => {
  const base = {
    requisitos: [{ nombre: 'python', obligatorio: true }],
    habilidades: [{ nombre: 'python', nivel: 'experto', anios_uso: 1 }],
    experiencias: [], dispPersona: null, disponibilidad: null, cfg: CFG
  };
  const sinMin = calcularKpiConvocatoria({ ...base, anios_min: 0 });
  const conMin = calcularKpiConvocatoria({ ...base, anios_min: 5 });
  assert.equal(conMin.desglose.factor_anios_min, 0.2);
  assert.ok(conMin.desglose.puntos_requisitos < sinMin.desglose.puntos_requisitos);
  assert.ok(conMin.kpi_conv < sinMin.kpi_conv);
});

test('sin requisitos conserva la base neutral de 80 aunque haya anios_min', async () => {
  const r = calcularKpiConvocatoria({
    requisitos: [], habilidades: [], experiencias: [],
    dispPersona: null, anios_min: 5, disponibilidad: null, cfg: CFG
  });
  assert.equal(r.desglose.puntos_requisitos, 80);
  assert.equal(r.desglose.factor_anios_min, 1);
  assert.equal(r.kpi_conv, 90);
  assert.equal(r.desglose.puntos_cobertura, 40, 'sin requisitos la cobertura neutral es 40');
  assert.equal(r.desglose.puntos_calidad, 40, 'sin requisitos la calidad neutral es 40');
});

test('puntos de cobertura y calidad suman el total de requisitos', async () => {
  const r = calcularKpiConvocatoria({
    requisitos: [
      { nombre: 'python', obligatorio: true, nivel_minimo: 'basico' },
      { nombre: 'react', obligatorio: false, nivel_minimo: null }
    ],
    habilidades: [
      { nombre: 'python', nivel: 'experto', anios_uso: 3 },
      { nombre: 'git', nivel: 'basico', anios_uso: 1 }
    ],
    experiencias: [], dispPersona: null, anios_min: 0, disponibilidad: null, cfg: CFG
  });
  const d = r.desglose;
  assert.ok(d.puntos_cobertura > 0 && d.puntos_cobertura < 40);
  assert.ok(d.puntos_calidad > 0 && d.puntos_calidad < 40);
  assert.equal(
    Math.round((d.puntos_cobertura + d.puntos_calidad) * 100) / 100,
    d.puntos_requisitos,
    'cobertura + calidad debe ser exactamente el total de requisitos'
  );
  assert.ok(d.puntos_requisitos >= 0 && d.puntos_requisitos <= 80);
});

test('cobertura completa maximo 40 y calidad maxima 40', async () => {
  const r = calcularKpiConvocatoria({
    requisitos: [{ nombre: 'python', obligatorio: true, nivel_minimo: 'experto' }],
    habilidades: [{ nombre: 'python', nivel: 'experto', anios_uso: 3 }],
    experiencias: [], dispPersona: null, anios_min: 0, disponibilidad: null, cfg: CFG
  });
  assert.equal(r.desglose.puntos_cobertura, 40);
  assert.equal(r.desglose.puntos_calidad, 40);
  assert.equal(r.desglose.puntos_requisitos, 80);
});

test('el factor de anios_min escala tambien cobertura y calidad', async () => {
  const base = {
    requisitos: [{ nombre: 'python', obligatorio: true }],
    habilidades: [{ nombre: 'python', nivel: 'experto', anios_uso: 1 }],
    experiencias: [], dispPersona: null, disponibilidad: null, cfg: CFG
  };
  const sinMin = calcularKpiConvocatoria({ ...base, anios_min: 0 });
  const conMin = calcularKpiConvocatoria({ ...base, anios_min: 5 });
  assert.equal(conMin.desglose.puntos_cobertura, Math.round(sinMin.desglose.puntos_cobertura * 0.2 * 100) / 100);
  assert.equal(conMin.desglose.puntos_calidad, Math.round(sinMin.desglose.puntos_calidad * 0.2 * 100) / 100);
});
