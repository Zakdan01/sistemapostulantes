import { useEffect, useState, useMemo, useCallback } from 'react';
import { AuthContext } from './auth-context';
import { sesion as obtenerSesion, guardarSesion as guardarSesionApi, salir as salirApi } from '../lib/api';
import { iniciarRealtime, cerrarRealtime, useEventoRealtime } from '../lib/realtime';

export function AuthProvider({ children }) {
  const [s, setS] = useState(obtenerSesion);
  const [modalAprobado, setModalAprobado] = useState(false);

  useEffect(() => {
    const sesionActual = obtenerSesion();
    if (sesionActual.token) {
      iniciarRealtime();
    } else {
      cerrarRealtime();
    }

    const alCambiarSesion = () => {
      const actual = obtenerSesion();
      setS(actual);
      if (actual.token) {
        iniciarRealtime();
      } else {
        cerrarRealtime();
      }
    };

    window.addEventListener('sesion-cambiada', alCambiarSesion);
    window.addEventListener('storage', alCambiarSesion);
    return () => {
      window.removeEventListener('sesion-cambiada', alCambiarSesion);
      window.removeEventListener('storage', alCambiarSesion);
    };
  }, []);

  useEventoRealtime('CUENTA_APROBADA', () => {
    setS(obtenerSesion());
    setModalAprobado(true);
  });

  useEventoRealtime('CUENTA_RECHAZADA', (datos) => {
    alert(datos.mensaje || 'Tu cuenta ha sido rechazada por el administrador.');
    salirApi();
    window.location.href = '/login';
  });

  const iniciarSesion = useCallback((datos) => {
    guardarSesionApi(datos);
    const actual = obtenerSesion();
    setS(actual);
    if (actual.token) iniciarRealtime();
  }, []);

  const cerrarSesion = useCallback(() => {
    salirApi();
    setS(obtenerSesion());
    cerrarRealtime();
  }, []);

  const value = useMemo(() => ({
    sesion: s,
    token: s.token,
    rol: s.rol,
    correo: s.correo,
    estado: s.estado,
    estaAutenticado: Boolean(s.token),
    esAdmin: s.rol === 'admin',
    esReclutador: s.rol === 'reclutador',
    esPostulante: s.rol === 'postulante',
    modalAprobado,
    cerrarModalAprobado: () => setModalAprobado(false),
    iniciarSesion,
    cerrarSesion
  }), [s, modalAprobado, iniciarSesion, cerrarSesion]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
