const test = require('node:test');
const assert = require('node:assert/strict');

const BASE = process.env.API_URL || 'http://localhost:3000';

async function api(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: res.status, body };
}

async function login(correo, password = process.env.DEMO_PASS || 'Admin123!') {
  const r = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ correo, password })
  });
  assert.equal(r.status, 200, `login ${correo} fallo: ${JSON.stringify(r.body)}`);
  return r.body.token;
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

let admin;
let postulante;
let convId;
let convCerradaId;
let postulantePersonaId;

test('setup: login y convocatoria de prueba para inscripciones', async () => {
  admin = await login('admin@consultora.com');
  postulante = await login('postulante01@test.com');

  const yo = await api('/api/yo', { headers: auth(postulante) });
  assert.equal(yo.status, 200);
  postulantePersonaId = yo.body.id;

  const c = await api('/api/convocatorias', {
    method: 'POST',
    headers: auth(admin),
    body: JSON.stringify({
      titulo: `Conv Inscripciones ${Date.now()}`,
      tipo: 'Pasantía',
      kpi_minimo: 0,
      cupos: 2,
      requisitos: [{ nombre: 'javascript', obligatorio: true }]
    })
  });
  assert.equal(c.status, 201);
  convId = c.body.id;

  const ap = await api(`/api/convocatorias/${convId}/aprobar`, {
    method: 'PATCH',
    headers: auth(admin)
  });
  assert.equal(ap.status, 200);

  const c2 = await api('/api/convocatorias', {
    method: 'POST',
    headers: auth(admin),
    body: JSON.stringify({ titulo: `Conv Cerrada Insc ${Date.now()}`, kpi_minimo: 0 })
  });
  await api(`/api/convocatorias/${c2.body.id}/cerrar`, { method: 'PATCH', headers: auth(admin) });
  convCerradaId = c2.body.id;
});

test('GET /mis-convocatorias incluye inscripcion = null antes de decidir', async () => {
  const r = await api('/api/mis-convocatorias', { headers: auth(postulante) });
  assert.equal(r.status, 200);
  const item = r.body.find((x) => x.id === convId);
  assert.ok(item, 'la convocatoria abierta aparece');
  assert.equal(item.inscripcion, null);
});

test('PATCH estadoCandidato sin inscripcion devuelve 409', async () => {
  const r = await api(`/api/convocatorias/${convId}/candidatos/${postulantePersonaId}/estado`, {
    method: 'PATCH',
    headers: auth(admin),
    body: JSON.stringify({ estado: 'postulado' })
  });
  assert.equal(r.status, 409);
  assert.match(r.body.error, /no ha aceptado inscribirse/i);
});

test('POST inscripcion sin body valido devuelve 400', async () => {
  const r = await api(`/api/mis-convocatorias/${convId}/inscripcion`, {
    method: 'POST',
    headers: auth(postulante),
    body: JSON.stringify({ aceptado: 'si' })
  });
  assert.equal(r.status, 400);
});

test('POST inscripcion en convocatoria cerrada devuelve 409', async () => {
  const r = await api(`/api/mis-convocatorias/${convCerradaId}/inscripcion`, {
    method: 'POST',
    headers: auth(postulante),
    body: JSON.stringify({ aceptado: true })
  });
  assert.equal(r.status, 409);
});

test('POST inscripcion aceptado=false rechaza y se refleja en mis-convocatorias y ranking', async () => {
  const r = await api(`/api/mis-convocatorias/${convId}/inscripcion`, {
    method: 'POST',
    headers: auth(postulante),
    body: JSON.stringify({ aceptado: false })
  });
  assert.equal(r.status, 200);
  assert.equal(r.body.aceptado, false);

  const mis = await api('/api/mis-convocatorias', { headers: auth(postulante) });
  assert.equal(mis.body.find((x) => x.id === convId).inscripcion, false);

  const rank = await api(`/api/convocatorias/${convId}/ranking`, { headers: auth(admin) });
  const cand = rank.body.resultados.find((x) => x.persona_id === postulantePersonaId);
  assert.ok(cand, 'sigue visible en el ranking');
  assert.equal(cand.inscripcion, false);
});

test('POST inscripcion cambia de idea (false -> true) y permite tomar', async () => {
  const r = await api(`/api/mis-convocatorias/${convId}/inscripcion`, {
    method: 'POST',
    headers: auth(postulante),
    body: JSON.stringify({ aceptado: true })
  });
  assert.equal(r.status, 200);
  assert.equal(r.body.aceptado, true);

  // Antes de ser tomado puede retirarse (true -> false) y volver a inscribirse
  const ret = await api(`/api/mis-convocatorias/${convId}/inscripcion`, {
    method: 'POST',
    headers: auth(postulante),
    body: JSON.stringify({ aceptado: false })
  });
  assert.equal(ret.status, 200);
  assert.equal(ret.body.aceptado, false);

  const reInsc = await api(`/api/mis-convocatorias/${convId}/inscripcion`, {
    method: 'POST',
    headers: auth(postulante),
    body: JSON.stringify({ aceptado: true })
  });
  assert.equal(reInsc.status, 200);

  // Staff ahora si puede tomarlo
  const tomar = await api(`/api/convocatorias/${convId}/candidatos/${postulantePersonaId}/estado`, {
    method: 'PATCH',
    headers: auth(admin),
    body: JSON.stringify({ estado: 'postulado' })
  });
  assert.equal(tomar.status, 200);
  assert.equal(tomar.body.estado, 'postulado');
});

test('POST inscripcion retirarse falla con 409 si ya fue tomado por el staff', async () => {
  const r = await api(`/api/mis-convocatorias/${convId}/inscripcion`, {
    method: 'POST',
    headers: auth(postulante),
    body: JSON.stringify({ aceptado: false })
  });
  assert.equal(r.status, 409);
  assert.match(r.body.error, /Ya fuiste tomado/i);
});

test('cleanup: eliminar convocatorias de prueba', async () => {
  await api(`/api/convocatorias/${convId}`, { method: 'DELETE', headers: auth(admin) });
  await api(`/api/convocatorias/${convCerradaId}`, { method: 'DELETE', headers: auth(admin) });
});
