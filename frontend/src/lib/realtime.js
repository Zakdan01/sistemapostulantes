import { useEffect, useRef } from 'react';
import { sesion, guardarSesion } from './api';

let fuenteEventos = null;
let tokenConectado = null;
const suscriptores = new Map(); // tipoEvento -> Set de callbacks

function emitirLocal(tipo, datos) {
  const cbs = suscriptores.get(tipo);
  if (cbs) {
    for (const cb of cbs) {
      try {
        cb(datos);
      } catch (err) {
        console.error(`Error en callback de evento ${tipo}:`, err);
      }
    }
  }
}

export function iniciarRealtime() {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;

  const s = sesion();
  if (!s.token) {
    cerrarRealtime();
    return;
  }

  // Si ya estamos conectados con el mismo token, no reiniciar
  if (fuenteEventos && tokenConectado === s.token) {
    return;
  }

  cerrarRealtime();

  tokenConectado = s.token;
  const url = `/api/realtime?token=${encodeURIComponent(s.token)}`;
  console.log('[SSE Frontend] Iniciando conexión en tiempo real...');
  const es = new EventSource(url);
  fuenteEventos = es;

  es.onopen = () => {
    console.log('[SSE Frontend] Canal en tiempo real conectado exitosamente.');
  };

  es.onerror = (err) => {
    console.warn('[SSE Frontend] Estado de conexión o reconectando...', err);
  };

  es.addEventListener('conectado', (e) => {
    try {
      const d = JSON.parse(e.data);
      console.log('[SSE Frontend] Handshake recibido:', d);
      if (d && (typeof d.cuentas_conectadas === 'number' || typeof d.conexiones === 'number')) {
        emitirLocal('CONEXIONES_ACTUALIZADAS', d);
      }
    } catch {
      console.log('[SSE Frontend] Handshake recibido:', e.data);
    }
  });

  const eventosMapeados = [
    'POSTULANTE_REGISTRADO',
    'CUENTA_APROBADA',
    'CUENTA_RECHAZADA',
    'CUENTA_ACTUALIZADA',
    'CUENTA_ELIMINADA',
    'CONVOCATORIA_CREADA',
    'CONVOCATORIA_APROBADA',
    'CONVOCATORIA_CERRADA',
    'CONEXIONES_ACTUALIZADAS',
    'CANDIDATO_INSCRITO',
    'CANDIDATO_RETIRADO'
  ];

  eventosMapeados.forEach((tipo) => {
    es.addEventListener(tipo, (e) => {
      try {
        const datos = JSON.parse(e.data);
        console.log(`[SSE Frontend] Evento recibido [${tipo}]:`, datos);

        // Si la cuenta del postulante fue aprobada, renovar sesión automáticamente
        if (tipo === 'CUENTA_APROBADA') {
          if (datos.nuevoToken) {
            guardarSesion({
              token: datos.nuevoToken,
              rol: datos.rol || 'postulante',
              correo: datos.correo || s.correo,
              estado_cuenta: 'activa'
            });
            tokenConectado = datos.nuevoToken;
          }
        }

        // Si fue rechazada, avisar
        if (tipo === 'CUENTA_RECHAZADA') {
          window.dispatchEvent(new CustomEvent('cuenta-rechazada', { detail: datos }));
        }

        emitirLocal(tipo, datos);
      } catch (err) {
        console.error('Error procesando evento SSE:', err);
      }
    });
  });
}

export function cerrarRealtime() {
  if (fuenteEventos) {
    console.log('[SSE Frontend] Cerrando conexión en tiempo real.');
    fuenteEventos.close();
    fuenteEventos = null;
    tokenConectado = null;
  }
}

export function suscribirEvento(tipo, callback) {
  if (!suscriptores.has(tipo)) {
    suscriptores.set(tipo, new Set());
  }
  suscriptores.get(tipo).add(callback);

  return () => {
    const conjunto = suscriptores.get(tipo);
    if (conjunto) {
      conjunto.delete(callback);
      if (conjunto.size === 0) suscriptores.delete(tipo);
    }
  };
}

export function useEventoRealtime(tipo, callback) {
  const cbRef = useRef(callback);
  useEffect(() => {
    cbRef.current = callback;
  }, [callback]);

  useEffect(() => {
    iniciarRealtime();
    const desuscribir = suscribirEvento(tipo, (datos) => {
      if (cbRef.current) cbRef.current(datos);
    });
    return desuscribir;
  }, [tipo]);
}
