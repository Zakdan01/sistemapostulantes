const bcrypt = require('bcryptjs');
const { conTransaccion } = require('../config/db');
const Usuario = require('../models/usuario.model');
const Persona = require('../models/persona.model');
const { firmar } = require('../middlewares/auth');
const { HttpError } = require('../utils/errors');
const Candidatos = require('../services/candidatos');
const {
  exigirCorreo, datosPersona, listaHabilidades, listaExperiencias, listaFormaciones, DISPONIBILIDADES
} = require('../utils/validar');

// La disponibilidad vive en personas (columna personas.disponibilidad): es lo que usa
// el KPI de convocatoria (+10 si coincide con la de la convocatoria).
function disponibilidadDe(body) {
  const d = body.disponibilidad === undefined || body.disponibilidad === null
    ? DISPONIBILIDADES[0]
    : String(body.disponibilidad).trim();
  if (!DISPONIBILIDADES.includes(d)) throw HttpError.badRequest('disponibilidad inválida');
  return d;
}

async function registro(req, res) {
  // Registro público SOLO postulante, 6 campos. Nace pendiente (entra limitado).
  const c = exigirCorreo(req.body.correo);
  const password = String(req.body.password || '');
  if (password.length < 8) throw HttpError.badRequest('password mínimo 8 caracteres');
  if (await Usuario.buscarPorCorreo(c)) throw HttpError.conflict('El correo ya está registrado');
  const nombres = String(req.body.nombres || '').trim();
  if (!nombres) throw HttpError.badRequest('nombres es requerido');

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
  const disponibilidad = disponibilidadDe(req.body);

  const out = await conTransaccion(async (conn) => {
    const hash = await bcrypt.hash(password, 10);
    const u = await Usuario.crear(conn, {
      correo: c, password_hash: hash, rol: 'postulante', estado_cuenta: 'pendiente'
    });
    const rp = await conn.query(
      `INSERT INTO personas (usuario_id, nombres, apellidos, correo, telefono, direccion, linkedin, github, portafolio_url, disponibilidad, actualizado_en)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now()) RETURNING id`,
      [u.id, datos.nombres, datos.apellidos, c, datos.telefono, datos.direccion,
        datos.linkedin, datos.github, datos.portafolio_url, disponibilidad]
    );
    const personaId = rp.rows[0].id;
    await Persona.reemplazarHabilidades(conn, personaId, habilidades);
    await Persona.reemplazarExperiencias(conn, personaId, experiencias);
    await Persona.reemplazarFormaciones(conn, personaId, formaciones);
    await Persona.registrarEvento(conn, personaId, disponibilidad);
    return { personaId, usuario: u };
  });
  Candidatos.invalidarPadron();
  res.status(201).json({
    mensaje: 'Registro exitoso. Tu cuenta está pendiente de aprobación.',
    postulante_id: out.personaId,
    persona_id: out.personaId,
    token: firmar(out.usuario),
    estado_cuenta: 'pendiente'
  });
}

async function login(req, res) {
  const c = exigirCorreo(req.body.correo);
  const u = await Usuario.buscarPorCorreo(c);
  if (!u) throw HttpError.unauthorized('Credenciales inválidas');
  if (u.estado_cuenta === 'rechazada') throw HttpError.unauthorized('Cuenta rechazada por el admin');
  const ok = await bcrypt.compare(String(req.body.password || ''), u.password_hash);
  if (!ok) throw HttpError.unauthorized('Credenciales inválidas');
  res.json({ token: firmar(u), rol: u.rol, estado_cuenta: u.estado_cuenta || 'activa' });
}

async function upsert(req, res) {
  // POST /api/personas/upsert — crea o actualiza por correo (requiere auth admin/reclutador)
  const c = exigirCorreo(req.body.correo);
  const datos = datosPersona(req.body, true);
  const habilidades = listaHabilidades(req.body);
  const experiencias = listaExperiencias(req.body);
  const formaciones = listaFormaciones(req.body);
  const disponibilidad = disponibilidadDe(req.body);

  const out = await conTransaccion(async (conn) => {
    const existe = await conn.query('SELECT id FROM personas WHERE correo=$1', [c]);
    let personaId;
    if (existe.rows[0]) {
      personaId = existe.rows[0].id;
      await conn.query(
        `UPDATE personas SET nombres=$2, apellidos=$3, telefono=$4, direccion=$5, linkedin=$6,
           github=$7, portafolio_url=$8, disponibilidad=$9, actualizado_en=now() WHERE id=$1`,
        [personaId, datos.nombres, datos.apellidos, datos.telefono, datos.direccion,
          datos.linkedin, datos.github, datos.portafolio_url, disponibilidad]
      );
    } else {
      const r = await conn.query(
        `INSERT INTO personas (nombres, apellidos, correo, telefono, direccion, linkedin, github, portafolio_url, disponibilidad, actualizado_en)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now()) RETURNING id`,
        [datos.nombres, datos.apellidos, c, datos.telefono, datos.direccion,
          datos.linkedin, datos.github, datos.portafolio_url, disponibilidad]
      );
      personaId = r.rows[0].id;
    }
    await Persona.reemplazarHabilidades(conn, personaId, habilidades);
    await Persona.reemplazarExperiencias(conn, personaId, experiencias);
    await Persona.reemplazarFormaciones(conn, personaId, formaciones);
    await Persona.registrarEvento(conn, personaId, disponibilidad);
    return { personaId };
  });
  Candidatos.invalidarPadron();
  res.status(201).json(await Persona.detalle(out.personaId));
}

module.exports = { registro, login, upsert };
