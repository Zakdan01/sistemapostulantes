const { test } = require('node:test');
const assert = require('node:assert');

const BASE = process.env.API_URL || 'http://localhost:3000';
const CORREO = `nuevo${Date.now()}@test.com`;
let admin = '';
let tokenPend = '';
let uid = null;

async function api(path, opts = {}) {
  const r = await fetch(BASE + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  });
  let body = null;
  try { body = await r.json(); } catch { body = null; }
  return { status: r.status, body };
}

test('setup login admin', async () => {
  const r = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ correo: 'admin@consultora.com', password: 'Admin123!' }) });
  assert.equal(r.status, 200);
  admin = r.body.token;
});

test('registro slim crea pendiente (6 campos, sin CV)', async () => {
  const r = await api('/api/auth/registro', {
    method: 'POST',
    body: JSON.stringify({
      correo: CORREO, password: 'Admin12345',
      nombres: 'Nuevo', apellidos: 'Registro', telefono: '70000001', direccion: 'Calle Test #1'
    })
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.estado_cuenta, 'pendiente');
  tokenPend = r.body.token;
});

test('registro sin nombres 400', async () => {
  const r = await api('/api/auth/registro', {
    method: 'POST', body: JSON.stringify({ correo: `x${Date.now()}@test.com`, password: 'Admin12345' })
  });
  assert.equal(r.status, 400);
});

test('registro publico no puede crear reclutador (siempre postulante)', async () => {
  const c = `y${Date.now()}@test.com`;
  const r = await api('/api/auth/registro', {
    method: 'POST',
    body: JSON.stringify({ correo: c, password: 'Admin12345', nombres: 'Y', rol: 'admin' })
  });
  assert.equal(r.status, 201);
  const list = await api('/api/admin/usuarios?estado=pendiente', { headers: { Authorization: `Bearer ${admin}` } });
  const me = list.body.find((u) => u.correo === c);
  assert.ok(me);
  assert.equal(me.rol, 'postulante');
  await api(`/api/admin/usuarios/${me.id}/rechazar`, { method: 'PATCH', headers: { Authorization: `Bearer ${admin}` } });
});

test('pendiente entra pero no puede editar su perfil 403', async () => {
  const r = await api('/api/yo', {
    method: 'PUT', headers: { Authorization: `Bearer ${tokenPend}` },
    body: JSON.stringify({ telefono: '70000009' })
  });
  assert.equal(r.status, 403);
});

test('pendiente no entra al padron de candidatos', async () => {
  // el postulante pendiente ve el tablero pero NO aparece en el padron de la convocatoria
  const convs = await api('/api/convocatorias', { headers: { Authorization: `Bearer ${admin}` } });
  const abierta = convs.body.find((v) => v.estado === 'abierta');
  assert.ok(abierta);
  const r = await api(`/api/convocatorias/${abierta.id}/ranking`, { headers: { Authorization: `Bearer ${admin}` } });
  assert.equal(r.status, 200);
  const correos = [...r.body.resultados, ...r.body.excluidos].map((p) => p.correo);
  assert.ok(!correos.includes(CORREO), 'la cuenta pendiente no esta en el padron');
});

test('admin lista pendientes y aprueba', async () => {
  const l = await api('/api/admin/usuarios?estado=pendiente', { headers: { Authorization: `Bearer ${admin}` } });
  assert.equal(l.status, 200);
  const me = l.body.find((u) => u.correo === CORREO);
  assert.ok(me);
  uid = me.id;
  const a = await api(`/api/admin/usuarios/${uid}/aprobar`, { method: 'PATCH', headers: { Authorization: `Bearer ${admin}` } });
  assert.equal(a.status, 200);
  assert.equal(a.body.estado_cuenta, 'activa');
});

test('tras aprobar, la cuenta entra al padron de candidatos', async () => {
  const convs = await api('/api/convocatorias', { headers: { Authorization: `Bearer ${admin}` } });
  const abierta = convs.body.find((v) => v.estado === 'abierta');
  assert.ok(abierta);
  const r = await api(`/api/convocatorias/${abierta.id}/ranking`, { headers: { Authorization: `Bearer ${admin}` } });
  assert.equal(r.status, 200);
  const correos = [...r.body.resultados, ...r.body.excluidos].map((p) => p.correo);
  assert.ok(correos.includes(CORREO), 'la cuenta aprobada ya esta en el padron');
});

test('tras aprobar, login dice activa', async () => {
  const l = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ correo: CORREO, password: 'Admin12345' }) });
  assert.equal(l.status, 200);
  assert.equal(l.body.estado_cuenta, 'activa');
});

test('admin crea reclutador activo directo', async () => {
  const c = `rec${Date.now()}@consultora.com`;
  const r = await api('/api/admin/usuarios', {
    method: 'POST', headers: { Authorization: `Bearer ${admin}` },
    body: JSON.stringify({ correo: c, password: 'Admin12345', rol: 'reclutador' })
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.estado_cuenta, 'activa');
  const l = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ correo: c, password: 'Admin12345' }) });
  assert.equal(l.body.rol, 'reclutador');
});

test('admin crea admin directo', async () => {
  const c = `adm${Date.now()}@consultora.com`;
  const r = await api('/api/admin/usuarios', {
    method: 'POST', headers: { Authorization: `Bearer ${admin}` },
    body: JSON.stringify({ correo: c, password: 'Admin12345', rol: 'admin' })
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.rol, 'admin');
});

test('rechazar elimina cuenta y login da 401', async () => {
  const c = `z${Date.now()}@test.com`;
  await api('/api/auth/registro', {
    method: 'POST', body: JSON.stringify({ correo: c, password: 'Admin12345', nombres: 'Z' })
  });
  const l = await api('/api/admin/usuarios?estado=pendiente', { headers: { Authorization: `Bearer ${admin}` } });
  const victim = l.body.find((u) => u.correo === c);
  const r = await api(`/api/admin/usuarios/${victim.id}/rechazar`, { method: 'PATCH', headers: { Authorization: `Bearer ${admin}` } });
  assert.equal(r.status, 200);
  const login = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ correo: c, password: 'Admin12345' }) });
  assert.equal(login.status, 401);
});

test('reclutador no puede crear usuarios 403', async () => {
  const l = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ correo: 'reclutador1@consultora.com', password: 'Admin123!' }) });
  const r = await api('/api/admin/usuarios', {
    method: 'POST', headers: { Authorization: `Bearer ${l.body.token}` },
    body: JSON.stringify({ correo: `q${Date.now()}@x.com`, password: 'Admin12345', rol: 'reclutador' })
  });
  assert.equal(r.status, 403);
});
