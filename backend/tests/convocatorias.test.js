const { test, before } = require('node:test');
const assert = require('node:assert');

const BASE = process.env.API_URL || 'http://localhost:3000';
let admin = '';
let postulante = '';
let convocatoriaId = null;
let postulacionId = null;
const TITULO = `Convocatoria Test QA ${Date.now()}`;

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
  postulante = await login('postulante04@test.com');
});

test('crear convocatoria con requisitos', async () => {
  const r = await api('/api/convocatorias', {
    method: 'POST',
    headers: { Authorization: `Bearer ${admin}` },
    body: JSON.stringify({
      titulo: TITULO, descripcion: 'Convocatoria de prueba', anios_min: 1,
      requisitos: [{ nombre: 'javascript', obligatorio: true }, { nombre: 'react', obligatorio: false }]
    })
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.titulo, TITULO);
  assert.equal(r.body.requisitos.length, 2);
  assert.equal(r.body.estado, 'pendiente');
  convocatoriaId = r.body.id;
  const ap0 = await api(`/api/convocatorias/${convocatoriaId}/aprobar`, { method: 'PATCH', headers: { Authorization: `Bearer ${admin}` } });
  assert.equal(ap0.body.estado, 'abierta');
});

test('alias viejo /vacantes sigue funcionando', async () => {
  const r = await api('/api/vacantes', { headers: { Authorization: `Bearer ${admin}` } });
  assert.equal(r.status, 200);
  assert.ok(r.body.some((v) => v.id === convocatoriaId));
});

test('crear con tecnologia nueva la agrega al catalogo (default otro)', async () => {
  const nueva = `techtest${Date.now()}`;
  const r = await api('/api/convocatorias', {
    method: 'POST',
    headers: { Authorization: `Bearer ${admin}` },
    body: JSON.stringify({ titulo: `Conv ${nueva}`, requisitos: [{ nombre: nueva, obligatorio: false }] })
  });
  assert.equal(r.status, 201);
  const t = await api('/api/tecnologias');
  assert.ok(t.body.some((x) => x.nombre === nueva));
  await api(`/api/convocatorias/${r.body.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${admin}` } });
  const { pool } = require('../src/config/db');
  await pool.query("DELETE FROM tecnologias WHERE nombre=$1 AND NOT EXISTS (SELECT 1 FROM habilidades_postulante WHERE tecnologia_id=tecnologias.id) AND NOT EXISTS (SELECT 1 FROM convocatorias_requisitos WHERE tecnologia_id=tecnologias.id)", [nueva]);
});

test('crear con nivel_minimo invalido 400 y omitido usa basico', async () => {
  const bad = await api('/api/convocatorias', {
    method: 'POST', headers: { Authorization: `Bearer ${admin}` },
    body: JSON.stringify({ titulo: `Conv Bad ${Date.now()}`, requisitos: [{ nombre: 'java', nivel_minimo: 'legendario' }] })
  });
  assert.equal(bad.status, 400);
  const ok = await api('/api/convocatorias', {
    method: 'POST', headers: { Authorization: `Bearer ${admin}` },
    body: JSON.stringify({ titulo: `Conv Min ${Date.now()}`, requisitos: [{ nombre: 'java', obligatorio: true }] })
  });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.requisitos[0].nivel_minimo, 'basico');
  await api(`/api/convocatorias/${ok.body.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${admin}` } });
});

test('listar convocatorias trae total_postulados', async () => {
  const r = await api('/api/convocatorias', { headers: { Authorization: `Bearer ${admin}` } });
  assert.equal(r.status, 200);
  assert.ok(r.body.some((v) => v.id === convocatoriaId && typeof v.total_postulados === 'number'));
});

test('ranking trae match/score/kpi ordenado', async () => {
  const per = await api('/api/personas', { headers: { Authorization: `Bearer ${admin}` } });
  const p01 = per.body.resultados.find((p) => p.correo === 'postulante01@test.com');
  const p10 = per.body.resultados.find((p) => p.correo === 'postulante10@test.com');
  for (const pid of [p01.id, p10.id]) {
    await api(`/api/convocatorias/${convocatoriaId}/postular`, {
      method: 'POST', headers: { Authorization: `Bearer ${admin}` },
      body: JSON.stringify({ persona_id: pid })
    });
  }
  const r = await api(`/api/convocatorias/${convocatoriaId}/ranking`, { headers: { Authorization: `Bearer ${admin}` } });
  assert.equal(r.status, 200);
  assert.equal(r.body.total, 2, 'solo los postulados de esta convocatoria');
  assert.ok(r.body.convocatoria.titulo === TITULO);
  const top = r.body.resultados[0];
  assert.ok(typeof top.match === 'number' && typeof top.score === 'number' && typeof top.kpi === 'number');
  assert.ok(r.body.resultados.every((p) => typeof p.postulacion_id === 'number'));
  for (let i = 1; i < r.body.resultados.length; i++) {
    assert.ok(r.body.resultados[i - 1].score >= r.body.resultados[i].score);
  }
});

test('ranking trae kpi_conv con desglose y ordena por el (no filtro duro)', async () => {
  const c = await api('/api/convocatorias', {
    method: 'POST', headers: { Authorization: `Bearer ${admin}` },
    body: JSON.stringify({ titulo: `Conv Imposible ${Date.now()}`, requisitos: [{ nombre: 'cobol', obligatorio: true }] })
  });
  assert.equal(c.status, 201);
  await api(`/api/convocatorias/${c.body.id}/aprobar`, { method: 'PATCH', headers: { Authorization: `Bearer ${admin}` } });
  const per = await api('/api/personas', { headers: { Authorization: `Bearer ${admin}` } });
  const p11 = per.body.resultados.find((p) => p.correo === 'postulante11@test.com');
  const post = await api(`/api/convocatorias/${c.body.id}/postular`, {
    method: 'POST', headers: { Authorization: `Bearer ${admin}` },
    body: JSON.stringify({ persona_id: p11.id })
  });
  assert.equal(post.status, 201);
  const r = await api(`/api/convocatorias/${c.body.id}/ranking`, { headers: { Authorization: `Bearer ${admin}` } });
  assert.equal(r.status, 200);
  assert.equal(r.body.total, 1, 'solo el postulado, aunque no cumpla (sin filtro duro)');
  assert.ok(r.body.resultados.every((p) => typeof p.kpi_conv === 'number' && Array.isArray(p.desglose.por_requisito)));
  assert.ok(r.body.resultados[0].kpi_conv < 40, 'puntaje bajo pero presente');
  await api(`/api/convocatorias/${c.body.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${admin}` } });
  const { pool: pool2 } = require('../src/config/db');
  await pool2.query("DELETE FROM tecnologias WHERE nombre IN ('cobol') AND NOT EXISTS (SELECT 1 FROM habilidades_postulante WHERE tecnologia_id=tecnologias.id) AND NOT EXISTS (SELECT 1 FROM convocatorias_requisitos WHERE tecnologia_id=tecnologias.id)");
});

test('admin resumen trae conteos', async () => {
  const r = await api('/api/admin/resumen', { headers: { Authorization: `Bearer ${admin}` } });
  assert.equal(r.status, 200);
  for (const k of ['abiertas', 'postulantes', 'pendientes']) assert.ok(typeof r.body[k] === 'number');
  assert.ok(r.body.postulantes >= 13);
});

test('cola de postulaciones filtra por estado', async () => {
  const r = await api('/api/postulaciones?estado=postulado', { headers: { Authorization: `Bearer ${admin}` } });
  assert.equal(r.status, 200);
  assert.ok(r.body.length >= 1);
  assert.ok(r.body.every((p) => p.estado === 'postulado'));
});

test('postulante se postula con formulario CV (agrega css + disponibilidad)', async () => {
  const r = await api(`/api/convocatorias/${convocatoriaId}/postular`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${postulante}` },
    body: JSON.stringify({
      disponibilidad: 'En 15 días',
      habilidades: [
        { nombre: 'figma', nivel: 'intermedio', anios_uso: 1 },
        { nombre: 'html', nivel: 'intermedio', anios_uso: 2 },
        { nombre: 'css', nivel: 'intermedio', anios_uso: 2 }
      ]
    })
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.estado, 'postulado');
  assert.ok(typeof r.body.match_pct === 'number');
  postulacionId = r.body.id;
});

test('mis-postulaciones del postulante incluye la nueva', async () => {
  const r = await api('/api/mis-postulaciones', { headers: { Authorization: `Bearer ${postulante}` } });
  assert.equal(r.status, 200);
  assert.ok(r.body.some((p) => p.id === postulacionId));
});

test('postular duplicado 409', async () => {
  const r = await api(`/api/convocatorias/${convocatoriaId}/postular`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${postulante}` },
    body: JSON.stringify({})
  });
  assert.equal(r.status, 409);
});

test('mover pipeline a preseleccionado (aceptar)', async () => {
  const r = await api(`/api/postulaciones/${postulacionId}/estado`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${admin}` },
    body: JSON.stringify({ estado: 'preseleccionado' })
  });
  assert.equal(r.status, 200);
  assert.equal(r.body.estado, 'preseleccionado');
});

test('postular con payload completo (experiencias+formaciones) crea evento', async () => {
  const c = await api('/api/convocatorias', {
    method: 'POST',
    headers: { Authorization: `Bearer ${admin}` },
    body: JSON.stringify({ titulo: `Conv Full ${Date.now()}`, requisitos: [{ nombre: 'python', obligatorio: true }] })
  });
  assert.equal(c.status, 201);
  await api(`/api/convocatorias/${c.body.id}/aprobar`, { method: 'PATCH', headers: { Authorization: `Bearer ${admin}` } });
  const t6 = await login('postulante06@test.com');
  const r = await api(`/api/convocatorias/${c.body.id}/postular`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${t6}` },
    body: JSON.stringify({
      disponibilidad: 'Medio tiempo',
      telefono: '77777777',
      habilidades: [{ nombre: 'python', nivel: 'avanzado', anios_uso: 3 }],
      experiencias: [{ empresa: 'TestCorp', cargo: 'Dev', tipo_trabajo: 'remoto', fecha_inicio: '2024-01-01', es_actual: true }],
      formaciones: [{ titulo: 'Curso Test', institucion: 'udemy', nivel: 'curso', fecha_inicio: '2024-01-01', fecha_fin: '2024-06-01' }]
    })
  });
  assert.equal(r.status, 201);
  assert.ok(typeof r.body.match_pct === 'number');
  const mis = await api('/api/mis-postulaciones', { headers: { Authorization: `Bearer ${t6}` } });
  assert.ok(mis.body.some((p) => p.id === r.body.id));
  await api(`/api/convocatorias/${c.body.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${admin}` } });
});

test('postular guarda nombres/apellidos en el perfil', async () => {
  const t7 = await login('postulante07@test.com');
  const yo = await api('/api/yo', { headers: { Authorization: `Bearer ${t7}` } });
  const r = await api(`/api/convocatorias/${convocatoriaId}/postular`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${t7}` },
    body: JSON.stringify({
      nombres: 'Thiago Actualizado', apellidos: 'Rios Lopez',
      habilidades: [{ nombre: 'react', nivel: 'avanzado', anios_uso: 3 }],
      experiencias: [{ empresa: 'SoftMarket', cargo: 'Dev Frontend', tipo_trabajo: 'tiempo_completo', fecha_inicio: '2023-04-01', es_actual: true }]
    })
  });
  assert.equal(r.status, 201);
  const det = await api(`/api/personas/${yo.body.id}`, { headers: { Authorization: `Bearer ${admin}` } });
  assert.equal(det.body.nombres, 'Thiago Actualizado');
  // restaura nombre original para no ensuciar el seed
  const { pool } = require('../src/config/db');
  await pool.query('UPDATE personas SET nombres=$1 WHERE id=$2', ['Thiago', yo.body.id]);
});

test('cerrar convocatoria y postular da 409', async () => {
  const c = await api(`/api/convocatorias/${convocatoriaId}/cerrar`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${admin}` }
  });
  assert.equal(c.status, 200);
  assert.equal(c.body.estado, 'cerrada');
  const t5 = await login('postulante05@test.com');
  const r = await api(`/api/convocatorias/${convocatoriaId}/postular`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${t5}` },
    body: JSON.stringify({})
  });
  assert.equal(r.status, 409);
});

test('flujo aprobacion: reclutador crea en pendiente, postulante no la ve, admin aprueba', async () => {
  const rec = await login('reclutador1@consultora.com');
  const c = await api('/api/convocatorias', {
    method: 'POST',
    headers: { Authorization: `Bearer ${rec}` },
    body: JSON.stringify({ titulo: `Conv Pend ${Date.now()}`, requisitos: [{ nombre: 'python', obligatorio: true }] })
  });
  assert.equal(c.status, 201);
  assert.equal(c.body.estado, 'pendiente');
  const id = c.body.id;
  const vis = await api('/api/convocatorias', { headers: { Authorization: `Bearer ${postulante}` } });
  assert.ok(!vis.body.some((v) => v.id === id));
  const pre = await api(`/api/convocatorias/${id}/postular`, {
    method: 'POST', headers: { Authorization: `Bearer ${postulante}` }, body: JSON.stringify({})
  });
  assert.equal(pre.status, 409);
  const ap = await api(`/api/convocatorias/${id}/aprobar`, { method: 'PATCH', headers: { Authorization: `Bearer ${admin}` } });
  assert.equal(ap.status, 200);
  assert.equal(ap.body.estado, 'abierta');
  const vis2 = await api('/api/convocatorias', { headers: { Authorization: `Bearer ${postulante}` } });
  assert.ok(vis2.body.some((v) => v.id === id));
  const rej = await api('/api/convocatorias', {
    method: 'POST', headers: { Authorization: `Bearer ${rec}` },
    body: JSON.stringify({ titulo: `Conv Rech ${Date.now()}` })
  });
  const no = await api(`/api/convocatorias/${rej.body.id}/rechazar`, { method: 'PATCH', headers: { Authorization: `Bearer ${admin}` } });
  assert.equal(no.body.estado, 'rechazada');
  const pre2 = await api(`/api/convocatorias/${rej.body.id}/postular`, {
    method: 'POST', headers: { Authorization: `Bearer ${postulante}` }, body: JSON.stringify({})
  });
  assert.equal(pre2.status, 409);
  await api(`/api/convocatorias/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${admin}` } });
  await api(`/api/convocatorias/${rej.body.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${admin}` } });
});

test('cleanup: eliminar convocatoria test', async () => {
  const r = await api(`/api/convocatorias/${convocatoriaId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${admin}` }
  });
  assert.equal(r.status, 200);
});
