import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, sesion } from '../lib/api';
import { Aviso, EmptyState, Pill, Skeleton } from '../components/ui';
import { TarjetaConvocatoria } from '../components/TarjetaConvocatoria';
import { IlustracionInicio } from '../components/Ilustraciones';
import {
  IconoCheck,
  IconoChispa,
  IconoMaletin,
  IconoObjetivo,
  IconoUsuarios
} from '../components/Iconos';

const PASOS = [
  { icono: IconoUsuarios, titulo: 'Creá tu cuenta', texto: 'Registrate una sola vez con tus datos básicos. Sin trámites ni papeles.' },
  { icono: IconoCheck, titulo: 'Completá tu perfil', texto: 'Habilidades, formación y experiencia: ese es todo tu CV.' },
  { icono: IconoChispa, titulo: 'El sistema te enlista', texto: 'Cada convocatoria calcula tu encaje y te muestra tu posición.' }
];

// Portada publica: que hacemos, como funciona y las convocatorias abiertas.
export function Inicio() {
  const s = sesion();
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let vivo = true;
    api('/api/publico/convocatorias')
      .then((r) => { if (vivo) setLista(r || []); })
      .catch((ex) => { if (vivo) setErr(ex.message); })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:pt-16">
      <section className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Pill tono="cyan" punto>{cargando ? 'Convocatorias' : `${lista.length} convocatorias abiertas`}</Pill>
          <h1 className="page-title mt-4 lg:text-5xl">
            Tu perfil encuentra su convocatoria.
          </h1>
          <p className="help mt-4 max-w-xl text-base">
            No hay formularios de postulación. Cargás tu perfil una vez y el sistema te enlistan
            automáticamente en los procesos donde realmente encajás, con tu puntaje explicado.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link className="btn btn-primary px-5 py-3 text-base" to={s.token ? '/mi-panel' : '/registro'}>
              {s.token ? 'Ir a mi panel' : 'Inscribirme gratis'}
            </Link>
            <Link className="btn btn-secondary px-5 py-3 text-base" to="/convocatorias">
              Ver convocatorias
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <IlustracionInicio />
          <div className="card p-5">
            <p className="section-title flex items-center gap-2">
              <IconoObjetivo className="h-4 w-4 text-brand-600 dark:text-brand-300" />
              Cómo funciona
            </p>
            <ul className="mt-4 space-y-4">
              {PASOS.map((p, i) => (
                <li key={p.titulo} className="flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    <p.icono className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{i + 1}. {p.titulo}</p>
                    <p className="help mt-0.5">{p.texto}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="section-title flex items-center gap-2">
              <IconoMaletin className="h-4 w-4 text-brand-600 dark:text-brand-300" />
              Búsquedas abiertas
            </p>
            <p className="help mt-1">Estos son los procesos donde hoy se puede sumar gente.</p>
          </div>
          <Link className="link text-sm" to="/convocatorias">Ver todas</Link>
        </div>

        <div className="mt-4">
          {err ? <Aviso tono="error" titulo="No se pudieron cargar las convocatorias">{err}</Aviso> : null}
          {cargando ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-40" />)}
            </div>
          ) : err ? null : lista.length === 0 ? (
            <EmptyState
              icono={IconoMaletin}
              titulo="No hay convocatorias abiertas por ahora"
              texto="Volvé a revisar más adelante o creá tu cuenta para que te tengamos en cuenta."
            >
              <Link className="btn btn-primary px-4 py-2.5 text-sm" to="/registro">Inscribirme</Link>
            </EmptyState>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {lista.slice(0, 6).map((c) => <TarjetaConvocatoria key={c.id} c={c} />)}
            </div>
          )}
        </div>
      </section>

      <section className="card mt-12 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="section-title">¿Te interesa alguna?</p>
          <p className="help mt-1 max-w-xl">
            Creá tu cuenta, completá tu perfil y el sistema te enlistará en las convocatorias donde encajes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="btn btn-primary px-5 py-3 text-base" to="/registro">Inscribirme como postulante</Link>
          <Link className="btn btn-secondary px-5 py-3 text-base" to="/login">Ya tengo cuenta</Link>
        </div>
      </section>
    </div>
  );
}
