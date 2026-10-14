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

test('por debajo del minimo puntua 0 en ese requisito (sin expulsar)', async () => {
  const reqs = [{ nombre: 'python', obligatorio: true, nivel_minimo: 'avanzado' }];
  const base = {
    requisitos: reqs, dispPersona: null, anios_min: 0, disponibilidad: null, cfg: CFG,
    experiencias: []
  };
  const bajo = calcularKpiConvocatoria({ ...base, habilidades: [{ nombre: 'python', nivel: 'intermedio', anios_uso: 5 }] });
  const alto = calcularKpiConvocatoria({ ...base, habilidades: [{ nombre: 'python', nivel: 'experto', anios_uso: 5 }] });
  assert.equal(bajo.desglose.por_requisito[0].puntos, 0);
  assert.equal(bajo.desglose.por_requisito[0].cumplido, false);
  assert.ok(alto.desglose.por_requisito[0].puntos > 0);
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
