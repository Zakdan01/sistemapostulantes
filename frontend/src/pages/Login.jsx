import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, guardarSesion } from '../lib/api';
import { useToast } from '../lib/toast';
import { Boton, Campo, Pill } from '../components/ui';
import {
  IconoCheck,
  IconoChispa,
  IconoObjetivo,
  IconoOjo,
  IconoOjoCerrado,
  IconoUsuarios
} from '../components/Iconos';

const DEMOS = [
  { correo: 'admin@consultora.com', etiqueta: 'Admin' },
  { correo: 'reclutador1@consultora.com', etiqueta: 'Reclutador' },
  { correo: 'postulante01@test.com', etiqueta: 'Postulante' }
];

const BENEFICIOS = [
  { icono: IconoObjetivo, titulo: 'Listas automáticas', texto: 'El sistema enlista a cada postulante según sus requisitos, sin postulaciones manuales.' },
  { icono: IconoChispa, titulo: 'KPI transparente', texto: 'Cada puntaje se explica: cobertura, nivel, años, experiencia y disponibilidad.' },
  { icono: IconoUsuarios, titulo: 'Todo en un lugar', texto: 'Staff y postulantes ven el mismo proceso, con estados claros y sin sorpresas.' }
];

export function Login() {
  const nav = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ correo: 'admin@consultora.com', password: 'Admin123!' });
  const [ver, setVer] = useState(false);
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
    } catch (ex) {
      toast(ex.message, false);
    } finally {
      setCargando(false);
    }
  }

  function usarDemo(correo) {
    setForm({ correo, password: 'Admin123!' });
  }

  return (
    <div className="auth-shell py-16 sm:py-20">
      <div className="card grid w-full max-w-5xl overflow-hidden lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="auth-panel hidden flex-col justify-between p-8 lg:flex">
          <div className="relative z-10">
            <div className="flex items-center gap-2.5">
              <span className="brand-mark">P</span>
              <span>
                <span className="brand-title block text-white">Postulantes</span>
                <span className="block text-[11px] font-medium text-cyan-200/80">Selección inteligente</span>
              </span>
            </div>

            <h1 className="mt-12 text-3xl font-extrabold leading-tight tracking-tight text-white">
              Tu perfil encuentra su convocatoria.
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-cyan-100/90">
              Sin formularios de postulación: completás tu CV una vez y el sistema te acerca a los procesos donde realmente encajás.
            </p>

            <ul className="mt-8 space-y-4">
              {BENEFICIOS.map((b) => (
                <li key={b.titulo} className="flex gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/10 text-cyan-100">
                    <b.icono className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{b.titulo}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-cyan-100/75">{b.texto}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-10 mt-10 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <IconoCheck className="h-4 w-4 text-emerald-300" />
              <p className="text-xs font-semibold text-white">Cuentas de demostración</p>
            </div>
            <p className="mt-1 text-xs text-cyan-100/80">Admin, reclutador y postulante · contraseña <b className="text-white">Admin123!</b></p>
          </div>
        </aside>

        <div className="p-6 sm:p-8 lg:p-10">
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <span className="brand-mark">P</span>
            <span>
              <span className="brand-title block">Postulantes</span>
              <span className="brand-sub block">Selección inteligente</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Pill tono="cyan">Acceso</Pill>
            <span className="help">Sistema de selección</span>
          </div>
          <h1 className="page-title mt-3">Entrar</h1>
          <p className="help mt-1">Accedé con tu cuenta para gestionar convocatorias o revisar tu perfil.</p>

          <form onSubmit={enviar} className="mt-5 space-y-4">
            <Campo etiqueta="Correo electrónico">
              <input
                className="input"
                type="email"
                autoComplete="email"
                required
                value={form.correo}
                onChange={set('correo')}
                placeholder="tu@correo.com"
              />
            </Campo>

            <Campo etiqueta="Contraseña">
              <div className="relative">
                <input
                  className="input pr-24"
                  type={ver ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Tu contraseña"
                />
                <button
                  type="button"
                  className="btn btn-ghost absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1 text-xs"
                  onClick={() => setVer((v) => !v)}
                  aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {ver ? <IconoOjoCerrado className="h-4 w-4" /> : <IconoOjo className="h-4 w-4" />}
                  {ver ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </Campo>

            <Boton variante="primary" tamano="lg" type="submit" className="w-full" cargando={cargando}>
              {cargando ? 'Entrando…' : 'Entrar'}
            </Boton>
          </form>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex flex-wrap items-center gap-2">
              <p className="lab mb-0">Probar con una cuenta demo</p>
              <Pill tono="slate">Admin123!</Pill>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {DEMOS.map((d) => (
                <button
                  key={d.correo}
                  type="button"
                  className="chip"
                  onClick={() => usarDemo(d.correo)}
                >
                  {d.etiqueta}
                </button>
              ))}
            </div>
          </div>

          <p className="help mt-5">
            ¿Sin cuenta? <Link className="link" to="/registro">Inscribirme como postulante</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
