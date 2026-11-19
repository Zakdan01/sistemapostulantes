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

export function mensajeConvocatoria(datos, correo) {
  const valor = (clave) => String(datos[clave] || '').trim();
  const nombre = valor('nombre');
  const empresa = valor('empresa');
  const correoRemitente = valor('correo');
  const puesto = valor('puesto');
  const tipo = valor('tipo');
  const detalle = valor('detalle');

  const cuerpo = [
    'Hola equipo de la consultora:',
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
