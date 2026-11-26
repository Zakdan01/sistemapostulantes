import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useEventoRealtime } from '../lib/realtime';
import { useAccion } from '../hooks/useAccion';
import { EstadoBadge } from '../components/EstadoCandidato';
import { Aviso, Boton, EmptyState, PageHeader, Pill, Progress, StatCard } from '../components/ui';
import { IconoMaletin, IconoObjetivo, IconoReloj, IconoTrofeo, IconoUsuarios } from '../components/Iconos';
import { IconoTecnologia } from '../components/IconoTecnologia';

// Vista del postulante: que convocatorias abiertas hay, si califica y su inscripcion voluntaria.
// El sistema lo considera automaticamente si pasa el umbral, pero el postulante decide si inscribirse.
// Si no pasa el umbral, sigue viendo la convocatoria con el motivo (nadie queda oculto).
export function MisConvocatorias() {
  const nav = useNavigate();
  const [filas, setFilas] = useState([]);
  const [err, setErr] = useState('');
  const [cargando, setCargando] = useState(true);
  const { ocupado, ejecutar } = useAccion();

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

  useEffect(() => {
    let cancelado = false;
    api('/api/mis-convocatorias')
      .then((r) => {
        if (!cancelado) {
          setFilas(Array.isArray(r) ? r : []);
          setErr('');
        }
      })
      .catch((ex) => {
        if (!cancelado) setErr(ex.message);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => { cancelado = true; };
  }, []);

  useEventoRealtime('CONVOCATORIA_APROBADA', () => cargar());
  useEventoRealtime('CONVOCATORIA_CERRADA', () => cargar());

  function reintentar() {
    setCargando(true);
    cargar();
  }

  function responderInscripcion(convId, aceptado) {
    return ejecutar(`insc-${convId}-${aceptado}`, async () => {
      await api(`/api/mis-convocatorias/${convId}/inscripcion`, {
        method: 'POST',
        body: JSON.stringify({ aceptado })
      });
      await cargar();
    }, {
      exito: aceptado ? 'Te inscribiste en la convocatoria.' : 'Marcaste que no te interesa participar.'
    });
  }

  const califican = filas.filter((f) => f.califica);
  const pendientes = califican.filter((f) => f.inscripcion === null || f.inscripcion === undefined);
  const inscritas = califican.filter((f) => f.inscripcion === true);
  const rechazadas = califican.filter((f) => f.inscripcion === false);
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
        subtitulo="El sistema te considera automáticamente cuando pasás el umbral, pero vos decidís en cuáles inscribirte."
        icono={IconoMaletin}
      >
        <Pill tono="cyan">{filas.length} abierta{filas.length === 1 ? '' : 's'}</Pill>
        {mejorPosicion ? <Pill tono="violet" punto>Mejor posición #{mejorPosicion}</Pill> : null}
      </PageHeader>

      {err ? <Aviso tono="warn">{err}</Aviso> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard valor={filas.length} etiqueta="Convocatorias abiertas" hint="Procesos publicados" icono={IconoMaletin} tono="cyan" />
        <StatCard valor={inscritas.length} etiqueta="Inscrito" hint={`${pendientes.length} pendiente${pendientes.length === 1 ? '' : 's'} de decisión`} icono={IconoObjetivo} tono="emerald" />
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

      {pendientes.length > 0 ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300">
              <IconoObjetivo className="h-4 w-4" />
            </span>
            <h2 className="section-title">Te están considerando — pendiente de tu decisión</h2>
            <Pill tono="cyan">{pendientes.length}</Pill>
          </div>

          {pendientes.map((f) => (
            <article key={f.id} className="card card-hover p-5 border-cyan-200 dark:border-cyan-900/60">
              <div className="flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold">{f.titulo}</h3>
                    {f.posicion ? <Pill tono="violet">#{f.posicion} de {f.total_candidatos}</Pill> : null}
                    <Pill tono="amber" punto>Pendiente de inscripción</Pill>
                  </div>
                  {f.tipo ? <p className="help mt-1">Tipo: {f.tipo}</p> : null}
                </div>
              </div>

              <div className="mt-4">
                <Progress
                  valor={Number(f.kpi_conv) || 0}
                  max={100}
                  tono="cyan"
                  etiqueta={`KPI de convocatoria ${f.kpi_conv} · umbral ${f.kpi_minimo}`}
                />
              </div>

              {(f.requisitos || []).length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(f.requisitos || []).slice(0, 7).map((r) => (
                    <Pill key={r.nombre} tono={r.obligatorio ? 'violet' : 'slate'}>
                      <IconoTecnologia nombre={r.nombre} tamano="xs" />
                      {r.nombre}{r.obligatorio ? '' : ' (deseable)'}
                    </Pill>
                  ))}
                  {(f.requisitos || []).length > 7 ? <Pill tono="slate">+{(f.requisitos || []).length - 7}</Pill> : null}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <p className="help">Aceptá para que el staff pueda tomarte en el proceso de selección.</p>
                <div className="flex flex-wrap gap-2">
                  <Boton
                    variante="secondary"
                    tamano="sm"
                    cargando={ocupado === `insc-${f.id}-false`}
                    onClick={() => responderInscripcion(f.id, false)}
                  >
                    No me interesa
                  </Boton>
                  <Boton
                    variante="primary"
                    tamano="sm"
                    cargando={ocupado === `insc-${f.id}-true`}
                    onClick={() => responderInscripcion(f.id, true)}
                  >
                    Inscribirme
                  </Boton>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {inscritas.length > 0 ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <IconoObjetivo className="h-4 w-4" />
            </span>
            <h2 className="section-title">Inscrito</h2>
            <Pill tono="green">{inscritas.length}</Pill>
          </div>

          {inscritas.map((f) => (
            <article key={f.id} className="card card-hover p-5">
              <div className="flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold">{f.titulo}</h3>
                    {f.posicion ? <Pill tono="violet">#{f.posicion} de {f.total_candidatos}</Pill> : null}
                    <Pill tono="green" punto>Inscrito</Pill>
                  </div>
                  {f.tipo ? <p className="help mt-1">Tipo: {f.tipo}</p> : null}
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
                      <IconoTecnologia nombre={r.nombre} tamano="xs" />
                      {r.nombre}{r.obligatorio ? '' : ' (deseable)'}
                    </Pill>
                  ))}
                  {(f.requisitos || []).length > 7 ? <Pill tono="slate">+{(f.requisitos || []).length - 7}</Pill> : null}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <p className="help">{f.total_candidatos} candidato{f.total_candidatos === 1 ? '' : 's'} en la lista · umbral {f.kpi_minimo}</p>
                <div className="flex flex-wrap gap-2">
                  {!f.estado_candidato ? (
                    <Boton
                      variante="ghost"
                      tamano="sm"
                      cargando={ocupado === `insc-${f.id}-false`}
                      onClick={() => responderInscripcion(f.id, false)}
                    >
                      Retirarme
                    </Boton>
                  ) : null}
                  <Boton variante="secondary" tamano="sm" onClick={() => nav('/mi-perfil')}>Mejorar mi perfil</Boton>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {rechazadas.length > 0 ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <IconoReloj className="h-4 w-4" />
            </span>
            <h2 className="section-title">No me interesa</h2>
            <Pill tono="slate">{rechazadas.length}</Pill>
          </div>

          {rechazadas.map((f) => (
            <article key={f.id} className="card p-5 opacity-90">
              <div className="flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold">{f.titulo}</h3>
                    <Pill tono="slate">No interesado</Pill>
                  </div>
                  {f.tipo ? <p className="help mt-1">Tipo: {f.tipo}</p> : null}
                </div>
              </div>

              <div className="mt-4">
                <Progress
                  valor={Number(f.kpi_conv) || 0}
                  max={100}
                  tono="slate"
                  etiqueta={`KPI de convocatoria ${f.kpi_conv} · umbral ${f.kpi_minimo}`}
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <p className="help">Rechazaste participar. Podés cambiar de idea cuando quieras.</p>
                <Boton
                  variante="secondary"
                  tamano="sm"
                  cargando={ocupado === `insc-${f.id}-true`}
                  onClick={() => responderInscripcion(f.id, true)}
                >
                  Cambiar de idea (Inscribirme)
                </Boton>
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
                  {f.tipo ? <p className="help mt-1">Tipo: {f.tipo}</p> : null}
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
                      <IconoTecnologia nombre={r.nombre} tamano="xs" />
                      {r.nombre}{r.obligatorio ? '' : ' (deseable)'}
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
