import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, guardarSesion } from '../lib/api';
import { useToast } from '../components/Toast';

// Registro público SOLO postulante, 6 campos. La cuenta nace pendiente.
export function Registro() {
  const nav = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ correo: '', password: '', nombres: '', apellidos: '', telefono: '', direccion: '' });
  const [cargando, setCargando] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    try {
      const r = await api('/api/auth/registro', { method: 'POST', body: JSON.stringify(form) });
      guardarSesion({ token: r.token, rol: 'postulante', correo: form.correo, estado_cuenta: r.estado_cuenta });
      toast('Cuenta creada. Está pendiente de aprobación: completa tu CV en Mi perfil.');
      setTimeout(() => nav('/'), 1200);
    } catch (ex) { toast(ex.message, false); }
    finally { setCargando(false); }
  }

  return (
    <div className="max-w-md mx-auto card p-6 space-y-3">
      <h2 className="page-title">Crear cuenta de postulante</h2>
      <form onSubmit={enviar} className="grid grid-cols-2 gap-2">
        <label className="lab col-span-2">Correo*<input className="input w-full" value={form.correo} onChange={set('correo')} /></label>
        <label className="lab col-span-2">Contraseña (8+)*<input className="input w-full" type="password" value={form.password} onChange={set('password')} /></label>
        <label className="lab">Nombres*<input className="input w-full" value={form.nombres} onChange={set('nombres')} /></label>
        <label className="lab">Apellidos<input className="input w-full" value={form.apellidos} onChange={set('apellidos')} /></label>
        <label className="lab">Teléfono<input className="input w-full" value={form.telefono} onChange={set('telefono')} /></label>
        <label className="lab">Dirección<input className="input w-full" value={form.direccion} onChange={set('direccion')} /></label>
        <button className="btn-primary col-span-2 px-4 py-3" disabled={cargando}>{cargando ? 'Registrando…' : 'Registrarme'}</button>
      </form>
      <p className="help">El resto de tu CV lo completas en Mi perfil. ¿Ya tienes cuenta? <Link className="text-cyan-700 dark:text-cyan-400 underline" to="/login">Entrar</Link></p>
    </div>
  );
}
