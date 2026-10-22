const { test, before } = require('node:test');
const assert = require('node:assert');

const BASE = process.env.API_URL || 'http://localhost:3000';
let token = '';

async function api(path, opts = {}) {
  const r = await fetch(BASE + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  });
  let body = null;
  try { body = await r.json(); } catch { body = null; }
  return { status: r.status, body };
}

before(async () => {
  const h = await api('/api/health');
  assert.equal(h.status, 200, 'backend debe estar encendido (npm start)');
});

test('health P1', async () => {
  const h = await api('/api/health');
  assert.equal(h.body.ok, true);
});

test('login admin ok', async () => {
  const r = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ correo: 'admin@consultora.com', password: 'Admin123!' })
  });
  assert.equal(r.status, 200);
  assert.ok(r.body.token);
  assert.equal(r.body.rol, 'admin');
  token = r.body.token;
});

test('login reclutador ok', async () => {
  const r = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ correo: 'reclutador1@consultora.com', password: 'Admin123!' })
  });
  assert.equal(r.status, 200);
  assert.equal(r.body.rol, 'reclutador');
});

test('tecnologias publico >=5', async () => {
  const r = await api('/api/tecnologias');
  assert.equal(r.status, 200);
  assert.ok(r.body.length >= 5, `esperaba >=5, llego ${r.body.length}`);
});

test('personas sin token 401', async () => {
  const r = await api('/api/personas');
  assert.equal(r.status, 401);
});

test('personas con token total>=5 y con KPI', async () => {
  const r = await api('/api/personas', { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(r.status, 200);
  assert.ok(r.body.total >= 5);
  assert.ok(typeof r.body.resultados[0].kpi === 'number');
  assert.ok(['Alto', 'Medio', 'Bajo'].includes(r.body.resultados[0].clasificacion));
});

test('filtro cualquiera javascript,sql >=2', async () => {
  const r = await api('/api/personas?tec=javascript,sql&modo=cualquiera', { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(r.status, 200);
  assert.ok(r.body.total >= 2);
});

test('filtro todos javascript+react >=1', async () => {
  const r = await api('/api/personas?tec=javascript,react&modo=todos', { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(r.status, 200);
  assert.ok(r.body.total >= 1);
});

test('filtro solo python+postgres =1 (postulante08)', async () => {
  const r = await api('/api/personas?tec=python,postgres&modo=solo', { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(r.status, 200);
  assert.equal(r.body.total, 1);
});

test('detalle primera persona trae CV + KPI', async () => {
  const l = await api('/api/personas', { headers: { Authorization: `Bearer ${token}` } });
  const id = l.body.resultados[0].id;
  const r = await api(`/api/personas/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.body.habilidades));
  assert.ok(Array.isArray(r.body.experiencias));
  assert.ok(typeof r.body.kpi === 'number');
});

test('config invalida (pesos !=100) 400', async () => {
  const r = await api('/api/configuracion', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ peso_experiencia: 50 })
  });
  assert.equal(r.status, 400);
});

test('postulante no puede listar personas 403', async () => {
  const l = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ correo: 'postulante01@test.com', password: 'Admin123!' }) });
  const r = await api('/api/personas', { headers: { Authorization: `Bearer ${l.body.token}` } });
  assert.equal(r.status, 403);
});

test('filtro anios_min=4 solo seniors', async () => {
  const r = await api('/api/personas?anios_min=4', { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(r.status, 200);
  assert.ok(r.body.total >= 1);
  assert.ok(r.body.resultados.every((p) => p.anios_max >= 4));
});

test('filtro tipo_trabajo=medio_tiempo', async () => {
  const r = await api('/api/personas?tipo_trabajo=medio_tiempo', { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(r.status, 200);
  assert.ok(r.body.total >= 1);
});

test('filtro nivel=avanzado', async () => {
  const r = await api('/api/personas?nivel=avanzado', { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(r.status, 200);
  assert.ok(r.body.total >= 1);
  assert.ok(r.body.resultados.every((p) => p.nivel_max >= 4));
});

test('catalogos trae listas para formularios', async () => {
  const r = await api('/api/catalogos', { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(r.status, 200);
  assert.ok(r.body.tecnologias.length >= 12);
  assert.ok(r.body.niveles.length === 5);
  assert.ok(r.body.tipos_trabajo.length === 2);
});

test('GET /yo devuelve el perfil propio del postulante', async () => {
  const l = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ correo: 'postulante01@test.com', password: 'Admin123!' }) });
  const r = await api('/api/yo', { headers: { Authorization: `Bearer ${l.body.token}` } });
  assert.equal(r.status, 200);
  assert.equal(r.body.correo, 'postulante01@test.com');
  assert.ok(Array.isArray(r.body.habilidades));
  assert.ok(typeof r.body.kpi === 'number');
  assert.ok(r.body.disponibilidad, 'la disponibilidad vive en personas');
  assert.ok(r.body.actualizado_en, 'actualizado_en permite medir la actualidad del perfil');
});

test('GET /yo como admin 403', async () => {
  const r = await api('/api/yo', { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(r.status, 403);
});

test('registro duplicado 409', async () => {
  const r = await api('/api/auth/registro', {
    method: 'POST',
    body: JSON.stringify({
      correo: 'postulante01@test.com', password: 'Admin12345',
      nombres: 'Diego', apellidos: 'Aguilar'
    })
  });
  assert.equal(r.status, 409);
});
