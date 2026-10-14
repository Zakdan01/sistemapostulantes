import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, guardarSesion } from '../lib/api';
import { useToast } from '../components/Toast';

export function Login() {
  const nav = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ correo: 'admin@consultora.com', password: 'Admin123!' });
  const [cargando, setCargando] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    try {
      const r = await api('/api/auth/login', { method: 'POST', body: JSON.stringify(form) });
      guardarSesion({ token: r.token, rol: r.rol, correo: form.correo, estado_cuenta: r.estado_cuenta });
      toast(r.estado_cuenta === 'pendiente' ? 'Entraste con cuenta pendiente de aprobación.' : 'Sesión iniciada.');
      nav('/');
    } catch (ex) { toast(ex.message, false); }
    finally { setCargando(false); }
  }

  return (
    <div className="max-w-sm mx-auto card p-6">
      <h2 className="page-title mb-4">Entrar</h2>
      <form onSubmit={enviar} className="space-y-3">
        <input className="w-full input" placeholder="correo" value={form.correo} onChange={set('correo')} />
        <input className="w-full input" placeholder="password" type="password" value={form.password} onChange={set('password')} />
        <button className="w-full btn-primary p-2" disabled={cargando}>{cargando ? 'Entrando…' : 'Entrar'}</button>
      </form>
      <p className="text-sm mt-3">¿Sin cuenta? <Link className="text-cyan-700 dark:text-cyan-400 underline" to="/registro">Inscribirme</Link></p>
    </div>
  );
}
