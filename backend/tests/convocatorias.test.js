const { test, before } = require('node:test');
const assert = require('node:assert');

const BASE = process.env.API_URL || 'http://localhost:3000';
let admin = '';
let rec1 = '';
let rec2 = '';
let postulante = '';
let convocatoriaId = null;   // convocatoria abierta usada en el pipeline
let altaId = null;           // convocatoria con umbral 100 (nadie califica)
const TITULO = `Convocatoria Test QA ${Date.now()}`;
const PASSWORD = 'Admin123!';

async function api(path, opts = {}) {
  const r = await fetch(BASE + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  });
  let body = null;
  try { body = await r.json(); } catch { body = null; }
  return { status: r.status, body };
}

async function login(correo) {
  const r = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ correo, password: PASSWORD }) });
  assert.equal(r.status, 200, `login ${correo}`);
  return r.body.token;
}

const auth = (t) => ({ Authorization: `Bearer ${t}` });

// Crea una convocatoria, la publica y devuelve su id.
// Por defecto 5 cupos para que los tests del pipeline puedan contratar sin cerrarla.
async function crearYPublicar(body, token = admin) {
  const r = await api('/api/convocatorias', {
    method: 'POST', headers: auth(token), body: JSON.stringify({ cupos: 5, ...body })
  });
  assert.equal(r.status, 201, `crear convocatoria: ${JSON.stringify(r.body)}`);
  const ap = await api(`/api/convocatorias/${r.body.id}/aprobar`, { method: 'PATCH', headers: auth(admin) });
  assert.equal(ap.status, 200, 'aprobar convocatoria');
  return r.body.id;
}

before(async () => {
  admin = await login('admin@consultora.com');
  rec1 = await login('reclutador1@consultora.com');
  rec2 = await login('reclutador2@consultora.com');
  postulante = await login('postulante04@test.com');
});

// ---------------------------------------------------------------- invocaciones

test('crear convocatoria con requisitos', async () => {
  const r = await api('/api/convocatorias', {
    method: 'POST',
    headers: auth(admin),
    body: JSON.stringify({
      titulo: TITULO, descripcion: 'Convocatoria de prueba', anios_min: 1,
      requisitos: [{ nombre: 'javascript', obligatorio: true }, { nombre: 'react', obligatorio: false }]
    })
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.titulo, TITULO);
  assert.equal(r.body.requisitos.length, 2);
  assert.equal(r.body.estado, 'pendiente');
  assert.equal(r.body.kpi_minimo, 25, 'kpi_minimo por defecto');
  assert.equal(r.body.cupos, 1, 'cupos por defecto');
  convocatoriaId = r.body.id;
  const ap0 = await api(`/api/convocatorias/${convocatoriaId}/aprobar`, { method: 'PATCH', headers: auth(admin) });
  assert.equal(ap0.body.estado, 'abierta');
  // Los tests del pipeline contratan: subimos los cupos para que no se cierre sola.
  const cu = await api(`/api/convocatorias/${convocatoriaId}/cupos`, {
    method: 'PATCH', headers: auth(admin), body: JSON.stringify({ cupos: 5 })
  });
  assert.equal(cu.status, 200);
  assert.equal(cu.body.cupos, 5);
  assert.equal(cu.body.estado, 'abierta');
});

test('alias viejo /vacantes sigue funcionando', async () => {
  const r = await api('/api/vacantes', { headers: auth(admin) });
  assert.equal(r.status, 200);
  assert.ok(r.body.some((v) => v.id === convocatoriaId));
});

test('crear con tecnologia nueva la agrega al catalogo (default otro)', async () => {
  const nueva = `techtest${Date.now()}`;
  const r = await api('/api/convocatorias', {
    method: 'POST',
    headers: auth(admin),
    body: JSON.stringify({ titulo: `Conv ${nueva}`, requisitos: [{ nombre: nueva, obligatorio: false }] })
  });
  assert.equal(r.status, 201);
  const t = await api('/api/tecnologias');
  assert.ok(t.body.some((x) => x.nombre === nueva));
  await api(`/api/convocatorias/${r.body.id}`, { method: 'DELETE', headers: auth(admin) });
  const { pool } = require('../src/config/db');
  await pool.query("DELETE FROM tecnologias WHERE nombre=$1 AND NOT EXISTS (SELECT 1 FROM habilidades_postulante WHERE tecnologia_id=tecnologias.id) AND NOT EXISTS (SELECT 1 FROM convocatorias_requisitos WHERE tecnologia_id=tecnologias.id)", [nueva]);
});

test('crear con nivel_minimo invalido 400 y omitido usa basico', async () => {
  const bad = await api('/api/convocatorias', {
    method: 'POST', headers: auth(admin),
    body: JSON.stringify({ titulo: `Conv Bad ${Date.now()}`, requisitos: [{ nombre: 'java', nivel_minimo: 'legendario' }] })
  });
  assert.equal(bad.status, 400);
  const ok = await api('/api/convocatorias', {
    method: 'POST', headers: auth(admin),
    body: JSON.stringify({ titulo: `Conv Min ${Date.now()}`, requisitos: [{ nombre: 'java', obligatorio: true }] })
  });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.requisitos[0].nivel_minimo, 'basico');
  await api(`/api/convocatorias/${ok.body.id}`, { method: 'DELETE', headers: auth(admin) });
});

test('crear con kpi_minimo fuera de rango 400', async () => {
  for (const k of [150, -1, 'abc', 12.5]) {
    const r = await api('/api/convocatorias', {
      method: 'POST', headers: auth(admin),
      body: JSON.stringify({ titulo: `Conv Umbral ${Date.now()}`, kpi_minimo: k })
    });
    assert.equal(r.status, 400, `kpi_minimo=${k} deberia ser 400`);
  }
  const ok = await api('/api/convocatorias', {
    method: 'POST', headers: auth(admin),
    body: JSON.stringify({ titulo: `Conv Umbral OK ${Date.now()}`, kpi_minimo: 40 })
  });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.kpi_minimo, 40);
  await api(`/api/convocatorias/${ok.body.id}`, { method: 'DELETE', headers: auth(admin) });
});

// ------------------------------------------------------- la postulacion desaparecio

test('POST /convocatorias/:id/postular ya no existe (404)', async () => {
  const r = await api(`/api/convocatorias/${convocatoriaId}/postular`, {
    method: 'POST', headers: auth(postulante), body: JSON.stringify({})
  });
  assert.equal(r.status, 404);
});

test('GET /mis-postulaciones ya no existe (404)', async () => {
  const r = await api('/api/mis-postulaciones', { headers: auth(postulante) });
  assert.equal(r.status, 404);
});

test('PATCH /postulaciones/:id/estado ya no existe (404)', async () => {
  const r = await api('/api/postulaciones/1/estado', {
    method: 'PATCH', headers: auth(admin), body: JSON.stringify({ estado: 'consulta' })
  });
  assert.equal(r.status, 404);
});

// ---------------------------------------------------------------- lista viva

test('listar convocatorias trae total_candidatos (vivo) y total_postulados', async () => {
  const r = await api('/api/convocatorias', { headers: auth(admin) });
  assert.equal(r.status, 200);
  const v = r.body.find((x) => x.id === convocatoriaId);
  assert.ok(v, 'la convocatoria existe en la lista');
  assert.ok(typeof v.total_candidatos === 'number');
  assert.ok(typeof v.total_postulados === 'number');
  assert.equal(v.kpi_minimo, 25);
  assert.equal(v.cupos, 5);
  assert.equal(v.contratados, 0);
  assert.equal(v.disponibles, 5);
  assert.equal(v.completa, false);
});

test('ranking arma la lista sola: nadie postula y todos los que pasan el umbral aparecen', async () => {
  // umbral 0 => entra todo el padron
  const id = await crearYPublicar({
    titulo: `Conv Sin Umbral ${Date.now()}`,
    kpi_minimo: 0,
    requisitos: [{ nombre: 'javascript', obligatorio: true }]
  });
  const r = await api(`/api/convocatorias/${id}/ranking`, { headers: auth(admin) });
  assert.equal(r.status, 200);
  assert.equal(r.body.total, r.body.total_patron, 'con umbral 0 entra todo el padron');
  assert.ok(r.body.total_patron >= 20, 'el padron tiene a los postulantes del seed');
  assert.equal(r.body.excluidos.length, 0);
  assert.equal(r.body.umbral, 0);
  assert.ok(r.body.resultados.every((p) => typeof p.persona_id === 'number'));
  // el que tiene mas KPI va primero
  for (let i = 1; i < r.body.resultados.length; i++) {
    assert.ok(r.body.resultados[i - 1].kpi_conv >= r.body.resultados[i].kpi_conv);
  }
  await api(`/api/convocatorias/${id}`, { method: 'DELETE', headers: auth(admin) });
});

test('quien no pasa el umbral NO queda oculto: sale en excluidos con motivo', async () => {
  altaId = await crearYPublicar({
    titulo: `Conv Imposible ${Date.now()}`,
    kpi_minimo: 100,
    requisitos: [{ nombre: 'cobol', obligatorio: true }]
  });
  const r = await api(`/api/convocatorias/${altaId}/ranking`, { headers: auth(admin) });
  assert.equal(r.status, 200);
  assert.equal(r.body.total, 0, 'nadie llega a 100 puntos');
  assert.equal(r.body.excluidos.length, r.body.total_patron);
  for (const x of r.body.excluidos) {
    assert.ok(x.motivo_exclusion, 'todo excluido trae motivo');
    assert.match(x.motivo_exclusion, /umbral/);
    assert.ok(typeof x.kpi_conv === 'number');
  }
});

test('PATCH umbral recalcula la lista al instante', async () => {
  const id = await crearYPublicar({
    titulo: `Conv Umbral Vivo ${Date.now()}`,
    kpi_minimo: 0,
    requisitos: [{ nombre: 'javascript', obligatorio: true }]
  });
  let r = await api(`/api/convocatorias/${id}/ranking`, { headers: auth(admin) });
  const totalInicial = r.body.total;
  assert.ok(totalInicial > 0);

  const up = await api(`/api/convocatorias/${id}/umbral`, {
    method: 'PATCH', headers: auth(admin), body: JSON.stringify({ kpi_minimo: 100 })
  });
  assert.equal(up.status, 200);
  assert.equal(up.body.kpi_minimo, 100);

  r = await api(`/api/convocatorias/${id}/ranking`, { headers: auth(admin) });
  assert.equal(r.body.total, 0, 'con umbral 100 no entra nadie');
  assert.equal(r.body.excluidos.length, r.body.total_patron);

  const down = await api(`/api/convocatorias/${id}/umbral`, {
    method: 'PATCH', headers: auth(admin), body: JSON.stringify({ kpi_minimo: 0 })
  });
  assert.equal(down.status, 200);
  r = await api(`/api/convocatorias/${id}/ranking`, { headers: auth(admin) });
  assert.equal(r.body.total, totalInicial, 'al bajar el umbral vuelve la lista');
  await api(`/api/convocatorias/${id}`, { method: 'DELETE', headers: auth(admin) });
});

test('PATCH umbral invalido 400 y de convocatoria ajena 403', async () => {
  const bad = await api(`/api/convocatorias/${convocatoriaId}/umbral`, {
    method: 'PATCH', headers: auth(admin), body: JSON.stringify({ kpi_minimo: 500 })
  });
  assert.equal(bad.status, 400);
  // convocatoria de rec1, rec2 no puede tocarla
  const propias = await api('/api/convocatorias', { headers: auth(rec1) });
  const propia = propias.body.find((v) => v.estado === 'abierta');
  const ajena = await api(`/api/convocatorias/${propia.id}/umbral`, {
    method: 'PATCH', headers: auth(rec2), body: JSON.stringify({ kpi_minimo: 10 })
  });
  assert.equal(ajena.status, 403);
});

// ---------------------------------------------------------------- pipeline

test('el staff toma un candidato de la lista y se congelan los snapshots', async () => {
  const r0 = await api(`/api/convocatorias/${convocatoriaId}/ranking`, { headers: auth(admin) });
  const primero = r0.body.resultados[0];
  assert.ok(primero, 'hay candidatos en la lista viva');

  const r = await api(`/api/convocatorias/${convocatoriaId}/candidatos/${primero.persona_id}/estado`, {
    method: 'PATCH', headers: auth(admin), body: JSON.stringify({ estado: 'postulado' })
  });
  assert.equal(r.status, 200);
  assert.equal(r.body.estado, 'postulado');
  assert.equal(r.body.persona_id, primero.persona_id);
  assert.ok(typeof r.body.kpi_al_tomar === 'number', 'kpi_al_tomar congelado');
  assert.ok(typeof r.body.match_pct === 'number', 'match_pct congelado');
  assert.ok(typeof r.body.kpi_perfil === 'number', 'kpi_perfil congelado');
});

test('transicion invalida devuelve 409 con el detalle', async () => {
  const r0 = await api(`/api/convocatorias/${convocatoriaId}/ranking`, { headers: auth(admin) });
  const tomado = r0.body.resultados.find((p) => p.estado_candidato === 'postulado');
  const r = await api(`/api/convocatorias/${convocatoriaId}/candidatos/${tomado.persona_id}/estado`, {
    method: 'PATCH', headers: auth(admin), body: JSON.stringify({ estado: 'contratado' })
  });
  assert.equal(r.status, 409);
  assert.match(r.body.error, /Transición inválida/);
});

test('estado desconocido 400', async () => {
  const r0 = await api(`/api/convocatorias/${convocatoriaId}/ranking`, { headers: auth(admin) });
  const p = r0.body.resultados[0];
  const r = await api(`/api/convocatorias/${convocatoriaId}/candidatos/${p.persona_id}/estado`, {
    method: 'PATCH', headers: auth(admin), body: JSON.stringify({ estado: 'inventado' })
  });
  assert.equal(r.status, 400);
});

test('las transiciones validas recorren el pipeline completo', async () => {
  const r0 = await api(`/api/convocatorias/${convocatoriaId}/ranking`, { headers: auth(admin) });
  const tomado = r0.body.resultados.find((p) => p.estado_candidato === 'postulado');
  const pid = tomado.persona_id;
  const mover = async (estado) => {
    const r = await api(`/api/convocatorias/${convocatoriaId}/candidatos/${pid}/estado`, {
      method: 'PATCH', headers: auth(admin), body: JSON.stringify({ estado })
    });
    assert.equal(r.status, 200, `deberia poder pasar a ${estado}`);
    assert.equal(r.body.estado, estado);
  };
  await mover('consulta');
  await mover('preseleccionado');
  await mover('contratado');
  // contratado es terminal
  const r = await api(`/api/convocatorias/${convocatoriaId}/candidatos/${pid}/estado`, {
    method: 'PATCH', headers: auth(admin), body: JSON.stringify({ estado: 'consulta' })
  });
  assert.equal(r.status, 409, 'contratado es terminal');
  // mismo estado = no-op, no falla
  const noop = await api(`/api/convocatorias/${convocatoriaId}/candidatos/${pid}/estado`, {
    method: 'PATCH', headers: auth(admin), body: JSON.stringify({ estado: 'contratado' })
  });
  assert.equal(noop.status, 200, 'repetir el mismo estado es un no-op');
});

test('de descartado se puede volver a consulta', async () => {
  const r0 = await api(`/api/convocatorias/${convocatoriaId}/ranking`, { headers: auth(admin) });
  const libre = r0.body.resultados.find((p) => !p.estado_candidato);
  assert.ok(libre, 'hay candidatos sin tomar');
  const pid = libre.persona_id;
  const ir = async (estado, esperado) => {
    const r = await api(`/api/convocatorias/${convocatoriaId}/candidatos/${pid}/estado`, {
      method: 'PATCH', headers: auth(admin), body: JSON.stringify({ estado })
    });
    assert.equal(r.status, esperado, `-> ${estado}`);
  };
  await ir('postulado', 200);
  await ir('descartado', 200);
  await ir('consulta', 200);
});

// ------------------------------------------------------------------- cupos

test('cupos: validacion, permisos y campos derivados en el listado', async () => {
  const id = await crearYPublicar({ titulo: `Conv Cupos ${Date.now()}`, kpi_minimo: 0, cupos: 2 });

  for (const malo of [0, -1, 1.5, 'abc']) {
    const r = await api(`/api/convocatorias/${id}/cupos`, {
      method: 'PATCH', headers: auth(admin), body: JSON.stringify({ cupos: malo })
    });
    assert.equal(r.status, 400, `cupos=${malo} deberia ser 400`);
  }

  const lista = await api('/api/convocatorias', { headers: auth(admin) });
  const fila = lista.body.find((v) => v.id === id);
  assert.ok(fila, 'la convocatoria esta en el listado');
  assert.equal(fila.cupos, 2);
  assert.equal(fila.contratados, 0);
  assert.equal(fila.disponibles, 2);
  assert.equal(fila.completa, false);

  // El dueno (reclutador) puede cambiarlos; otro reclutador no.
  const propia = await crearYPublicar({ titulo: `Conv Cupos Rec ${Date.now()}`, cupos: 2 }, rec1);
  const ajeno = await api(`/api/convocatorias/${propia}/cupos`, {
    method: 'PATCH', headers: auth(rec2), body: JSON.stringify({ cupos: 3 })
  });
  assert.equal(ajeno.status, 403);
  const duenio = await api(`/api/convocatorias/${propia}/cupos`, {
    method: 'PATCH', headers: auth(rec1), body: JSON.stringify({ cupos: 3 })
  });
  assert.equal(duenio.status, 200);
  assert.equal(duenio.body.cupos, 3);

  await api(`/api/convocatorias/${id}`, { method: 'DELETE', headers: auth(admin) });
  await api(`/api/convocatorias/${propia}`, { method: 'DELETE', headers: auth(admin) });
});

test('contratar el ultimo cupo cierra la convocatoria y bloquea el pipeline', async () => {
  const id = await crearYPublicar({ titulo: `Conv Cierre ${Date.now()}`, kpi_minimo: 0, cupos: 1 });
  const r0 = await api(`/api/convocatorias/${id}/ranking`, { headers: auth(admin) });
  assert.ok(r0.body.resultados.length >= 2, 'hay al menos dos candidatos para tomar');
  const [uno, dos] = r0.body.resultados;

  const mover = (pid, estado) => api(`/api/convocatorias/${id}/candidatos/${pid}/estado`, {
    method: 'PATCH', headers: auth(admin), body: JSON.stringify({ estado })
  });

  assert.equal((await mover(uno.persona_id, 'postulado')).status, 200);
  assert.equal((await mover(uno.persona_id, 'consulta')).status, 200);
  assert.equal((await mover(uno.persona_id, 'preseleccionado')).status, 200);
  const contratado = await mover(uno.persona_id, 'contratado');
  assert.equal(contratado.status, 200);
  assert.equal(contratado.body.cierre_automatico, true, 'avisa el cierre automatico');
  assert.equal(contratado.body.convocatoria.estado, 'cerrada');
  assert.equal(contratado.body.convocatoria.contratados, 1);

  const r1 = await api(`/api/convocatorias/${id}/ranking`, { headers: auth(admin) });
  assert.equal(r1.body.convocatoria.estado, 'cerrada');
  assert.equal(r1.body.cupos, 1);
  assert.equal(r1.body.contratados, 1);
  assert.equal(r1.body.disponibles, 0);
  assert.equal(r1.body.completa, true);

  // Cerrada = solo lectura: ni tomar a otro ni repetir el mismo estado.
  const bloqueado = await mover(dos.persona_id, 'postulado');
  assert.equal(bloqueado.status, 409);
  assert.match(bloqueado.body.error, /cerrada/i);

  const cuposCerrada = await api(`/api/convocatorias/${id}/cupos`, {
    method: 'PATCH', headers: auth(admin), body: JSON.stringify({ cupos: 2 })
  });
  assert.equal(cuposCerrada.status, 409);

  await api(`/api/convocatorias/${id}`, { method: 'DELETE', headers: auth(admin) });
});

test('bajar los cupos por debajo de los contratados cierra la convocatoria', async () => {
  const id = await crearYPublicar({ titulo: `Conv Bajar Cupos ${Date.now()}`, kpi_minimo: 0, cupos: 3 });
  const r0 = await api(`/api/convocatorias/${id}/ranking`, { headers: auth(admin) });
  const p = r0.body.resultados[0];
  const mover = (estado) => api(`/api/convocatorias/${id}/candidatos/${p.persona_id}/estado`, {
    method: 'PATCH', headers: auth(admin), body: JSON.stringify({ estado })
  });
  await mover('postulado');
  await mover('consulta');
  await mover('preseleccionado');
  const contratado = await mover('contratado');
  assert.equal(contratado.body.cierre_automatico, false, 'con 3 cupos no cierra');

  const baja = await api(`/api/convocatorias/${id}/cupos`, {
    method: 'PATCH', headers: auth(admin), body: JSON.stringify({ cupos: 1 })
  });
  assert.equal(baja.status, 200);
  assert.equal(baja.body.cupos, 1);
  assert.equal(baja.body.estado, 'cerrada');
  assert.equal(baja.body.cierre_automatico, true);
  assert.equal(baja.body.contratados, 1);

  await api(`/api/convocatorias/${id}`, { method: 'DELETE', headers: auth(admin) });
});

test('no se puede tocar el pipeline de una convocatoria ajena (403)', async () => {
  const propias = await api('/api/convocatorias', { headers: auth(rec1) });
  const propia = propias.body.find((v) => v.estado === 'abierta');
  const r0 = await api(`/api/convocatorias/${propia.id}/ranking`, { headers: auth(rec1) });
  const p = r0.body.resultados[0];
  const r = await api(`/api/convocatorias/${propia.id}/candidatos/${p.persona_id}/estado`, {
    method: 'PATCH', headers: auth(rec2), body: JSON.stringify({ estado: 'consulta' })
  });
  assert.equal(r.status, 403);
});

test('ranking expone los parciales de cobertura y calidad y el estado del pipeline', async () => {
  const r = await api(`/api/convocatorias/${convocatoriaId}/ranking`, { headers: auth(admin) });
  assert.equal(r.status, 200);
  assert.ok(r.body.total >= 1, 'hay candidatos para inspeccionar');
  for (const p of r.body.resultados) {
    const d = p.desglose;
    assert.ok(typeof d.puntos_cobertura === 'number', 'puntos_cobertura numerico');
    assert.ok(typeof d.puntos_calidad === 'number', 'puntos_calidad numerico');
    assert.ok(d.puntos_cobertura >= 0 && d.puntos_cobertura <= 40, 'cobertura entre 0 y 40');
    assert.ok(d.puntos_calidad >= 0 && d.puntos_calidad <= 40, 'calidad entre 0 y 40');
    const suma = Math.round((d.puntos_cobertura + d.puntos_calidad) * 100) / 100;
    assert.equal(suma, d.puntos_requisitos, 'cobertura + calidad = total de requisitos');
    assert.equal(typeof p.kpi, 'number', 'perfil (kpi) presente');
    assert.ok(p.clasificacion, 'calificacion presente');
    assert.ok(typeof p.kpi_conv === 'number');
    assert.ok(p.estado_candidato === null
      || ['postulado', 'consulta', 'preseleccionado', 'descartado', 'contratado'].includes(p.estado_candidato));
  }
});

test('cola de candidatos filtra por estado y /api/candidatos es alias de /api/postulaciones', async () => {
  const r = await api('/api/candidatos?estado=postulado', { headers: auth(admin) });
  assert.equal(r.status, 200);
  assert.ok(r.body.every((p) => p.estado === 'postulado'));
  const alias = await api('/api/postulaciones?estado=postulado', { headers: auth(admin) });
  assert.equal(alias.status, 200);
  assert.deepEqual(alias.body, r.body, 'los dos endpoints devuelven lo mismo');
  const bad = await api('/api/candidatos?estado=inventado', { headers: auth(admin) });
  assert.equal(bad.status, 400);
});

// ---------------------------------------------------------------- vista del postulante

test('mis-convocatorias: el postulante ve las abiertas y si califica', async () => {
  const r = await api('/api/mis-convocatorias', { headers: auth(postulante) });
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.body));
  assert.ok(r.body.length > 0, 'hay convocatorias abiertas');
  for (const m of r.body) {
    assert.ok(typeof m.kpi_conv === 'number');
    assert.ok(typeof m.califica === 'boolean');
    assert.ok(typeof m.total_candidatos === 'number');
    if (m.califica) {
      assert.equal(m.motivo_exclusion, null);
      assert.ok(m.posicion >= 1, 'si califica tiene posicion en la lista');
    } else {
      assert.ok(m.motivo_exclusion, 'si no califica, ve el motivo');
    }
  }
});

test('mis-convocatorias exige persona_id para el staff', async () => {
  const r = await api('/api/mis-convocatorias', { headers: auth(admin) });
  assert.equal(r.status, 400);
});

test('actualizar el perfil recalcula el enlistado (disponibilidad + actualizado_en)', async () => {
  const t = await login('postulante04@test.com');
  const antes = await api('/api/yo', { headers: auth(t) });
  assert.equal(antes.status, 200);
  assert.ok(antes.body.disponibilidad, 'la disponibilidad vive en personas');

  const r = await api('/api/yo', {
    method: 'PUT', headers: auth(t),
    body: JSON.stringify({
      disponibilidad: 'En 1 mes',
      habilidades: [{ nombre: 'javascript', nivel: 'avanzado', anios_uso: 4 }]
    })
  });
  assert.equal(r.status, 200);
  assert.equal(r.body.disponibilidad, 'En 1 mes');
  assert.ok(r.body.actualizado_en, 'actualizado_en se refresca al guardar el perfil');

  const bad = await api('/api/yo', {
    method: 'PUT', headers: auth(t), body: JSON.stringify({ disponibilidad: 'Cuando sea' })
  });
  assert.equal(bad.status, 400, 'disponibilidad invalida 400');

  // restaura
  await api('/api/yo', {
    method: 'PUT', headers: auth(t),
    body: JSON.stringify({
      disponibilidad: antes.body.disponibilidad,
      habilidades: antes.body.habilidades.map((h) => ({ nombre: h.nombre, nivel: h.nivel, anios_uso: h.anios_uso })),
      experiencias: antes.body.experiencias.map((e) => ({
        empresa: e.empresa, cargo: e.cargo, descripcion: e.descripcion, tipo_trabajo: e.tipo_trabajo,
        fecha_inicio: e.fecha_inicio, fecha_fin: e.fecha_fin, es_actual: e.es_actual
      })),
      formaciones: antes.body.formaciones.map((f) => ({
        titulo: f.titulo, institucion: f.institucion, nivel: f.nivel, fecha_inicio: f.fecha_inicio, fecha_fin: f.fecha_fin
      }))
    })
  });
});

// ---------------------------------------------------------------- misc

test('admin resumen trae conteos', async () => {
  const r = await api('/api/admin/resumen', { headers: auth(admin) });
  assert.equal(r.status, 200);
  for (const k of ['abiertas', 'postulantes', 'pendientes', 'consultas']) assert.ok(typeof r.body[k] === 'number');
  assert.ok(r.body.postulantes >= 13);
  assert.ok(r.body.candidatos && typeof r.body.candidatos.total === 'number', 'resumen trae los candidatos vivos');
});

test('flujo aprobacion: el postulante no ve la convocatoria pendiente', async () => {
  const c = await api('/api/convocatorias', {
    method: 'POST', headers: auth(rec1),
    body: JSON.stringify({ titulo: `Conv Pend ${Date.now()}`, requisitos: [{ nombre: 'python', obligatorio: true }] })
  });
  assert.equal(c.status, 201);
  assert.equal(c.body.estado, 'pendiente');
  const id = c.body.id;
  const vis = await api('/api/convocatorias', { headers: auth(postulante) });
  assert.ok(!vis.body.some((v) => v.id === id));
  const mis = await api('/api/mis-convocatorias', { headers: auth(postulante) });
  assert.ok(!mis.body.some((m) => m.id === id), 'tampoco aparece en mis convocatorias');

  const ap = await api(`/api/convocatorias/${id}/aprobar`, { method: 'PATCH', headers: auth(admin) });
  assert.equal(ap.status, 200);
  assert.equal(ap.body.estado, 'abierta');
  const vis2 = await api('/api/convocatorias', { headers: auth(postulante) });
  assert.ok(vis2.body.some((v) => v.id === id));

  const rej = await api('/api/convocatorias', {
    method: 'POST', headers: auth(rec1),
    body: JSON.stringify({ titulo: `Conv Rech ${Date.now()}` })
  });
  const no = await api(`/api/convocatorias/${rej.body.id}/rechazar`, { method: 'PATCH', headers: auth(admin) });
  assert.equal(no.body.estado, 'rechazada');

  await api(`/api/convocatorias/${id}`, { method: 'DELETE', headers: auth(admin) });
  await api(`/api/convocatorias/${rej.body.id}`, { method: 'DELETE', headers: auth(admin) });
});

test('cerrar la convocatoria la saca de mis-convocatorias', async () => {
  const id = await crearYPublicar({
    titulo: `Conv Cerrable ${Date.now()}`,
    kpi_minimo: 0,
    requisitos: [{ nombre: 'javascript', obligatorio: true }]
  });
  const misAntes = await api('/api/mis-convocatorias', { headers: auth(postulante) });
  assert.ok(misAntes.body.some((m) => m.id === id), 'el postulante ve la convocatoria abierta');
  await api(`/api/convocatorias/${id}/cerrar`, { method: 'PATCH', headers: auth(admin) });
  const misDespues = await api('/api/mis-convocatorias', { headers: auth(postulante) });
  assert.ok(!misDespues.body.some((m) => m.id === id), 'la cerrada ya no aparece');
  await api(`/api/convocatorias/${id}`, { method: 'DELETE', headers: auth(admin) });
});

test('cleanup: eliminar las convocatorias de prueba', async () => {
  for (const id of [convocatoriaId, altaId]) {
    if (id) {
      const r = await api(`/api/convocatorias/${id}`, { method: 'DELETE', headers: auth(admin) });
      assert.equal(r.status, 200);
    }
  }
});
