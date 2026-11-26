// Helpers puros del sitio corporativo: sin React, sin DOM y sin importar la API.
const SUFIJO_DESEABLE = ' (deseable)';

// Rutas del marco público que son formularios de la plataforma: no cargan el CSS
// corporativo para que sus clases `.btn`, `.card` e `.input` no choquen con Tailwind.
const RUTAS_PLATAFORMA = ['/login', '/registro'];

export function esRutaCorporativa(pathname) {
  return !RUTAS_PLATAFORMA.includes(pathname);
}

export function separarRequisitos(requisitos = []) {
  const lista = Array.isArray(requisitos) ? requisitos : [];
  return {
    obligatorios: lista.filter((r) => !r.endsWith(SUFIJO_DESEABLE)),
    deseables: lista.filter((r) => r.endsWith(SUFIJO_DESEABLE)).map((r) => r.slice(0, -SUFIJO_DESEABLE.length))
  };
}

export function cuposCubiertos({ cupos, vacantes }) {
  return Math.max((Number(cupos) || 0) - (Number(vacantes) || 0), 0);
}

// El catálogo público no expone conteos internos, así que las cifras se derivan
// de lo que el propio endpoint publica. Nunca se inventan datos de padrón.
export function resumenPublico(convocatorias = []) {
  const lista = Array.isArray(convocatorias) ? convocatorias : [];
  const nombres = new Set();
  lista.forEach((c) => {
    const requisitos = c && Array.isArray(c.requisitos) ? c.requisitos : [];
    requisitos.forEach((r) => {
      const nombre = String(r).replace(SUFIJO_DESEABLE, '').trim();
      if (nombre) nombres.add(nombre);
    });
  });
  return {
    convocatorias: lista.length,
    vacantes: lista.reduce((total, c) => {
      const valor = Number(c?.vacantes ?? c?.cupos) || 0;
      return total + Math.max(valor, 0);
    }, 0),
    tecnologias: nombres.size,
    modalidades: new Set(lista.map((c) => c?.tipo).filter(Boolean)).size
  };
}

export function tecnologiasPublicas(convocatorias = [], limite = 18) {
  const lista = Array.isArray(convocatorias) ? convocatorias : [];
  const nombres = new Set();
  lista.forEach((c) => {
    const requisitos = c && Array.isArray(c.requisitos) ? c.requisitos : [];
    requisitos.forEach((r) => {
      const nombre = String(r).replace(SUFIJO_DESEABLE, '').trim();
      if (nombre) nombres.add(nombre);
    });
  });
  return Array.from(nombres).sort((a, b) => a.localeCompare(b, 'es')).slice(0, limite);
}

export function mensajeConvocatoria(datos, correo) {
  const valor = (clave) => String(datos[clave] || '').trim();
  const nombre = valor('nombre');
  const empresa = valor('empresa');
  const correoRemitente = valor('correo');
  const puesto = valor('puesto');
  const tipo = valor('tipo');
  const detalle = valor('detalle');

  const cuerpo = [
    'Hola equipo de Heartgold Inc.:',
    '',
    'Quisiera registrar la siguiente convocatoria:',
    '',
    `Puesto: ${puesto}`,
    `Tipo: ${tipo}`,
    `Empresa: ${empresa}`,
    `Detalle del perfil: ${detalle}`,
    '',
    'Datos de contacto:',
    `Nombre: ${nombre}`,
    `Correo: ${correoRemitente}`,
    '',
    'Gracias.'
  ].join('\n');
  const asunto = `Nueva convocatoria · ${puesto} · ${empresa}`;

  return {
    asunto,
    cuerpo,
    mailto: `mailto:${correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`
  };
}
