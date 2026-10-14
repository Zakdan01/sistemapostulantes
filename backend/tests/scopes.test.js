const { test, before } = require('node:test');
const assert = require('node:assert');

const BASE = process.env.API_URL || 'http://localhost:3000';
let admin = '';
let rec1 = '';
let rec2 = '';

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
  const r = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ correo, password: 'Admin123!' }) });
  assert.equal(r.status, 200, `login ${correo}`);
  return r.body.token;
}

before(async () => {
  admin = await login('admin@consultora.com');
  rec1 = await login('reclutador1@consultora.com');
  rec2 = await login('reclutador2@consultora.com');
});

test('reclutador lista solo sus convocatorias', async () => {
  const r = await api('/api/convocatorias', { headers: { Authorization: `Bearer ${rec1}` } });
  assert.equal(r.status, 200);
  assert.ok(r.body.length >= 3);
  assert.ok(r.body.every((v) => v.creada_por_correo === 'reclutador1@consultora.com'));
});

test('reclutador ranking ajeno 403, propio 200', async () => {
  const all = await api('/api/convocatorias', { headers: { Authorization: `Bearer ${admin}` } });
  const ajena = all.body.find((v) => v.creada_por_correo === 'admin@consultora.com' && v.estado === 'abierta');
  const no = await api(`/api/convocatorias/${ajena.id}/ranking`, { headers: { Authorization: `Bearer ${rec1}` } });
  assert.equal(no.status, 403);
  const propia = all.body.find((v) => v.creada_por_correo === 'reclutador1@consultora.com' && v.estado === 'abierta');
  const si = await api(`/api/convocatorias/${propia.id}/ranking`, { headers: { Authorization: `Bearer ${rec1}` } });
  assert.equal(si.status, 200);
  assert.ok(typeof si.body.resultados[0].postulacion_id === 'number' || si.body.resultados[0].postulacion_id === null);
});

test('reclutador detalle: propio 200, ajeno 403', async () => {
  const per = await api('/api/personas', { headers: { Authorization: `Bearer ${admin}` } });
  // postulante13 solo esta en Pasantia Admin (rec2) -> rec1 no la ve
  const p13 = per.body.resultados.find((p) => p.correo === 'postulante13@test.com');
  const no = await api(`/api/personas/${p13.id}`, { headers: { Authorization: `Bearer ${rec1}` } });
  assert.equal(no.status, 403);
  // alguien postulado a QA Manual (rec1) si la ve
  const cola = await api('/api/postulaciones?estado=contratado', { headers: { Authorization: `Bearer ${rec1}` } });
  const pid = cola.body[0].persona_id;
  const si = await api(`/api/personas/${pid}`, { headers: { Authorization: `Bearer ${rec1}` } });
  assert.equal(si.status, 200);
});

test('reclutador resumen y cola solo lo suyo', async () => {
  const r = await api('/api/admin/resumen', { headers: { Authorization: `Bearer ${rec1}` } });
  assert.equal(r.status, 200);
  assert.ok(r.body.postulantes <= 13);
  const c = await api('/api/postulaciones', { headers: { Authorization: `Bearer ${rec1}` } });
  assert.ok(c.body.length >= 1);
});

test('reclutador no aprueba convocatorias 403', async () => {
  const all = await api('/api/convocatorias', { headers: { Authorization: `Bearer ${admin}` } });
  const pend = all.body.find((v) => v.estado === 'pendiente') || all.body[0];
  const r = await api(`/api/convocatorias/${pend.id}/aprobar`, { method: 'PATCH', headers: { Authorization: `Bearer ${rec1}` } });
  assert.equal(r.status, 403);
});

test('PUT /yo actualiza mi perfil', async () => {
  const t = await login('postulante02@test.com');
  const r = await api('/api/yo', {
    method: 'PUT', headers: { Authorization: `Bearer ${t}` },
    body: JSON.stringify({ telefono: '79999999', habilidades: [{ nombre: 'python', nivel: 'experto', anios_uso: 5 }] })
  });
  assert.equal(r.status, 200);
  assert.equal(r.body.telefono, '79999999');
  assert.ok(r.body.habilidades.some((h) => h.nombre === 'python' && h.nivel === 'experto'));
});
