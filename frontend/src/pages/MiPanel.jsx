import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, sesion } from '../lib/api';
import { useEventoRealtime } from '../lib/realtime';
import { EstadoBadge } from '../components/EstadoCandidato';
import {
  Avatar,
  Aviso,
  Boton,
  EmptyState,
  PageHeader,
  Pill,
  Progress,
  Seccion,
  StatCard
} from '../components/ui';
import {
  IconoGrafico,
  IconoMaletin,
  IconoObjetivo,
  IconoTrofeo,
  IconoUsuarios
} from '../components/Iconos';

// Panel del postulante: en que convocatorias califica y en cuales esta en seleccion.
// No se postula: el perfil entra solo en las listas donde supera el umbral.
export function MiPanel() {
  const nav = useNavigate();
  const [s, setS] = useState(sesion);
  const [tablero, setTablero] = useState([]);
  const [mis, setMis] = useState([]);
  const [err, setErr] = useState('');
  const [cargado, setCargado] = useState(false);

  const cargar = useCallback(() => {
    Promise.all([api('/api/candidatos'), api('/api/mis-convocatorias')])
      .then(([t, m]) => {
        setErr('');
        setTablero(t);
        setMis(m);
      })
      .catch((ex) => setErr(ex.message))
      .finally(() => setCargado(true));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Actualizar sesión y datos en vivo cuando el admin apruebe la cuenta
  useEffect(() => {
    const onSesion = () => {
      setS(sesion());
      cargar();
    };
    window.addEventListener('sesion-cambiada', onSesion);
    return () => window.removeEventListener('sesion-cambiada', onSesion);
  }, [cargar]);

  useEventoRealtime('CONVOCATORIA_APROBADA', () => cargar());
  useEventoRealtime('CONVOCATORIA_CERRADA', () => cargar());

  const porConv = {};
  for (const t of tablero) {
    (porConv[t.convocatoria_titulo] = porConv[t.convocatoria_titulo] || []).push(t);
  }
  const califican = mis.filter((m) => m.califica);
  const conPosicion = mis.filter((m) => m.califica && m.posicion);
  const mejorPosicion = conPosicion.length
    ? conPosicion.reduce((mejor, m) => (m.posicion < mejor.posicion ? m : mejor), conPosicion[0])
    : null;

  if (!cargado) {
    return (
      <div className="space-y-5">
        <div className="space-y-2"><div className="skeleton h-8 w-64" /><div className="skeleton h-4 w-96 max-w-full" /></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-28" />)}
        </div>
        <div className="skeleton h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Mi panel"
        subtitulo="Tu perfil te enlista solo en las convocatorias donde cumples el umbral. No hay que postular."
        icono={IconoObjetivo}
      >
        <Boton variante="primary" onClick={() => nav('/mis-convocatorias')}>Ver mis convocatorias</Boton>
        <Boton variante="secondary" onClick={() => nav('/mi-perfil')}>Completar mi perfil</Boton>
      </PageHeader>

      {err ? <Aviso tono="error" titulo="No se pudo cargar el panel">{err}</Aviso> : null}
      {s.estado === 'pendiente' ? (
        <Aviso tono="warn" titulo="Tu cuenta está pendiente de aprobación">
          Puedes ver y completar tu perfil, pero entrarás al padrón de candidatos cuando el admin te apruebe.
        </Aviso>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard valor={mis.length} etiqueta="Convocatorias abiertas" icono={IconoMaletin} tono="cyan" />
        <StatCard valor={califican.length} etiqueta="Donde cumples el umbral" icono={IconoObjetivo} tono="emerald" />
        <StatCard valor={tablero.length} etiqueta="Candidaturas en selección" icono={IconoUsuarios} tono="violet" />
        <StatCard
          valor={mejorPosicion ? `#${mejorPosicion.posicion}` : '—'}
          etiqueta="Tu mejor posición"
          icono={IconoTrofeo}
          tono="amber"
          hint={mejorPosicion ? mejorPosicion.titulo : 'Todavía sin posición'}
        />
      </div>

      <Seccion
        titulo={`Convocatorias donde califico (${califican.length} de ${mis.length})`}
        icono={IconoGrafico}
      >
        {mis.length === 0 ? (
          <EmptyState
            icono={IconoMaletin}
            titulo="No hay convocatorias abiertas"
            texto="Cuando el equipo publique una convocatoria, vas a verla acá automáticamente."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {mis.map((m) => (
              <div key={m.id} className="card card-hover space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{m.titulo}</p>
                    {m.tipo ? <p className="help mt-0.5 line-clamp-2">Tipo: {m.tipo}</p> : null}
                  </div>
                  <EstadoBadge estado={m.estado_candidato} />
                </div>
                <Progress
                  valor={m.kpi_conv}
                  max={m.kpi_minimo || 100}
                  tono={m.califica ? 'emerald' : 'amber'}
                  etiqueta={`KPI ${m.kpi_conv} / umbral ${m.kpi_minimo}`}
                />
                <div className="flex flex-wrap items-center gap-2">
                  {m.califica && m.posicion ? (
                    <Pill tono="violet">Posición {m.posicion} de {m.total_candidatos}</Pill>
                  ) : (
                    <Pill tono="slate">{m.total_candidatos} candidatos</Pill>
                  )}
                  {!m.califica && m.motivo_exclusion ? (
                    <span className="help">{m.motivo_exclusion}</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Seccion>

      <Seccion titulo={`Candidaturas en selección (${tablero.length})`} icono={IconoUsuarios}>
        {tablero.length === 0 ? (
          <EmptyState
            icono={IconoUsuarios}
            titulo="Todavía no estás en un proceso"
            texto="En cuanto tu perfil supere el umbral de una convocatoria, el equipo podrá tomarte como candidato."
          />
        ) : (
          <div className="space-y-3">
            {Object.entries(porConv).map(([titulo, lista]) => (
              <div key={titulo} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <p className="mb-2 text-sm font-semibold">{titulo} <span className="help">({lista.length})</span></p>
                <div className="space-y-1.5">
                  {lista.map((p) => (
                    <div key={p.id} className="flex items-center gap-2.5">
                      <Avatar nombre={`${p.nombres} ${p.apellidos}`} tamano="xs" />
                      <p className="min-w-0 flex-1 truncate text-sm">{p.nombres} {p.apellidos}</p>
                      <EstadoBadge estado={p.estado} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Seccion>
    </div>
  );
}
