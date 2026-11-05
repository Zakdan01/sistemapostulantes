import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Aviso, EmptyState, Pill, Skeleton } from '../components/ui';
import { IconoMaletin } from '../components/Iconos';

// Landing publica: solo el catalogo de convocatorias abiertas. Ni ranking, ni
// edicion, ni postulacion: para eso hay que entrar con una cuenta.
export function Bienvenida() {
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
    <div className="min-h-screen px-4 pb-16 pt-8 sm:px-6">
      <header className="mx-auto flex max-w-5xl flex-wrap items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Postulantes">
          <span className="brand-mark">P</span>
          <span>
            <span className="brand-title block">Postulantes</span>
            <span className="brand-sub block">Selección inteligente</span>
          </span>
        </Link>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Link className="btn btn-secondary px-4 py-2.5 text-sm" to="/login">Iniciar sesión</Link>
          <Link className="btn btn-primary px-4 py-2.5 text-sm" to="/registro">Inscribirme</Link>
        </div>
      </header>

      <section className="mx-auto mt-12 max-w-5xl">
        <Pill tono="cyan">Convocatorias abiertas</Pill>
        <h1 className="page-title mt-3">Estas son las búsquedas que tenemos abiertas.</h1>
        <p className="help mt-2 max-w-2xl">
          Mirá los requisitos de cada convocatoria. Para que el sistema evalúe tu perfil y te enliste,
          creá tu cuenta o iniciá sesión.
        </p>
      </section>

      <main className="mx-auto mt-6 max-w-5xl">
        {err ? <Aviso tono="error" titulo="No se pudieron cargar las convocatorias">{err}</Aviso> : null}

        {cargando ? (
          <div className="grid gap-3 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-40" />)}
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
          <div className="grid gap-3 md:grid-cols-2">
            {lista.map((c) => (
              <article key={c.id} className="card flex flex-col gap-3 p-4">
                <div>
                  <h2 className="font-bold">{c.titulo}</h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {c.tipo ? <Pill tono="cyan">{c.tipo}</Pill> : null}
                    <Pill tono="slate">{c.vacantes} {c.vacantes === 1 ? 'vacante' : 'vacantes'}</Pill>
                    <Pill tono="slate">{c.anios_min} años mín.</Pill>
                    {c.disponibilidad ? <Pill tono="slate">{c.disponibilidad}</Pill> : null}
                  </div>
                </div>
                <p className="help">
                  <b>Requiere:</b>{' '}
                  {c.requisitos.length
                    ? <span className="capitalize">{c.requisitos.join(', ')}</span>
                    : 'sin requisitos técnicos'}
                </p>
              </article>
            ))}
          </div>
        )}

        <div className="card mt-8 p-5 text-center">
          <p className="section-title">¿Te interesa alguna?</p>
          <p className="help mx-auto mt-1 max-w-xl">
            Creá tu cuenta, completá tu perfil y el sistema te enlistará en las convocatorias donde encajes.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Link className="btn btn-primary px-5 py-3 text-base" to="/registro">Inscribirme como postulante</Link>
            <Link className="btn btn-secondary px-5 py-3 text-base" to="/login">Ya tengo cuenta</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
