import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Badge } from '../components/TablaKPI';
import { EstadoBadge } from '../components/EstadoCandidato';
import { ACCIONES, transicionesDe } from '../lib/estados';
import { useCatalogos } from '../lib/catalogos';
import { useAccion } from '../hooks/useAccion';
import {
  Aviso,
  Avatar,
  Boton,
  Campo,
  EmptyState,
  PageHeader,
  Pill,
  Progress,
  Seccion
} from '../components/ui';
import {
  IconoCandado,
  IconoFiltro,
  IconoFlechaIzq,
  IconoObjetivo,
  IconoUsuarios
} from '../components/Iconos';

// Lista VIVA de candidatos de la convocatoria: el sistema enlista solo a quien pasa
// el umbral (kpi_minimo) y los ordena por KPI de convocatoria. Los que no pasan
// aparecen igual, en "excluidos", con el motivo (nadie queda oculto).
// Los cupos viven aca: al contratar al ultimo la convocatoria se cierra sola y el
// proceso de seleccion queda en solo lectura.
export function Ranking() {
  const { id } = useParams();
  const nav = useNavigate();
  const catalogos = useCatalogos();
  const { ocupado, error, setError, ejecutar } = useAccion();
  const [r, setR] = useState(null);
  const [umbral, setUmbral] = useState('');
  const [cuposEdit, setCuposEdit] = useState('');
  const [verExcluidos, setVerExcluidos] = useState(false);
  const [verDetalle, setVerDetalle] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const d = await api(`/api/convocatorias/${id}/ranking`);
      setR(d);
      setUmbral(String(d.umbral));
      setCuposEdit(String(d.cupos ?? ''));
      setError('');
    } catch (ex) { setError(ex.message); }
  }, [id, setError]);

  useEffect(() => { cargar(); }, [cargar]);

  function cambiar(personaId, estado, etiqueta) {
    return ejecutar(`${personaId}${estado}`, async () => {
      const res = await api(`/api/convocatorias/${id}/candidatos/${personaId}/estado`, {
        method: 'PATCH', body: JSON.stringify({ estado })
      });
      await cargar();
      return res;
    }, {
      exito: (res) => (res && res.cierre_automatico
        ? `Contratado. Se completaron los ${res.convocatoria?.cupos ?? ''} cupos: la convocatoria quedó cerrada.`
        : `Candidato ${etiqueta || estado}.`)
    });
  }

  function guardarUmbral(e) {
    e.preventDefault();
    return ejecutar('umbral', async () => {
      await api(`/api/convocatorias/${id}/umbral`, {
        method: 'PATCH', body: JSON.stringify({ kpi_minimo: Number(umbral) })
      });
      await cargar();
    }, { exito: 'Umbral actualizado. La lista se recalculó.' });
  }

  function guardarCupos(e) {
    e.preventDefault();
    return ejecutar('cupos', async () => {
      const res = await api(`/api/convocatorias/${id}/cupos`, {
        method: 'PATCH', body: JSON.stringify({ cupos: Number(cuposEdit) })
      });
      await cargar();
      return res;
    }, {
      exito: (res) => (res && res.cierre_automatico
        ? 'Cupos actualizados. La convocatoria quedó cerrada (cupos completos).'
        : 'Cupos actualizados.')
    });
  }

  if (error && !r) {
    return (
      <div className="space-y-4">
        <PageHeader titulo="Candidatos" icono={IconoUsuarios}>
          <Boton variante="ghost" icono={IconoFlechaIzq} onClick={() => nav('/convocatorias')}>Volver</Boton>
        </PageHeader>
        <Aviso tono="error" titulo="No se pudo cargar la convocatoria">{error}</Aviso>
        <Boton variante="primary" onClick={cargar}>Reintentar</Boton>
      </div>
    );
  }

  if (!r) {
    return (
      <div className="space-y-5">
        <div className="space-y-2"><div className="skeleton h-8 w-80 max-w-full" /><div className="skeleton h-4 w-96 max-w-full" /></div>
        <div className="skeleton h-40" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-28" />)}
        </div>
        <div className="skeleton h-72" />
      </div>
    );
  }

  const puntos = (catalogos && catalogos.puntos) || { cobertura_max: 40, calidad_max: 40 };
  const estadoConv = r.convocatoria.estado;
  const soloLectura = estadoConv === 'cerrada' || estadoConv === 'rechazada';
  const cupos = Number(r.cupos ?? r.convocatoria.cupos ?? 0);
  const contratados = Number(r.contratados ?? r.convocatoria.contratados ?? 0);
  const disponibles = Math.max(cupos - contratados, 0);
  const tonoEstado = estadoConv === 'abierta' ? 'green' : estadoConv === 'pendiente' ? 'amber' : estadoConv === 'cerrada' ? 'slate' : 'red';

  function detalle(p) {
    const d = p.desglose || {};
    const base = `KPI total ${p.kpi_conv ?? p.score} = requisitos ${d.puntos_requisitos ?? 0} (cobertura ${d.puntos_cobertura ?? 0} + calidad ${d.puntos_calidad ?? 0}) × factor años ${d.factor_anios_min ?? 1} + experiencia ${d.puntos_exp ?? 0} + disponibilidad ${d.puntos_disp ?? 0}`;
    const reqs = (d.por_requisito || [])
      .map((x) => `${x.nombre}${x.obligatorio ? '★' : '○'}${x.nivel_minimo ? ` ≥${x.nivel_minimo}` : ''}: ${x.puntos} pts (cob ${x.puntos_cobertura} / cal ${x.puntos_calidad})${x.presente ? '' : ' — no lo tiene'}`)
      .join(' | ');
    return reqs ? `${base}\n${reqs}` : base;
  }

  function acciones(p) {
    if (soloLectura) return <span className="help">Solo lectura</span>;
    const etapa = p.estado_candidato;
    if (!etapa) {
      const accion = ACCIONES.postulado;
      const clave = `${p.persona_id}postulado`;
      return (
        <Boton
          variante={accion.variante}
          tamano="xs"
          cargando={ocupado === clave}
          onClick={() => cambiar(p.persona_id, 'postulado', 'tomado como candidato')}
        >
          {accion.texto}
        </Boton>
      );
    }
    const posibles = transicionesDe(catalogos, etapa);
    if (!posibles.length) return <Pill tono="slate">etapa final</Pill>;
    return (
      <span className="flex flex-wrap gap-1">
        {posibles.map((destino) => {
          const accion = ACCIONES[destino] || { texto: destino, variante: 'secondary' };
          const clave = `${p.persona_id}${destino}`;
          return (
            <Boton
              key={destino}
              variante={accion.variante}
              tamano="xs"
              cargando={ocupado === clave}
              onClick={() => cambiar(p.persona_id, destino, accion.texto.toLowerCase())}
            >
              {accion.texto}
            </Boton>
          );
        })}
      </span>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        titulo={`Candidatos — ${r.convocatoria.titulo}`}
        subtitulo={`Lista automática: el sistema enlista a todo el padrón y muestra a quienes pasan el umbral, ordenados por KPI de convocatoria.`}
        icono={IconoUsuarios}
      >
        <Boton variante="ghost" icono={IconoFlechaIzq} onClick={() => nav('/convocatorias')}>Volver</Boton>
        <Pill tono={tonoEstado} punto>{estadoConv}</Pill>
      </PageHeader>

      {error ? <Aviso tono="error">{error}</Aviso> : null}

      {soloLectura ? (
        <Aviso tono="warn" titulo="Convocatoria en solo lectura" icono={IconoCandado}>
          {estadoConv === 'cerrada'
            ? `Se completaron los ${contratados}/${cupos} cupos: el proceso de selección de esta convocatoria quedó en solo lectura.`
            : 'La convocatoria fue rechazada: el proceso de selección es solo lectura.'}
        </Aviso>
      ) : null}

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <Pill tono="slate">{r.total_patron} personas en el padrón</Pill>
              <Pill tono="cyan">umbral {r.umbral}</Pill>
              <Pill tono="violet">{r.convocatoria.anios_min} años mín.</Pill>
              <Pill tono="slate">{r.convocatoria.disponibilidad || 'sin disponibilidad'}</Pill>
              <Pill tono="slate">{r.convocatoria.creada_por_correo || 'sin dueño'}</Pill>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {r.convocatoria.descripcion || 'Sin descripción cargada.'}
            </p>
            {verDetalle ? (
              r.convocatoria.requisitos && r.convocatoria.requisitos.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {r.convocatoria.requisitos.map((x) => (
                    <span key={x.nombre} className="chip cursor-default">
                      {x.nombre}{x.obligatorio ? ' ★' : ' ○'}{x.nivel_minimo ? ` ≥${x.nivel_minimo}` : ''}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="help">Sin requisitos: la lista la ordena solo el perfil.</p>
              )
            ) : null}
            <div>
              <button type="button" className="link text-xs" onClick={() => setVerDetalle(!verDetalle)}>
                {verDetalle ? 'Ocultar detalle' : 'Ver detalle de la convocatoria'}
              </button>
            </div>
          </div>

          <div className="sm:w-60 sm:shrink-0 sm:border-l sm:border-slate-100 sm:pl-5 dark:sm:border-slate-800">
            <p className="help">Cupos cubiertos</p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight tabular-nums">
              {contratados}
              <span className="text-lg font-semibold text-slate-400">/{cupos}</span>
            </p>
            <Progress
              className="mt-2"
              valor={contratados}
              max={cupos}
              tono={r.completa ? 'emerald' : 'cyan'}
              etiqueta={`${disponibles} disponibles${r.completa ? ' · completos' : ''}`}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-4">
          <p className="text-2xl font-extrabold tabular-nums">{r.total_patron}</p>
          <p className="help mt-1">Personas en el padrón</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">{r.total}</p>
          <p className="help mt-1">Pasan el umbral {r.umbral}</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-extrabold tabular-nums text-amber-600 dark:text-amber-400">{r.excluidos.length}</p>
          <p className="help mt-1">Quedan afuera (con motivo)</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-extrabold tabular-nums text-brand-600 dark:text-brand-300">{disponibles}</p>
          <p className="help mt-1">Cupos libres</p>
        </div>
      </div>

      {!soloLectura ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Seccion titulo="Umbral de enlistado" icono={IconoObjetivo}>
            <form onSubmit={guardarUmbral} className="flex flex-wrap items-end gap-2">
              <Campo
                etiqueta="KPI mínimo"
                ayuda="Quien no lo alcanza queda en la lista de excluidos."
                className="w-28"
              >
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="100"
                  value={umbral}
                  onChange={(e) => setUmbral(e.target.value)}
                />
              </Campo>
              <Boton type="submit" variante="secondary" cargando={ocupado === 'umbral'}>
                Guardar umbral
              </Boton>
            </form>
          </Seccion>

          <Seccion titulo="Cupos (vacantes)" icono={IconoUsuarios}>
            <form onSubmit={guardarCupos} className="flex flex-wrap items-end gap-2">
              <Campo
                etiqueta="Cantidad"
                ayuda={`Si los bajás por debajo de los contratados (${contratados}), la convocatoria se cierra.`}
                className="w-28"
              >
                <input
                  className="input"
                  type="number"
                  min="1"
                  max="999"
                  value={cuposEdit}
                  onChange={(e) => setCuposEdit(e.target.value)}
                />
              </Campo>
              <Boton type="submit" variante="secondary" cargando={ocupado === 'cupos'}>
                Guardar cupos
              </Boton>
            </form>
          </Seccion>
        </div>
      ) : null}

      <Seccion
        titulo={`Ranking de candidatos (${r.total} de ${r.total_patron})`}
        icono={IconoUsuarios}
        extra={<Pill tono="cyan">ordenado por KPI</Pill>}
      >
        <p className="help mb-3">
          Flujo: <b>Tomado</b> → <b>Contactado</b> (lo contactaste) → <b>Preseleccionado</b> o <b>Descartado</b>;
          desde descartado se puede volver a contactado.
        </p>
        {r.resultados.length === 0 ? (
          <EmptyState
            icono={IconoUsuarios}
            titulo="Nadie alcanza el umbral"
            texto="Bajá el umbral de enlistado para ampliar la lista de candidatos."
          />
        ) : (
          <div className="tbl-wrap">
            <table className="min-w-full tbl">
              <thead>
                <tr>
                  <th className="text-left">Persona</th>
                  <th className="text-right" title="KPI de convocatoria: requisitos (cobertura + calidad) × años mínimos + experiencia + disponibilidad">KPI total</th>
                  <th className="text-right" title={`50% de los requisitos: puntos por tener la tecnología (sobre ${puntos.cobertura_max})`}>Cobertura</th>
                  <th className="text-right" title={`50% de los requisitos: puntos por nivel y años de uso (sobre ${puntos.calidad_max})`}>Calidad</th>
                  <th className="text-right" title="Calidad general del perfil (desempate)">Perfil %</th>
                  <th className="text-right" title="Obligatorios presentes / total de obligatorios (sin nivel ni años)">Match</th>
                  <th className="text-left">Calificación</th>
                  <th className="text-left">Estado</th>
                  <th className="text-left">Acción</th>
                </tr>
              </thead>
              <tbody>
                {r.resultados.map((p) => {
                  const d = p.desglose || {};
                  const cob = Number(d.puntos_cobertura ?? 0);
                  const cal = Number(d.puntos_calidad ?? 0);
                  const pctCob = Math.round((cob / puntos.cobertura_max) * 100);
                  const pctCal = Math.round((cal / puntos.calidad_max) * 100);
                  return (
                    <tr key={p.persona_id}>
                      <td>
                        <div className="flex min-w-0 items-center gap-2.5">
                          <Avatar nombre={`${p.nombres} ${p.apellidos}`} tamano="sm" />
                          <button
                            type="button"
                            className="link truncate text-left"
                            onClick={() => nav(`/personas/${p.persona_id}`)}
                          >
                            {p.nombres} {p.apellidos}
                          </button>
                        </div>
                      </td>
                      <td className="text-right font-bold tabular-nums" title={detalle(p)}>{p.kpi_conv ?? p.score}</td>
                      <td className="text-right">
                        <div className="ml-auto w-24">
                          <div className="flex items-center justify-between text-xs">
                            <span className="tabular-nums">{cob}</span>
                            <span className="text-[10px] text-slate-400">{pctCob}%</span>
                          </div>
                          <Progress className="mt-1" valor={pctCob} max={100} tono="violet" />
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="ml-auto w-24">
                          <div className="flex items-center justify-between text-xs">
                            <span className="tabular-nums">{cal}</span>
                            <span className="text-[10px] text-slate-400">{pctCal}%</span>
                          </div>
                          <Progress className="mt-1" valor={pctCal} max={100} tono="cyan" />
                        </div>
                      </td>
                      <td className="text-right tabular-nums">{p.kpi}</td>
                      <td className="text-right tabular-nums">{p.match}%</td>
                      <td><Badge valor={p.clasificacion} /></td>
                      <td><EstadoBadge estado={p.estado_candidato} /></td>
                      <td>{acciones(p)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Seccion>

      <Seccion
        titulo={`Excluidos (${r.excluidos.length})`}
        icono={IconoFiltro}
        extra={(
          <Boton variante="ghost" tamano="sm" onClick={() => setVerExcluidos(!verExcluidos)}>
            {verExcluidos ? 'Ocultar' : 'Ver lista'}
          </Boton>
        )}
      >
        {r.excluidos.length === 0 ? (
          <p className="help">Nadie quedó afuera: todas las personas del padrón superan el umbral.</p>
        ) : verExcluidos ? (
          <div className="grid gap-2 md:grid-cols-2">
            {r.excluidos.map((x) => (
              <div key={x.persona_id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Avatar nombre={`${x.nombres} ${x.apellidos}`} tamano="xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{x.nombres} {x.apellidos}</p>
                    <p className="help truncate">{x.correo}</p>
                  </div>
                  <Pill tono="slate">KPI {x.kpi_conv}</Pill>
                </div>
                <p className="help mt-2">{x.motivo_exclusion}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="help">
            {r.excluidos.length} persona{r.excluidos.length === 1 ? '' : 's'} no alcanza{r.excluidos.length === 1 ? '' : 'n'} el umbral {r.umbral}. Nadie queda oculto.
          </p>
        )}
      </Seccion>
    </div>
  );
}
