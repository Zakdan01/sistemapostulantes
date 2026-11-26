import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, guardarSesion } from '../lib/api';
import { useToast } from '../lib/toast';
import { Aviso, Boton, Campo, Pill } from '../components/ui';
import { LogoHeartgold } from '../components/LogoHeartgold';
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
    const textoLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
    const passAlfanum = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
    const telRegex = /^[+0-9\s()-]{6,30}$/;

    if (!passAlfanum.test(form.password)) {
      toast('La contraseña debe tener mínimo 8 caracteres y contener letras y números.', false);
      return;
    }
    if (!textoLetras.test(form.nombres.trim())) {
      toast('Nombres solo debe contener letras.', false);
      return;
    }
    if (form.apellidos.trim() && !textoLetras.test(form.apellidos.trim())) {
      toast('Apellidos solo debe contener letras.', false);
      return;
    }
    if (form.telefono.trim()) {
      const digitos = form.telefono.replace(/\D/g, '');
      if (digitos.length < 6 || !telRegex.test(form.telefono.trim())) {
        toast('El teléfono debe contener al menos 6 dígitos numéricos.', false);
        return;
      }
    }

    setCargando(true);
    try {
      const r = await api('/api/auth/registro', { method: 'POST', body: JSON.stringify(form) });
      guardarSesion({ token: r.token, rol: 'postulante', correo: form.correo, estado_cuenta: r.estado_cuenta });
      toast('Cuenta creada. Está pendiente de aprobación: completa tu CV en Mi perfil.');
      setTimeout(() => nav('/mi-perfil'), 1200);
    } catch (ex) {
      toast(ex.message, false);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="auth-shell py-8 sm:py-12">
      <div className="card grid w-full max-w-4xl lg:max-w-5xl overflow-hidden lg:grid-cols-2">
        <aside className="auth-panel hidden flex-col justify-between p-8 lg:p-10 lg:flex">
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <LogoHeartgold className="h-12 w-12 shrink-0" />
              <span>
                <span className="brand-title block text-lg font-extrabold text-white">Heartgold Inc.</span>
                <span className="block text-xs font-medium text-amber-200/90">Gestión de talento</span>
              </span>
            </div>

            <h1 className="mt-8 text-2xl lg:text-3xl font-extrabold leading-tight tracking-tight text-white">
              Creá tu perfil una vez.
              <br />
              Las convocatorias te encuentran solas.
            </h1>
            <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-amber-100/90">
              Completá tus datos, habilidades y experiencia. El sistema calcula tu encaje con cada proceso y te muestra dónde estás parado.
            </p>

            <ul className="mt-6 space-y-3.5">
              {BENEFICIOS.map((b) => (
                <li key={b.titulo} className="flex gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/10 text-amber-100">
                    <b.icono className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{b.titulo}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-amber-100/80">{b.texto}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-10 mt-8 rounded-xl border border-white/15 bg-white/10 p-3.5 backdrop-blur">
            <div className="flex items-center gap-2">
              <IconoCheck className="h-4 w-4 text-emerald-300" />
              <p className="text-xs font-semibold text-white">Tu cuenta queda pendiente</p>
            </div>
            <p className="mt-1 text-xs text-amber-100/80">Un administrador la aprueba. Mientras tanto ya podés cargar tu perfil.</p>
          </div>
        </aside>

        <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <LogoHeartgold className="h-10 w-10 shrink-0" />
            <span>
              <span className="brand-title block text-base font-extrabold">Heartgold Inc.</span>
              <span className="brand-sub block text-xs">Gestión de talento</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Pill tono="amber">Nueva cuenta</Pill>
            <span className="help">Solo postulantes</span>
          </div>
          <h1 className="page-title mt-2.5">Inscribirme</h1>
          <p className="help mt-1 text-xs sm:text-sm">Creá tu cuenta con los datos básicos. El CV completo lo cargás después en Mi perfil.</p>

          <form onSubmit={enviar} className="mt-5 grid gap-3.5 sm:grid-cols-2">
            <Campo etiqueta="Nombres *" ayuda="Solo letras.">
              <input
                className="input"
                autoComplete="given-name"
                required
                pattern="[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+"
                title="Solo letras y espacios"
                value={form.nombres}
                onChange={set('nombres')}
                placeholder="Tus nombres"
              />
            </Campo>

            <Campo etiqueta="Apellidos" ayuda="Solo letras.">
              <input
                className="input"
                autoComplete="family-name"
                pattern="[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]*"
                title="Solo letras y espacios"
                value={form.apellidos}
                onChange={set('apellidos')}
                placeholder="Tus apellidos"
              />
            </Campo>

            <Campo etiqueta="Correo electrónico *">
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

            <Campo etiqueta="Teléfono" ayuda="Mínimo 6 dígitos.">
              <input
                className="input"
                type="tel"
                autoComplete="tel"
                pattern="[+0-9\s()-]{6,30}"
                title="Número de teléfono válido (mínimo 6 dígitos)"
                value={form.telefono}
                onChange={set('telefono')}
                placeholder="Ej. +591 70000000"
              />
            </Campo>

            <Campo etiqueta="Contraseña *" ayuda="Mínimo 8 con letras y números.">
              <div className="relative">
                <input
                  className="input pr-20"
                  type={ver ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  pattern="(?=.*[A-Za-z])(?=.*\d).{8,}"
                  title="Mínimo 8 caracteres, debe incluir al menos una letra y un número"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Contraseña"
                />
                <button
                  type="button"
                  className="btn btn-ghost absolute right-1 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[11px]"
                  onClick={() => setVer((v) => !v)}
                  aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {ver ? <IconoOjoCerrado className="h-3.5 w-3.5" /> : <IconoOjo className="h-3.5 w-3.5" />}
                  {ver ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </Campo>

            <Campo etiqueta="Dirección">
              <input
                className="input"
                autoComplete="street-address"
                value={form.direccion}
                onChange={set('direccion')}
                placeholder="Tu ciudad / dirección"
              />
            </Campo>

            <Aviso tono="info" className="sm:col-span-2 text-xs py-2 px-3">
              Tu cuenta nace <b>pendiente de aprobación</b>. Mientras tanto podés entrar y completar tu perfil para calificar a las convocatorias.
            </Aviso>

            <Boton variante="primary" tamano="lg" type="submit" className="sm:col-span-2 w-full mt-1" cargando={cargando}>
              {cargando ? 'Registrando…' : 'Crear mi cuenta'}
            </Boton>
          </form>

          <div className="mt-4 pt-3 border-t border-amber-200/40 dark:border-amber-950/40 text-center">
            <p className="help text-xs">
              ¿Ya tenés cuenta? <Link className="link font-semibold" to="/login">Entrar</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
