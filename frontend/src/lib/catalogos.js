// Catalogos del backend (GET /api/catalogos). El frontend NO hardcodea reglas de
// negocio: estados del pipeline, transiciones, factores de nivel y el umbral por
// defecto vienen de aca (fuente unica: backend/src/domain/catalogos.js).
import { useEffect, useState } from 'react';
import { api } from './api';

let promesa = null;

// Se cachea la promesa: una sola llamada por sesion de navegador.
export function cargarCatalogos() {
  if (!promesa) {
    promesa = api('/api/catalogos').catch((e) => {
      promesa = null; // reintentar en el proximo montaje
      throw e;
    });
  }
  return promesa;
}

// Fuerza a pedir el catalogo de nuevo (p. ej. si se crearon tecnologias).
export function invalidarCatalogos() {
  promesa = null;
}

// Hook: devuelve el catalogo o null mientras carga.
export function useCatalogos() {
  const [catalogos, setCatalogos] = useState(null);
  useEffect(() => {
    let vivo = true;
    cargarCatalogos()
      .then((c) => { if (vivo) setCatalogos(c); })
      .catch(() => {});
    return () => { vivo = false; };
  }, []);
  return catalogos;
}
