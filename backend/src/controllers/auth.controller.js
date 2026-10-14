const bcrypt = require('bcryptjs');
const { pool, conTransaccion } = require('../config/db');
const Usuario = require('../models/usuario.model');
const Persona = require('../models/persona.model');
const { firmar } = require('../middlewares/auth');
const { HttpError } = require('../utils/errors');
const { exigirCorreo, datosPersona, listaHabilidades, listaExperiencias, listaFormaciones } = require('../utils/validar');

async function registro(req, res) {
  // Registro público SOLO postulante, 6 campos. Nace pendiente (entra limitado).
  const { correo, password } = req.body;
  const c = exigirCorreo(correo);
  if (!password || String(password).length < 8) throw new HttpError(400, 'password mínimo 8 caracteres');
  const existe = await Usuario.buscarPorCorreo(c);
  if (existe) throw new HttpError(409, 'El correo ya está registrado');
  const nombres = String(req.body.nombres || '').trim();
  if (!nombres) throw new HttpError(400, 'nombres es requerido');
  const datos = {
    nombres,
    apellidos: String(req.body.apellidos || '').trim(),
    telefono: req.body.telefono ? String(req.body.telefono).slice(0, 30) : null,
    direccion: req.body.direccion ? String(req.body.direccion).slice(0, 200) : null,
    linkedin: null, github: null, portafolio_url: null
  };
  const habilidades = listaHabilidades(req.body);
  const experiencias = listaExperiencias(req.body);
  const formaciones = listaFormaciones(req.body);

  const out = await conTransaccion(async (conn) => {
    const hash = await bcrypt.hash(String(password), 10);
    const u = await Usuario.crear(conn, { correo: c, password_hash: hash, rol: 'postulante', estado_cuenta: 'pendiente' });
    const rp = await conn.query(
      `INSERT INTO personas (usuario_id, nombres, apellidos, correo, telefono, direccion, linkedin, github, portafolio_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [u.id, datos.nombres, datos.apellidos || '', c, datos.telefono, datos.direccion, datos.linkedin, datos.github, datos.portafolio_url]
    );
    const personaId = rp.rows[0].id;
    await Persona.reemplazarHabilidades(conn, personaId, habilidades);
    await Persona.reemplazarExperiencias(conn, personaId, experiencias);
    await Persona.reemplazarFormaciones(conn, personaId, formaciones);
    await conn.query(
      'INSERT INTO eventos_postulacion (persona_id, fecha, hora, disponibilidad) VALUES ($1, CURRENT_DATE, CURRENT_TIME, $2)',
      [personaId, req.body.disponibilidad || 'Inmediata']
    );
    return { personaId, usuario: u };
  });
  const token = firmar(out.usuario);
  res.status(201).json({ mensaje: 'Registro exitoso. Tu cuenta está pendiente de aprobación.', postulante_id: out.personaId, persona_id: out.personaId, token, estado_cuenta: 'pendiente' });
}

async function login(req, res) {
  const c = exigirCorreo(req.body.correo);
  const u = await Usuario.buscarPorCorreo(c);
  if (!u) throw new HttpError(401, 'Credenciales inválidas');
  if (u.estado_cuenta === 'rechazada') throw new HttpError(401, 'Cuenta rechazada por el admin');
  const ok = await bcrypt.compare(String(req.body.password || ''), u.password_hash);
  if (!ok) throw new HttpError(401, 'Credenciales inválidas');
  const token = firmar(u);
  res.json({ token, rol: u.rol, estado_cuenta: u.estado_cuenta || 'activa' });
}

async function upsert(req, res) {
  // POST /api/personas/upsert — crea o actualiza por correo (requiere auth admin/reclutador)
  const c = exigirCorreo(req.body.correo);
  const datos = datosPersona(req.body, true);
  const habilidades = listaHabilidades(req.body);
  const experiencias = listaExperiencias(req.body);
  const formaciones = listaFormaciones(req.body);
  const out = await conTransaccion(async (conn) => {
    let r = await conn.query('SELECT id FROM personas WHERE correo=$1', [c]);
    let personaId;
    if (r.rows[0]) {
      personaId = r.rows[0].id;
      await conn.query(
        'UPDATE personas SET nombres=$2, apellidos=$3, telefono=$4, direccion=$5, linkedin=$6, github=$7, portafolio_url=$8 WHERE id=$1',
        [personaId, datos.nombres, datos.apellidos || '', datos.telefono, datos.direccion, datos.linkedin, datos.github, datos.portafolio_url]
      );
    } else {
      r = await conn.query(
        `INSERT INTO personas (nombres, apellidos, correo, telefono, direccion, linkedin, github, portafolio_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [datos.nombres, datos.apellidos || '', c, datos.telefono, datos.direccion, datos.linkedin, datos.github, datos.portafolio_url]
      );
      personaId = r.rows[0].id;
    }
    await Persona.reemplazarHabilidades(conn, personaId, habilidades);
    await Persona.reemplazarExperiencias(conn, personaId, experiencias);
    await Persona.reemplazarFormaciones(conn, personaId, formaciones);
    await conn.query(
      'INSERT INTO eventos_postulacion (persona_id, fecha, hora, disponibilidad) VALUES ($1, CURRENT_DATE, CURRENT_TIME, $2)',
      [personaId, req.body.disponibilidad || 'Inmediata']
    );
    return { personaId };
  });
  const det = await Persona.detalle(out.personaId);
  res.status(201).json(det);
}

module.exports = { registro, login, upsert };
