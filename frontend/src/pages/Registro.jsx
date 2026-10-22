import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, guardarSesion } from '../lib/api';
import { useToast } from '../lib/toast';
import { Aviso, Boton, Campo, Pill } from '../components/ui';
import {
  IconoCheck,
  IconoChispa,
  IconoObjetivo,
  IconoOjo,
  IconoOjoCerrado,
  IconoUsuarios
} from '../components/Iconos';

const BENEFICIOS = [
  { icono: IconoObjetivo, titulo: 'Sin postulaciones', texto: 'Tu perfil entra solo en las convocatorias donde pasás el umbral.' },
  { icono: IconoChispa, titulo: 'Puntaje explicado', texto: 'Ves tu KPI, tu posición y el motivo si aún no calificás.' },
  { icono: IconoUsuarios, titulo: 'Seguimiento real', texto: 'Cuando el staff te toma, contacta o contrata, lo ves en tu gestor.' }
];

// Registro público SOLO postulante, 6 campos. La cuenta nace pendiente.
export function Registro() {
  const nav = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ correo: '', password: '', nombres: '', apellidos: '', telefono: '', direccion: '' });
  const [ver, setVer] = useState(false);
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
    } catch (ex) {
      toast(ex.message, false);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="auth-shell py-16 sm:py-20">
      <div className="card grid w-full max-w-5xl overflow-hidden lg:grid-cols-[0.95fr_1.05fr]">
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
              Creá tu perfil una vez.
              <br />
              Las convocatorias te encuentran solas.
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-cyan-100/90">
              Completá tus datos, habilidades y experiencia. El sistema calcula tu encaje con cada proceso y te muestra dónde estás parado.
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
              <p className="text-xs font-semibold text-white">Tu cuenta queda pendiente</p>
            </div>
            <p className="mt-1 text-xs text-cyan-100/80">Un administrador la aprueba. Mientras tanto ya podés cargar tu perfil.</p>
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
            <Pill tono="cyan">Nueva cuenta</Pill>
            <span className="help">Solo postulantes</span>
          </div>
          <h1 className="page-title mt-3">Inscribirme</h1>
          <p className="help mt-1">Creá tu cuenta con los datos básicos. El CV completo lo cargás después en Mi perfil.</p>

          <form onSubmit={enviar} className="mt-5 grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Correo electrónico *" className="sm:col-span-2">
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

            <Campo etiqueta="Contraseña *" ayuda="Mínimo 8 caracteres." className="sm:col-span-2">
              <div className="relative">
                <input
                  className="input pr-24"
                  type={ver ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Creá una contraseña"
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

            <Campo etiqueta="Nombres *">
              <input className="input" autoComplete="given-name" required value={form.nombres} onChange={set('nombres')} />
            </Campo>
            <Campo etiqueta="Apellidos">
              <input className="input" autoComplete="family-name" value={form.apellidos} onChange={set('apellidos')} />
            </Campo>
            <Campo etiqueta="Teléfono">
              <input className="input" type="tel" autoComplete="tel" value={form.telefono} onChange={set('telefono')} />
            </Campo>
            <Campo etiqueta="Dirección">
              <input className="input" autoComplete="street-address" value={form.direccion} onChange={set('direccion')} />
            </Campo>

            <Aviso tono="info" className="sm:col-span-2">
              Tu cuenta nace <b>pendiente de aprobación</b>. Mientras tanto podés entrar y completar tu perfil; un administrador te habilita para las listas de candidatos.
            </Aviso>

            <Boton variante="primary" tamano="lg" type="submit" className="sm:col-span-2 w-full" cargando={cargando}>
              {cargando ? 'Registrando…' : 'Crear mi cuenta'}
            </Boton>
          </form>

          <p className="help mt-5">
            ¿Ya tenés cuenta? <Link className="link" to="/login">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
