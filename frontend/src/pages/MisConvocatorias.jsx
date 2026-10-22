import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { EstadoBadge } from '../components/EstadoCandidato';
import { Aviso, Boton, EmptyState, PageHeader, Pill, Progress, StatCard } from '../components/ui';
import { IconoMaletin, IconoObjetivo, IconoReloj, IconoTrofeo, IconoUsuarios } from '../components/Iconos';

// Vista del postulante: que convocatorias abiertas hay y si califica.
// El postulante NO postula: si pasa el umbral aparece en la lista del staff.
// Si no pasa, sigue viendo la convocatoria con el motivo (nadie queda oculto).
export function MisConvocatorias() {
  const nav = useNavigate();
  const [filas, setFilas] = useState([]);
  const [err, setErr] = useState('');
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const r = await api('/api/mis-convocatorias');
      setFilas(Array.isArray(r) ? r : []);
      setErr('');
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  function reintentar() {
    setCargando(true);
    cargar();
  }

  const califican = filas.filter((f) => f.califica);
  const noCalifican = filas.filter((f) => !f.califica);
  const enSeleccion = filas.filter((f) => f.estado_candidato).length;
  const posiciones = filas.filter((f) => f.posicion).map((f) => Number(f.posicion));
  const mejorPosicion = posiciones.length ? Math.min(...posiciones) : null;

  if (cargando) {
    return (
      <div className="space-y-5">
        <PageHeader
          titulo="Mis convocatorias"
          subtitulo="El sistema te enlista solo: no necesitás postular a nada."
          icono={IconoMaletin}
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-24" />)}
        </div>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton h-40" />)}
        </div>
      </div>
    );
  }

  if (err && filas.length === 0) {
    return (
      <div className="space-y-4">
        <PageHeader
          titulo="Mis convocatorias"
          subtitulo="El sistema te enlista solo: no necesitás postular a nada."
          icono={IconoMaletin}
        />
        <Aviso tono="error" titulo="No se pudieron cargar tus convocatorias">{err}</Aviso>
        <Boton variante="primary" onClick={reintentar}>Reintentar</Boton>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Mis convocatorias"
        subtitulo="El sistema te enlista solo: no necesitás postular a nada. Tu lugar se recalcula cada vez que actualizás tu perfil."
        icono={IconoMaletin}
      >
        <Pill tono="cyan">{filas.length} abierta{filas.length === 1 ? '' : 's'}</Pill>
        {mejorPosicion ? <Pill tono="violet" punto>Mejor posición #{mejorPosicion}</Pill> : null}
      </PageHeader>

      {err ? <Aviso tono="warn">{err}</Aviso> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard valor={filas.length} etiqueta="Convocatorias abiertas" hint="Procesos publicados" icono={IconoMaletin} tono="cyan" />
        <StatCard valor={califican.length} etiqueta="Donde calificás" hint="Pasás el umbral" icono={IconoObjetivo} tono="emerald" />
        <StatCard valor={enSeleccion} etiqueta="En selección" hint="Con un estado asignado" icono={IconoUsuarios} tono="violet" />
        <StatCard valor={mejorPosicion ? `#${mejorPosicion}` : '—'} etiqueta="Mejor posición" hint="En tu lista actual" icono={IconoTrofeo} tono="amber" />
      </div>

      {filas.length === 0 ? (
        <EmptyState
          icono={IconoMaletin}
          titulo="No hay convocatorias abiertas"
          texto="Cuando el staff publique una convocatoria, va a aparecer acá con tu KPI y tu posición."
        >
          <Boton variante="primary" onClick={() => nav('/mi-perfil')}>Completar mi perfil</Boton>
        </EmptyState>
      ) : null}

      {califican.length > 0 ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <IconoObjetivo className="h-4 w-4" />
            </span>
            <h2 className="section-title">Estás en la lista</h2>
            <Pill tono="green">{califican.length}</Pill>
          </div>

          {califican.map((f) => (
            <article key={f.id} className="card card-hover p-5">
              <div className="flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold">{f.titulo}</h3>
                    {f.posicion ? <Pill tono="violet">#{f.posicion} de {f.total_candidatos}</Pill> : null}
                  </div>
                  {f.descripcion ? <p className="help mt-1">{f.descripcion}</p> : null}
                </div>
                <EstadoBadge estado={f.estado_candidato} />
              </div>

              <div className="mt-4">
                <Progress
                  valor={Number(f.kpi_conv) || 0}
                  max={100}
                  tono="emerald"
                  etiqueta={`KPI de convocatoria ${f.kpi_conv} · umbral ${f.kpi_minimo}`}
                />
              </div>

              {(f.requisitos || []).length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(f.requisitos || []).slice(0, 7).map((r) => (
                    <Pill key={r.nombre} tono={r.obligatorio ? 'violet' : 'slate'}>
                      {r.nombre}{r.nivel_minimo ? ` · ${r.nivel_minimo}` : ''}
                    </Pill>
                  ))}
                  {(f.requisitos || []).length > 7 ? <Pill tono="slate">+{(f.requisitos || []).length - 7}</Pill> : null}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <p className="help">{f.total_candidatos} candidato{f.total_candidatos === 1 ? '' : 's'} en la lista · umbral {f.kpi_minimo}</p>
                <Boton variante="secondary" tamano="sm" onClick={() => nav('/mi-perfil')}>Mejorar mi perfil</Boton>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {noCalifican.length > 0 ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              <IconoReloj className="h-4 w-4" />
            </span>
            <h2 className="section-title">Aún no llegás al umbral</h2>
            <Pill tono="amber">{noCalifican.length}</Pill>
          </div>

          {noCalifican.map((f) => (
            <article key={f.id} className="card p-5">
              <div className="flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold">{f.titulo}</h3>
                    <Pill tono="amber">Umbral {f.kpi_minimo}</Pill>
                  </div>
                  {f.descripcion ? <p className="help mt-1">{f.descripcion}</p> : null}
                </div>
                <EstadoBadge estado={f.estado_candidato} />
              </div>

              <div className="mt-4">
                <Progress
                  valor={Number(f.kpi_conv) || 0}
                  max={100}
                  tono="amber"
                  etiqueta={`KPI de convocatoria ${f.kpi_conv} · umbral ${f.kpi_minimo}`}
                />
              </div>

              {f.motivo_exclusion ? (
                <p className="mt-3 text-sm font-medium text-amber-700 dark:text-amber-400">{f.motivo_exclusion}</p>
              ) : null}

              {(f.requisitos || []).length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(f.requisitos || []).slice(0, 7).map((r) => (
                    <Pill key={r.nombre} tono={r.obligatorio ? 'violet' : 'slate'}>
                      {r.nombre}{r.nivel_minimo ? ` · ${r.nivel_minimo}` : ''}
                    </Pill>
                  ))}
                  {(f.requisitos || []).length > 7 ? <Pill tono="slate">+{(f.requisitos || []).length - 7}</Pill> : null}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <p className="help">Mejorá tus habilidades, experiencia o disponibilidad y volvés a entrar.</p>
                <Boton variante="primary" tamano="sm" onClick={() => nav('/mi-perfil')}>Mejorar mi perfil</Boton>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      <Aviso tono="info" titulo="¿Cómo funciona?">
        El KPI de convocatoria se calcula contra los requisitos de cada proceso. Si no llegás al umbral, seguís viendo la convocatoria y el motivo: nadie queda oculto.
      </Aviso>
    </div>
  );
}
