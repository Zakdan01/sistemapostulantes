import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, sesion } from '../lib/api';
import { TablaKPI } from '../components/TablaKPI';
import { EstadoBadge } from '../components/EstadoCandidato';
import { useAccion } from '../hooks/useAccion';
import {
  Avatar,
  Aviso,
  Boton,
  Campo,
  DialogoConfirmar,
  EmptyState,
  PageHeader,
  Pill,
  Progress,
  Seccion,
  StatCard
} from '../components/ui';
import {
  IconoAlerta,
  IconoGrafico,
  IconoMaletin,
  IconoObjetivo,
  IconoReloj,
  IconoTrofeo,
  IconoUsuario,
  IconoUsuarios,
  IconoX
} from '../components/Iconos';

// Gestor por rol:
// - admin: resumen + cuentas por aprobar + convocatorias por aprobar + todo.
// - reclutador: resumen propio + sus convocatorias + candidatos de su proceso de selección.
// - postulante: tablero de selección + en que convocatorias califica.
// Las acciones de selección (contactar/preseleccionar/contratar/descartar) NO se hacen aca:
// viven en el ranking de cada convocatoria (pages/Ranking.jsx, /convocatorias/:id).

function EstadoConv({ estado }) {
  const tono = estado === 'abierta'
    ? 'green'
    : estado === 'pendiente'
      ? 'amber'
      : estado === 'cerrada'
        ? 'slate'
        : 'red';
  return <Pill tono={tono} punto>{estado}</Pill>;
}

export function Gestor() {
  const nav = useNavigate();
  const s = sesion();
  const rol = s.rol;
  const esAdmin = rol === 'admin';
  const esPostulante = rol === 'postulante';
  const [resumen, setResumen] = useState(null);
  const [porAprobar, setPorAprobar] = useState([]);
  const [convocatorias, setConvocatorias] = useState([]);
  const [postulantes, setPostulantes] = useState([]);
  const [tablero, setTablero] = useState([]);
  const [mis, setMis] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [yoId, setYoId] = useState(null);
  const [err, setErr] = useState('');
  const [cargado, setCargado] = useState(false);
  const [confirmar, setConfirmar] = useState(null);
  const { ocupado, error: errorAccion, ejecutar } = useAccion();

  const cargar = useCallback(() => {
    if (esPostulante) {
      Promise.all([api('/api/candidatos'), api('/api/mis-convocatorias'), api('/api/yo')])
        .then(([t, m, y]) => {
          setErr('');
          setTablero(t);
          setMis(m);
          setYoId(y.id);
        })
        .catch((ex) => setErr(ex.message))
        .finally(() => setCargado(true));
      return;
    }
    const llamadas = [
      api('/api/admin/resumen'),
      api('/api/convocatorias?estado=pendiente'),
      api('/api/convocatorias')
    ];
    if (esAdmin) {
      llamadas.push(api('/api/personas'));
      llamadas.push(api('/api/admin/usuarios?estado=pendiente'));
    } else {
      llamadas.push(api('/api/candidatos'));
    }
    Promise.all(llamadas).then(([r, pa, c, extra, cuentasP]) => {
      setErr('');
      setResumen(r);
      setPorAprobar(pa);
      setConvocatorias(c);
      if (esAdmin) {
        setPostulantes(extra.resultados);
        setCuentas(cuentasP);
      } else {
        // candidatos de su proceso (únicos por persona)
        const vistos = new Map();
        for (const t of extra) {
          if (!vistos.has(t.persona_id)) {
            vistos.set(t.persona_id, {
              id: t.persona_id, nombres: t.nombres, apellidos: t.apellidos, correo: t.correo,
              kpi: t.kpi_al_tomar, match: t.match_pct, estado_candidato: t.estado,
              convocatoria_titulo: t.convocatoria_titulo, lenguajes: []
            });
          }
        }
        setPostulantes([...vistos.values()]);
      }
    }).catch((ex) => setErr(ex.message)).finally(() => setCargado(true));
  }, [esAdmin, esPostulante]);

  useEffect(() => { cargar(); }, [cargar]);

  function decidirConv(id, accion, etiqueta) {
    return ejecutar(`c${id}${accion}`, async () => {
      await api(`/api/convocatorias/${id}/${accion}`, { method: 'PATCH' });
      await cargar();
    }, { exito: `Convocatoria ${etiqueta}.` });
  }

  function decidirCuenta(id, accion, etiqueta) {
    return ejecutar(`u${id}${accion}`, async () => {
      await api(`/api/admin/usuarios/${id}/${accion}`, { method: 'PATCH' });
      await cargar();
    }, { exito: `Cuenta ${etiqueta}.` });
  }

  function confirmarAccion() {
    if (!confirmar) return;
    const accion = confirmar.onConfirmar;
    setConfirmar(null);
    accion();
  }

  const [staff, setStaff] = useState({ correo: '', password: '', rol: 'reclutador' });
  const [staffMsg, setStaffMsg] = useState('');

  function crearStaff(e) {
    e.preventDefault();
    setStaffMsg('');
    return ejecutar('staff', async () => {
      const r = await api('/api/admin/usuarios', { method: 'POST', body: JSON.stringify(staff) });
      setStaffMsg(`Cuenta ${r.rol} creada y activa: ${r.correo}`);
      setStaff({ correo: '', password: '', rol: 'reclutador' });
      await cargar();
      return r;
    }, { exito: (r) => `Cuenta ${r.rol} creada y activa: ${r.correo}` });
  }

  // ---------------- Vista del postulante ----------------
  if (esPostulante) {
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
        {errorAccion ? <Aviso tono="error">{errorAccion}</Aviso> : null}
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
                      {m.descripcion ? <p className="help mt-0.5 line-clamp-2">{m.descripcion}</p> : null}
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

        <Seccion titulo={`Candidatos en selección (${tablero.length})`} icono={IconoUsuarios}>
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
                        <p className={`min-w-0 flex-1 truncate text-sm ${p.persona_id === yoId ? 'font-bold text-brand-700 dark:text-brand-300' : ''}`}>
                          {p.nombres} {p.apellidos}{p.persona_id === yoId ? ' (tú)' : ''}
                        </p>
                        <EstadoBadge estado={p.estado} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Seccion>

        <DialogoConfirmar
          abierto={Boolean(confirmar)}
          titulo={confirmar?.titulo}
          texto={confirmar?.texto}
          confirmar={confirmar?.confirmar}
          tono={confirmar?.tono}
          onConfirmar={confirmarAccion}
          onCancelar={() => setConfirmar(null)}
        />
      </div>
    );
  }

  // ---------------- Vista del staff (admin / reclutador) ----------------
  const tarjetas = resumen ? [
    { etiqueta: 'Convocatorias abiertas', valor: resumen.abiertas, icono: IconoMaletin, tono: 'cyan' },
    { etiqueta: 'Candidatos en lista', valor: resumen.candidatos?.total, icono: IconoUsuarios, tono: 'violet' },
    { etiqueta: 'Preseleccionados', valor: resumen.preseleccionados, icono: IconoObjetivo, tono: 'emerald' },
    { etiqueta: 'Contratados', valor: resumen.contratados, icono: IconoTrofeo, tono: 'amber' },
    { etiqueta: 'Tomados', valor: resumen.pendientes, icono: IconoReloj, tono: 'slate' },
    { etiqueta: 'Contactados', valor: resumen.consultas, icono: IconoUsuario, tono: 'amber' },
    { etiqueta: 'Cerradas', valor: resumen.cerradas, icono: IconoMaletin, tono: 'slate' },
    { etiqueta: 'Postulantes', valor: resumen.postulantes, icono: IconoUsuarios, tono: 'cyan' },
    { etiqueta: 'Convocatorias por aprobar', valor: resumen.pendientes_aprobacion ?? porAprobar.length, icono: IconoAlerta, tono: 'rose' },
    { etiqueta: 'Descartados', valor: resumen.descartados, icono: IconoX, tono: 'rose' }
  ] : [];

  if (!resumen && !err) {
    return (
      <div className="space-y-5">
        <div className="space-y-2"><div className="skeleton h-8 w-72" /><div className="skeleton h-4 w-96 max-w-full" /></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton h-28" />)}
        </div>
        <div className="skeleton h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        titulo={rol === 'reclutador' ? 'Mi panel de reclutamiento' : 'Panel de administración'}
        subtitulo="Resumen de convocatorias, cuentas y candidatos del sistema."
        icono={IconoGrafico}
      >
        <Boton variante="primary" onClick={() => nav('/convocatorias')} icono={IconoMaletin}>
          Ir a convocatorias
        </Boton>
        {esAdmin ? <Boton variante="secondary" onClick={() => nav('/buscar')} icono={IconoUsuarios}>Buscar candidatos</Boton> : null}
      </PageHeader>

      {err ? <Aviso tono="error" titulo="No se pudo cargar el panel">{err}</Aviso> : null}
      {errorAccion ? <Aviso tono="error">{errorAccion}</Aviso> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {tarjetas.map((t) => (
          <StatCard key={t.etiqueta} valor={t.valor} etiqueta={t.etiqueta} icono={t.icono} tono={t.tono} />
        ))}
      </div>

      <Aviso tono="info">
        Las acciones de selección (contactar, preseleccionar, contratar, descartar) se hacen dentro de cada
        convocatoria, en <b>Ver candidatos</b>.
      </Aviso>

      {esAdmin ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Seccion titulo="Crear cuenta de staff" icono={IconoUsuario}>
            <p className="help mb-3">Reclutadores y admins nacen activos. Los postulantes se registran solos.</p>
            {staffMsg ? <Aviso tono="ok" className="mb-3">{staffMsg}</Aviso> : null}
            <form onSubmit={crearStaff} className="grid gap-3 sm:grid-cols-2">
              <Campo etiqueta="Correo *">
                <input
                  className="input"
                  type="email"
                  autoComplete="off"
                  value={staff.correo}
                  onChange={(e) => setStaff({ ...staff, correo: e.target.value })}
                />
              </Campo>
              <Campo etiqueta="Contraseña (8+) *">
                <input
                  className="input"
                  type="password"
                  autoComplete="new-password"
                  value={staff.password}
                  onChange={(e) => setStaff({ ...staff, password: e.target.value })}
                />
              </Campo>
              <Campo etiqueta="Rol">
                <select className="input" value={staff.rol} onChange={(e) => setStaff({ ...staff, rol: e.target.value })}>
                  <option value="reclutador">Reclutador</option>
                  <option value="admin">Admin</option>
                </select>
              </Campo>
              <div className="flex items-end">
                <Boton type="submit" variante="primary" cargando={ocupado === 'staff'} className="w-full">
                  Crear cuenta
                </Boton>
              </div>
            </form>
          </Seccion>

          <Seccion
            titulo="Cuentas por aprobar"
            icono={IconoAlerta}
            extra={<Pill tono={cuentas.length ? 'amber' : 'slate'} punto>{cuentas.length}</Pill>}
          >
            {cuentas.length === 0 ? (
              <EmptyState icono={IconoUsuario} titulo="Sin cuentas pendientes" texto="Las nuevas inscripciones aparecerán acá." />
            ) : (
              <div className="space-y-2">
                {cuentas.map((u) => (
                  <div key={u.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <Avatar nombre={u.correo} tamano="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{u.correo}</p>
                      <p className="help">{u.rol}</p>
                    </div>
                    <Boton
                      variante="success"
                      tamano="xs"
                      cargando={ocupado === `u${u.id}aprobar`}
                      onClick={() => decidirCuenta(u.id, 'aprobar', 'aprobada')}
                    >
                      Aprobar
                    </Boton>
                    <Boton
                      variante="danger"
                      tamano="xs"
                      onClick={() => setConfirmar({
                        titulo: 'Rechazar cuenta',
                        texto: `La cuenta ${u.correo} se rechaza y se elimina. Esta acción no se puede deshacer.`,
                        confirmar: 'Rechazar cuenta',
                        tono: 'danger',
                        onConfirmar: () => decidirCuenta(u.id, 'rechazar', 'rechazada y eliminada')
                      })}
                    >
                      Rechazar
                    </Boton>
                  </div>
                ))}
              </div>
            )}
          </Seccion>
        </div>
      ) : null}

      <Seccion
        titulo="Convocatorias por aprobar"
        icono={IconoAlerta}
        extra={<Pill tono={porAprobar.length ? 'amber' : 'slate'} punto>{porAprobar.length}</Pill>}
      >
        {porAprobar.length === 0 ? (
          <EmptyState icono={IconoMaletin} titulo="Sin pendientes de publicación" texto="Todo lo creado por el equipo ya está revisado." />
        ) : (
          <div className="space-y-2">
            {porAprobar.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{c.titulo}</p>
                  <p className="help mt-0.5">{c.creada_por_correo} · {c.requisitos || 'sin requisitos'}</p>
                </div>
                {esAdmin ? (
                  <>
                    <Boton
                      variante="success"
                      tamano="xs"
                      cargando={ocupado === `c${c.id}aprobar`}
                      onClick={() => decidirConv(c.id, 'aprobar', 'publicada')}
                    >
                      Publicar
                    </Boton>
                    <Boton
                      variante="danger"
                      tamano="xs"
                      onClick={() => setConfirmar({
                        titulo: 'Rechazar convocatoria',
                        texto: `La convocatoria «${c.titulo}» va a quedar rechazada y en solo lectura.`,
                        confirmar: 'Rechazar',
                        tono: 'danger',
                        onConfirmar: () => decidirConv(c.id, 'rechazar', 'rechazada')
                      })}
                    >
                      Rechazar
                    </Boton>
                  </>
                ) : (
                  <span className="help">Solo el admin puede aprobar</span>
                )}
              </div>
            ))}
          </div>
        )}
      </Seccion>

      <Seccion
        titulo={`${rol === 'reclutador' ? 'Mis convocatorias' : 'Todas las convocatorias'} (${convocatorias.length})`}
        icono={IconoMaletin}
      >
        {convocatorias.length === 0 ? (
          <EmptyState
            icono={IconoMaletin}
            titulo="Todavía no hay convocatorias"
            texto="Crea la primera convocatoria y publica los requisitos."
          >
            <Boton variante="primary" onClick={() => nav('/convocatorias')}>Crear convocatoria</Boton>
          </EmptyState>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {convocatorias.map((c) => (
              <div key={c.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{c.titulo}</p>
                    <EstadoConv estado={c.estado} />
                    {c.completa ? <Pill tono="cyan">cupos completos</Pill> : null}
                  </div>
                  <p className="help mt-0.5">
                    {c.total_candidatos} candidatos · {c.total_postulados} en selección · umbral {c.kpi_minimo}
                  </p>
                  <Progress
                    className="mt-2 max-w-xs"
                    valor={c.contratados}
                    max={c.cupos}
                    tono={c.completa ? 'emerald' : 'cyan'}
                    etiqueta={`${c.contratados}/${c.cupos} cupos`}
                  />
                </div>
                <Boton variante="secondary" tamano="sm" onClick={() => nav(`/convocatorias/${c.id}`)}>
                  Ver candidatos
                </Boton>
              </div>
            ))}
          </div>
        )}
      </Seccion>

      <Seccion
        titulo={`${rol === 'reclutador' ? 'Postulantes en mi proceso de selección' : 'Todos los postulantes'} (${postulantes.length})`}
        icono={IconoUsuarios}
      >
        <TablaKPI filas={postulantes} onVer={(f) => nav(`/personas/${f.id}`)} />
      </Seccion>

      <DialogoConfirmar
        abierto={Boolean(confirmar)}
        titulo={confirmar?.titulo}
        texto={confirmar?.texto}
        confirmar={confirmar?.confirmar}
        tono={confirmar?.tono}
        onConfirmar={confirmarAccion}
        onCancelar={() => setConfirmar(null)}
      />
    </div>
  );
}
