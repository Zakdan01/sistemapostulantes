import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  separarRequisitos,
  cuposCubiertos,
  mensajeConvocatoria,
  esRutaCorporativa,
  resumenPublico,
  tecnologiasPublicas
} from '../src/lib/corporativo.js';

function luminancia(hex) {
  const canales = hex.replace('#', '').match(/../g).map((x) => parseInt(x, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * canales[0] + 0.7152 * canales[1] + 0.0722 * canales[2];
}

function contraste(a, b) {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
}

test('separarRequisitos distingue obligatorios de deseables por el sufijo exacto', () => {
  const resultado = separarRequisitos(['python', 'react (deseable)', 'sql', 'figma (deseable)']);
  assert.deepEqual(resultado.obligatorios, ['python', 'sql']);
  assert.deepEqual(resultado.deseables, ['react', 'figma']);
});

test('cuposCubiertos resta las vacantes y nunca baja de cero', () => {
  assert.equal(cuposCubiertos({ cupos: 2, vacantes: 1 }), 1);
  assert.equal(cuposCubiertos({ cupos: '3', vacantes: '3' }), 0);
  assert.equal(cuposCubiertos({ cupos: 1, vacantes: 4 }), 0);
});

test('mensajeConvocatoria arma el mailto con asunto y cuerpo codificados', () => {
  const datos = {
    nombre: '  Ana Pérez  ',
    empresa: 'Acme',
    correo: 'ana@acme.test',
    puesto: 'Desarrollador Junior',
    tipo: 'Pasantía',
    detalle: 'Python y postgres'
  };
  const mensaje = mensajeConvocatoria(datos, 'contacto@consultora.com');

  assert.equal(mensaje.asunto, 'Nueva convocatoria · Desarrollador Junior · Acme');
  assert.match(mensaje.cuerpo, /Nombre: Ana Pérez/);
  assert.match(mensaje.cuerpo, /Detalle del perfil: Python y postgres/);
  assert.equal(
    mensaje.mailto,
    `mailto:contacto@consultora.com?subject=${encodeURIComponent(mensaje.asunto)}&body=${encodeURIComponent(mensaje.cuerpo)}`
  );
});

test('los helpers toleran listas y valores ausentes', () => {
  assert.deepEqual(separarRequisitos(), { obligatorios: [], deseables: [] });
  assert.deepEqual(separarRequisitos(null), { obligatorios: [], deseables: [] });
  assert.equal(cuposCubiertos({}), 0);
  assert.equal(cuposCubiertos({ cupos: 2, vacantes: undefined }), 2);
  const vacio = mensajeConvocatoria({}, 'contacto@consultora.com');
  assert.match(vacio.asunto, /Nueva convocatoria ·  · $/);
  assert.ok(vacio.mailto.startsWith('mailto:contacto@consultora.com?'));
});

test('esRutaCorporativa separa las páginas del sitio de los formularios de acceso', () => {
  for (const ruta of ['/', '/convocatorias', '/empresas', '/contacto']) {
    assert.equal(esRutaCorporativa(ruta), true, ruta);
  }
  for (const ruta of ['/login', '/registro']) {
    assert.equal(esRutaCorporativa(ruta), false, ruta);
  }
  assert.equal(esRutaCorporativa('/convocatorias/3'), true);
});

test('resumenPublico deriva cifras del catálogo público sin inventar datos', () => {
  const lista = [
    { tipo: 'Pasantía', cupos: 3, vacantes: 2, requisitos: ['python', 'react (deseable)'] },
    { tipo: 'De planta', cupos: 1, vacantes: 1, requisitos: ['python', 'sql'] }
  ];
  assert.deepEqual(resumenPublico(lista), {
    convocatorias: 2,
    vacantes: 3,
    tecnologias: 3,
    modalidades: 2
  });
  assert.deepEqual(resumenPublico(null), {
    convocatorias: 0,
    vacantes: 0,
    tecnologias: 0,
    modalidades: 0
  });
});

test('tecnologiasPublicas quita el sufijo deseable, ordena y limita', () => {
  const lista = [{ requisitos: ['react (deseable)', 'Python', 'SQL', 'Python'] }];
  assert.deepEqual(tecnologiasPublicas(lista), ['Python', 'react', 'SQL']);
  assert.deepEqual(tecnologiasPublicas(lista, 2), ['Python', 'react']);
  assert.deepEqual(tecnologiasPublicas(undefined), []);
});

test('el texto --muted cumple contraste AA sobre --surface en ambas hojas del marco', () => {
  for (const archivo of ['corporativo.css', 'marco.css']) {
    const css = readFileSync(new URL(`../public/${archivo}`, import.meta.url), 'utf8');
    const variable = (nombre) => css.match(new RegExp(`--${nombre}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1];
    const muted = variable('muted');
    const surface = variable('surface');
    assert.ok(muted && surface, `${archivo} debe definir --muted y --surface`);
    assert.ok(
      contraste(muted, surface) >= 4.5,
      `${archivo}: contraste ${contraste(muted, surface).toFixed(2)} de ${muted} sobre ${surface}`
    );
  }
});
