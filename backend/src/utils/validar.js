const { HttpError } = require('./errors');
const { DISPONIBILIDADES, MODOS_FILTRO, NIVEL_ORDEN } = require('../domain/catalogos');

const CORREO_RE = /^\S+@\S+\.\S+$/;
// Alias legado: el nombre "MODOS" se usaba antes de centralizar los catalogos.
const MODOS = MODOS_FILTRO;

function normCorreo(c) {
  return String(c || '').trim().toLowerCase();
}
function normTec(n) {
  return String(n || '').trim().toLowerCase();
}

function exigirCorreo(correo) {
  const c = normCorreo(correo);
  if (!CORREO_RE.test(c)) throw HttpError.badRequest('Correo inválido');
  return c;
}

function datosPersona(body, completo) {
  const d = {};
  d.nombres = String(body.nombres || '').trim();
  d.apellidos = String(body.apellidos || '').trim();
  if (completo && !d.nombres) throw HttpError.badRequest('nombres es requerido');
  d.telefono = body.telefono ? String(body.telefono).slice(0, 30) : null;
  d.direccion = body.direccion ? String(body.direccion).slice(0, 200) : null;
  d.linkedin = body.linkedin ? String(body.linkedin).slice(0, 200) : null;
  d.github = body.github ? String(body.github).slice(0, 200) : null;
  d.portafolio_url = body.portafolio_url ? String(body.portafolio_url).slice(0, 200) : null;
  return d;
}

function listaHabilidades(body) {
  // { habilidades: [{nombre|tecnologia_id, nivel, anios_uso}] } — acepta ids o nombres
  const arr = body.habilidades || [];
  if (!Array.isArray(arr)) throw HttpError.badRequest('habilidades debe ser arreglo');
  return arr.map((h) => {
    const anios = h.anios_uso === undefined || h.anios_uso === null ? 0 : Number(h.anios_uso);
    if (Number.isNaN(anios) || anios < 0 || anios > 60) throw HttpError.badRequest('anios_uso 0..60');
    const nivel = h.nivel ? String(h.nivel).trim().toLowerCase() : null;
    if (h.tecnologia_id !== undefined && h.tecnologia_id !== null) {
      const id = Number(h.tecnologia_id);
      if (!Number.isInteger(id) || id <= 0) throw HttpError.badRequest('tecnologia_id inválido');
      return { tecnologia_id: id, nivel, anios_uso: anios };
    }
    const nombre = normTec(h.nombre || h.tecnologia);
    if (!nombre || nombre.length > 100) throw HttpError.badRequest('habilidad nombre requerido (<=100)');
    return { nombre, nivel, anios_uso: anios };
  });
}

function listaExperiencias(body) {
  const arr = body.experiencias || [];
  if (!Array.isArray(arr)) throw HttpError.badRequest('experiencias debe ser arreglo');
  return arr.map((e) => {
    if (!e.empresa || !e.cargo) throw HttpError.badRequest('experiencia requiere empresa y cargo');
    if (e.fecha_inicio && e.fecha_fin && e.fecha_inicio > e.fecha_fin) {
      throw HttpError.badRequest('fecha_inicio debe ser <= fecha_fin');
    }
    return {
      empresa: String(e.empresa).slice(0, 150),
      cargo: String(e.cargo).slice(0, 150),
      descripcion: e.descripcion ? String(e.descripcion) : null,
      tipo_trabajo: e.tipo_trabajo ? String(e.tipo_trabajo).trim().toLowerCase() : null,
      fecha_inicio: e.fecha_inicio || null,
      fecha_fin: e.fecha_fin || null,
      es_actual: e.es_actual ? 1 : 0
    };
  });
}

function listaFormaciones(body) {
  const arr = body.formaciones || [];
  if (!Array.isArray(arr)) throw HttpError.badRequest('formaciones debe ser arreglo');
  return arr.map((f) => {
    if (!f.titulo) throw HttpError.badRequest('formacion requiere titulo');
    if (f.fecha_inicio && f.fecha_fin && f.fecha_inicio > f.fecha_fin) {
      throw HttpError.badRequest('fecha_inicio debe ser <= fecha_fin');
    }
    return {
      titulo: String(f.titulo).slice(0, 200),
      institucion: f.institucion ? String(f.institucion).trim().toLowerCase() : null,
      nivel: f.nivel ? String(f.nivel).trim().toLowerCase() : null,
      fecha_inicio: f.fecha_inicio || null,
      fecha_fin: f.fecha_fin || null,
      certificado_url: f.certificado_url ? String(f.certificado_url).slice(0, 300) : null
    };
  });
}

function parsearFiltros(query) {
  const tecs = String(query.tec || query.tecnologias || '')
    .split(',').map(normTec).filter(Boolean);
  const unicos = [...new Set(tecs)];
  const modo = String(query.modo || 'cualquiera').toLowerCase();
  if (!MODOS.includes(modo)) throw HttpError.badRequest('modo inválido (cualquiera|todos|solo)');
  let anios_min;
  if (query.anios_min !== undefined && query.anios_min !== '') {
    anios_min = Number(query.anios_min);
    if (Number.isNaN(anios_min) || anios_min < 0 || anios_min > 60) throw HttpError.badRequest('anios_min inválido (0..60)');
  }
  const tipo_trabajo = query.tipo_trabajo ? String(query.tipo_trabajo).trim().toLowerCase() : undefined;
  let nivel;
  if (query.nivel) {
    nivel = String(query.nivel).trim().toLowerCase();
    if (!NIVEL_ORDEN[nivel]) throw HttpError.badRequest('nivel inválido (principiante|basico|intermedio|avanzado|experto)');
  }
  return { tecs: unicos, modo, anios_min, tipo_trabajo, nivel };
}

module.exports = {
  CORREO_RE, DISPONIBILIDADES, MODOS, NIVEL_ORDEN,
  normCorreo, normTec, exigirCorreo,
  datosPersona, listaHabilidades, listaExperiencias, listaFormaciones, parsearFiltros
};
