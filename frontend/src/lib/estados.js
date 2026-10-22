// Presentacion de los estados de seleccion (SOLO UI).
// Las reglas (que estados existen y que transiciones son validas) las dicta el backend:
// GET /api/catalogos -> pipeline. Ver lib/catalogos.js.
// Si el catalogo no cargo, `transicionesDe` devuelve [] y la UI no ofrece botones.

export const ETIQUETAS = {
  postulado: 'Tomado',
  consulta: 'Contactado',
  preseleccionado: 'Preseleccionado',
  descartado: 'Descartado',
  contratado: 'Contratado'
};

// Tono visual (clases .pill-* definidas en index.css).
export const TONOS = {
  postulado: 'slate',
  consulta: 'amber',
  preseleccionado: 'green',
  descartado: 'red',
  contratado: 'emerald'
};

// Boton (etiqueta + variante) por estado destino.
export const ACCIONES = {
  postulado: { texto: 'Tomar', variante: 'primary' },
  consulta: { texto: 'Contactar', variante: 'warning' },
  preseleccionado: { texto: 'Preseleccionar', variante: 'success' },
  contratado: { texto: 'Contratar', variante: 'accent' },
  descartado: { texto: 'Descartar', variante: 'danger' }
};

// Transiciones permitidas desde un estado segun el catalogo del backend.
export function transicionesDe(catalogos, estado) {
  const mapa = catalogos && catalogos.pipeline && catalogos.pipeline.transiciones;
  return (mapa && mapa[estado]) || [];
}

// Texto de la transicion ("Tomado → Contactado").
export function textoTransicion(desde, hasta) {
  return `${ETIQUETAS[desde] || desde} → ${ETIQUETAS[hasta] || hasta}`;
}
