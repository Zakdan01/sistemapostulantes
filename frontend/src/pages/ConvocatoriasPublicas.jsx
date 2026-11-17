import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Aviso, EmptyState, Pill, Skeleton } from '../components/ui';
import { TarjetaConvocatoria } from '../components/TarjetaConvocatoria';
import { IconoMaletin } from '../components/Iconos';

// Catalogo publico: todas las convocatorias abiertas, con sus requisitos.
// No expone umbral ni conteos internos (eso lo decide el backend).
export function ConvocatoriasPublicas() {
  const [lista, setLista] = useState([]);
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState('');
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

  const tipos = [...new Set(lista.map((c) => c.tipo).filter(Boolean))];
  const q = busca.trim().toLowerCase();
  const filtradas = lista.filter((c) => {
    if (tipo && c.tipo !== tipo) return false;
    if (!q) return true;
    return [c.titulo, c.tipo, c.disponibilidad, ...(c.requisitos || [])]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  });

  const limpiar = () => { setBusca(''); setTipo(''); };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
      <Pill tono="cyan">Convocatorias abiertas</Pill>
      <h1 className="page-title mt-3">Búsquedas activas</h1>
      <p className="help mt-2 max-w-2xl">
        Mirá los requisitos de cada convocatoria. Para que el sistema evalúe tu perfil y te enliste,
        creá tu cuenta o iniciá sesión.
      </p>

      <div className="mt-6 max-w-md">
        <label className="lab" htmlFor="busca-conv">Buscar por título, tipo o requisito</label>
        <input
          id="busca-conv"
          className="input"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="ej. React, pasantía, remoto"
        />
      </div>

      {tipos.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={`chip ${tipo ? '' : 'chip-on'}`}
            aria-pressed={!tipo}
            onClick={() => setTipo('')}
          >
            Todas
          </button>
          {tipos.map((t) => (
            <button
              key={t}
              type="button"
              className={`chip ${tipo === t ? 'chip-on' : ''}`}
              aria-pressed={tipo === t}
              onClick={() => setTipo(tipo === t ? '' : t)}
            >
              {t}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-6">
        {err ? <Aviso tono="error" titulo="No se pudieron cargar las convocatorias">{err}</Aviso> : null}

        {cargando ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-40" />)}
          </div>
        ) : err ? null : filtradas.length === 0 ? (
          <EmptyState
            icono={IconoMaletin}
            titulo={lista.length ? 'Ninguna convocatoria coincide' : 'No hay convocatorias abiertas por ahora'}
            texto={lista.length
              ? 'Probá con otra palabra, otro tipo o mirá la lista completa.'
              : 'Volvé a revisar más adelante o creá tu cuenta para que te tengamos en cuenta.'}
          >
            {lista.length
              ? <button type="button" className="btn btn-secondary px-4 py-2.5 text-sm" onClick={limpiar}>Limpiar filtros</button>
              : <Link className="btn btn-primary px-4 py-2.5 text-sm" to="/registro">Inscribirme</Link>}
          </EmptyState>
        ) : (
          <>
            <p className="help mb-3">{filtradas.length} de {lista.length} convocatorias</p>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filtradas.map((c) => <TarjetaConvocatoria key={c.id} c={c} />)}
            </div>
          </>
        )}
      </div>

      <div className="card mt-8 flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center">
        <p className="help min-w-0 flex-1">¿Ninguna encaja todavía? Creá tu perfil y el sistema te avisará dónde sí.</p>
        <Link className="btn btn-primary px-5 py-3 text-base" to="/registro">Inscribirme como postulante</Link>
      </div>
    </div>
  );
}
