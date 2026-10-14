const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function api(path, opts = {}) {
  const r = await fetch(API + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(opts.headers || {}) }
  });
  let body = null;
  try { body = await r.json(); } catch { body = null; }
  if (r.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('correo');
  }
  if (!r.ok) {
    const err = new Error((body && body.error) || `Error ${r.status}`);
    err.status = r.status;
    err.body = body;
    throw err;
  }
  return body;
}

export function sesion() {
  return {
    token: localStorage.getItem('token'),
    rol: localStorage.getItem('rol'),
    correo: localStorage.getItem('correo'),
    estado: localStorage.getItem('estado_cuenta') || 'activa'
  };
}

export function guardarSesion({ token, rol, correo, estado_cuenta }) {
  localStorage.setItem('token', token);
  if (rol) localStorage.setItem('rol', rol);
  if (correo) localStorage.setItem('correo', correo);
  localStorage.setItem('estado_cuenta', estado_cuenta || 'activa');
}

export function salir() {
  localStorage.removeItem('token');
  localStorage.removeItem('rol');
  localStorage.removeItem('correo');
  localStorage.removeItem('estado_cuenta');
}
