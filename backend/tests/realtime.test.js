const { test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const Usuario = require('../src/models/usuario.model');

let server;
let port;
let adminToken;
let testEmail;
let testUsuarioId;

before(async () => {
  server = app.listen(0);
  port = server.address().port;
  adminToken = jwt.sign(
    { id: 9999, rol: 'admin', estado_cuenta: 'activa' },
    process.env.JWT_SECRET || 'dev'
  );
});

after(async () => {
  if (testUsuarioId) {
    await Usuario.eliminarConPersona(testUsuarioId);
  }
  if (server) server.close();
  await pool.end();
});

test('flujo en tiempo real: registro notifica a admin y aprobacion notifica a postulante con nuevo token activo', async () => {
  let eventoAdmin = null;
  let eventoPostulante = null;

  // 1. Admin abre conexión SSE
  const reqAdmin = http.request(`http://localhost:${port}/api/realtime?token=${adminToken}`, (res) => {
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      if (chunk.includes('event: POSTULANTE_REGISTRADO')) {
        const lines = chunk.split('\n');
        const dataLine = lines.find((l) => l.startsWith('data: '));
        if (dataLine) {
          eventoAdmin = JSON.parse(dataLine.replace('data: ', ''));
        }
      }
    });
  });
  reqAdmin.end();

  await new Promise((r) => setTimeout(r, 400));

  // 2. Nuevo postulante se registra
  testEmail = `realtime_${Date.now()}@test.com`;
  const regRes = await fetch(`http://localhost:${port}/api/auth/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      correo: testEmail,
      password: 'Password123!',
      nombres: 'Esteban',
      apellidos: 'TiempoReal',
      telefono: '60012345'
    })
  });

  const regBody = await regRes.json();
  assert.equal(regRes.status, 201);
  assert.equal(regBody.estado_cuenta, 'pendiente');
  const postulanteToken = regBody.token;

  // 3. Admin debió recibir evento POSTULANTE_REGISTRADO
  await new Promise((r) => setTimeout(r, 400));
  assert.ok(eventoAdmin, 'Admin debió recibir POSTULANTE_REGISTRADO');
  assert.equal(eventoAdmin.correo, testEmail);

  const u = await Usuario.buscarPorCorreo(testEmail);
  assert.ok(u);
  testUsuarioId = u.id;

  // 4. Postulante abre conexión SSE
  const reqPostulante = http.request(`http://localhost:${port}/api/realtime?token=${postulanteToken}`, (res) => {
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      if (chunk.includes('event: CUENTA_APROBADA')) {
        const lines = chunk.split('\n');
        const dataLine = lines.find((l) => l.startsWith('data: '));
        if (dataLine) {
          eventoPostulante = JSON.parse(dataLine.replace('data: ', ''));
        }
      }
    });
  });
  reqPostulante.end();

  await new Promise((r) => setTimeout(r, 400));

  // 5. Admin aprueba la cuenta del postulante
  const aprobarRes = await fetch(`http://localhost:${port}/api/admin/usuarios/${u.id}/aprobar`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  });
  const aprobarBody = await aprobarRes.json();
  assert.equal(aprobarRes.status, 200);
  assert.equal(aprobarBody.estado_cuenta, 'activa');

  // 6. Postulante debió recibir evento CUENTA_APROBADA con token activo
  await new Promise((r) => setTimeout(r, 400));
  assert.ok(eventoPostulante, 'Postulante debió recibir CUENTA_APROBADA');
  assert.equal(eventoPostulante.estado_cuenta, 'activa');
  assert.ok(eventoPostulante.nuevoToken, 'Debe incluir nuevoToken');

  const payload = jwt.verify(eventoPostulante.nuevoToken, process.env.JWT_SECRET || 'dev');
  assert.equal(payload.estado_cuenta, 'activa');

  reqAdmin.destroy();
  reqPostulante.destroy();
});
