import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, sesion } from '../lib/api';
import { useToast } from '../lib/toast';
import { useCatalogos } from '../lib/catalogos';
import {
  AnilloKPI,
  Aviso,
  Boton,
  Campo,
  PageHeader,
  Pill,
  Progress,
  Seccion
} from '../components/ui';
import {
  IconoBasura,
  IconoCheck,
  IconoDocumento,
  IconoEnlace,
  IconoMaletin,
  IconoMas,
  IconoReloj,
  IconoUsuario,
  IconoX
} from '../components/Iconos';

// Mi perfil: el postulante completa su CV (contacto + habilidades + experiencias + formaciones).
// Los catalogos (niveles, disponibilidades, instituciones) vienen del backend.
export function MiPerfil() {
  const catalogos = useCatalogos();
  const cats = useMemo(() => ({
    tecnologias: (catalogos && catalogos.tecnologias) || [],
    tipos_trabajo: (catalogos && catalogos.tipos_trabajo) || [],
    niveles: ((catalogos && catalogos.niveles_tecnologia) || []).map((n) => n.nombre),
    instituciones: (catalogos && catalogos.instituciones) || [],
    niveles_formacion: (catalogos && catalogos.niveles_formacion) || [],
    disponibilidades: (catalogos && catalogos.disponibilidades) || []
  }), [catalogos]);
  const [form, setForm] = useState({ nombres: '', apellidos: '', telefono: '', direccion: '', linkedin: '', github: '', portafolio_url: '', disponibilidad: '' });
  const [habs, setHabs] = useState([]);
  const [hab, setHab] = useState({ nombre: '', nivel: '', anios_uso: 1 });
  const [exps, setExps] = useState([]);
  const [exp, setExp] = useState({ empresa: '', cargo: '', descripcion: '', tipo_trabajo: '', fecha_inicio: '', fecha_fin: '', es_actual: false });
  const [forms, setForms] = useState([]);
  const [formF, setFormF] = useState({ titulo: '', institucion: '', nivel: '', fecha_inicio: '', fecha_fin: '' });
  const [kpi, setKpi] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const toast = useToast();
  const s = sesion();
  const pendiente = s.estado === 'pendiente';

  const volcar = useCallback((p) => {
    setForm({
      nombres: p.nombres || '', apellidos: p.apellidos || '', telefono: p.telefono || '',
      direccion: p.direccion || '', linkedin: p.linkedin || '', github: p.github || '',
      portafolio_url: p.portafolio_url || '', disponibilidad: p.disponibilidad || ''
    });
    setHabs((p.habilidades || []).map((h) => ({ nombre: h.nombre, nivel: h.nivel || '', anios_uso: Number(h.anios_uso) || 0 })));
    setExps((p.experiencias || []).map((e) => ({
      empresa: e.empresa || '', cargo: e.cargo || '', descripcion: e.descripcion || '', tipo_trabajo: e.tipo_trabajo || '',
      fecha_inicio: (e.fecha_inicio || '').slice(0, 10), fecha_fin: (e.fecha_fin || '').slice(0, 10), es_actual: !!e.es_actual
    })));
    setForms((p.formaciones || []).map((f) => ({
      titulo: f.titulo || '', institucion: f.institucion || '', nivel: f.nivel || '',
      fecha_inicio: (f.fecha_inicio || '').slice(0, 10), fecha_fin: (f.fecha_fin || '').slice(0, 10)
    })));
    setKpi({ kpi: p.kpi, clasificacion: p.clasificacion });
  }, []);

  useEffect(() => {
    let activo = true;
    api('/api/yo')
      .then((p) => { if (activo) volcar(p); })
      .catch((ex) => { if (activo) setErr(ex.message); })
      .finally(() => { if (activo) setCargandoDatos(false); });
    return () => { activo = false; };
  }, [volcar]);

  // Defaults que salen del catalogo (se aplican al mostrar y al guardar: nunca se envia '').
  const dispPorDefecto = cats.disponibilidades[0] || '';
  const nivelPorDefecto = cats.niveles[0] || '';
  const jornadaPorDefecto = cats.tipos_trabajo[0] || '';
  const institucionPorDefecto = cats.instituciones[0] || '';
  const nivelFormacionPorDefecto = cats.niveles_formacion[0] || '';
  const puntosDisponibilidad = (catalogos && catalogos.puntos && catalogos.puntos.disponibilidad) ?? 0;

  async function guardar() {
    if (pendiente) return;
    setErr(''); setMsg('');
    setCargando(true);
    try {
      const cuerpo = {
        ...form,
        disponibilidad: form.disponibilidad || dispPorDefecto,
        habilidades: habs.map((h) => ({ ...h, nivel: h.nivel || nivelPorDefecto })),
        experiencias: exps.map((e) => ({ ...e, tipo_trabajo: e.tipo_trabajo || jornadaPorDefecto })),
        formaciones: forms.map((f) => ({
          ...f,
          institucion: f.institucion || institucionPorDefecto,
          nivel: f.nivel || nivelFormacionPorDefecto
        }))
      };
      const r = await api('/api/yo', { method: 'PUT', body: JSON.stringify(cuerpo) });
      volcar(r);
      setMsg(`Perfil guardado. Perfil ${r.kpi}% (${r.clasificacion})`);
      toast(`Perfil guardado. Perfil ${r.kpi}% (${r.clasificacion})`);
    } catch (ex) { setErr(ex.message); toast(ex.message, false); }
    finally { setCargando(false); }
  }

  const setF = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }));

  function agregarHab() {
    const nombre = hab.nombre.trim().toLowerCase();
    if (!nombre) return;
    setHabs((prev) => [...prev, { ...hab, nombre, nivel: hab.nivel || nivelPorDefecto, anios_uso: Number(hab.anios_uso) || 0 }]);
    setHab({ nombre: '', nivel: '', anios_uso: 1 });
    setErr('');
  }

  function agregarExp() {
    if (!exp.empresa.trim() || !exp.cargo.trim()) {
      setErr('Experiencia requiere empresa y cargo');
      return;
    }
    setExps((prev) => [...prev, { ...exp, tipo_trabajo: exp.tipo_trabajo || jornadaPorDefecto }]);
    setExp({ empresa: '', cargo: '', descripcion: '', tipo_trabajo: '', fecha_inicio: '', fecha_fin: '', es_actual: false });
    setErr('');
  }

  function agregarFormacion() {
    if (!formF.titulo.trim()) {
      setErr('Formación requiere título');
      return;
    }
    setForms((prev) => [...prev, {
      ...formF,
      institucion: formF.institucion || institucionPorDefecto,
      nivel: formF.nivel || nivelFormacionPorDefecto
    }]);
    setFormF({ titulo: '', institucion: '', nivel: '', fecha_inicio: '', fecha_fin: '' });
    setErr('');
  }

  const pasos = [
    { etiqueta: 'Datos de contacto', listo: Boolean(form.telefono || form.direccion) },
    { etiqueta: 'Disponibilidad', listo: Boolean(form.disponibilidad || dispPorDefecto) },
    { etiqueta: `Habilidades (${habs.length})`, listo: habs.length > 0 },
    { etiqueta: `Experiencias (${exps.length})`, listo: exps.length > 0 },
    { etiqueta: `Formaciones (${forms.length})`, listo: forms.length > 0 }
  ];
  const listos = pasos.filter((p) => p.listo).length;
  const tonoClasif = kpi && kpi.clasificacion === 'Alto' ? 'green' : kpi && kpi.clasificacion === 'Medio' ? 'amber' : 'red';

  if (cargandoDatos) {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="skeleton h-8 w-56" />
          <div className="skeleton h-4 w-96 max-w-full" />
        </div>
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-5">
            <div className="skeleton h-56" />
            <div className="skeleton h-56" />
            <div className="skeleton h-64" />
          </div>
          <div className="skeleton h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Mi perfil"
        subtitulo="Tu perfil es tu postulación: mantenelo al día y el sistema te enlistará solo en las convocatorias donde califiques."
        icono={IconoUsuario}
      >
        {kpi ? <Pill tono={tonoClasif}>Perfil {kpi.kpi}% · {kpi.clasificacion}</Pill> : null}
        {pendiente ? <Pill tono="amber" punto>Pendiente de aprobación</Pill> : null}
      </PageHeader>

      {pendiente ? (
        <Aviso tono="warn" titulo="Tu cuenta todavía está pendiente">
          Ya podés ver tu perfil, pero un administrador debe aprobar la cuenta para que puedas guardar cambios y entrar en las listas de candidatos.
        </Aviso>
      ) : null}
      {err ? <Aviso tono="error" titulo="No se pudo guardar">{err}</Aviso> : null}
      {msg ? <Aviso tono="ok">{msg}</Aviso> : null}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <Seccion titulo="Datos personales" icono={IconoUsuario}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Nombres *">
                <input className="input" autoComplete="given-name" value={form.nombres} onChange={setF('nombres')} />
              </Campo>
              <Campo etiqueta="Apellidos">
                <input className="input" autoComplete="family-name" value={form.apellidos} onChange={setF('apellidos')} />
              </Campo>
              <Campo etiqueta="Teléfono">
                <input className="input" autoComplete="tel" value={form.telefono} onChange={setF('telefono')} />
              </Campo>
              <Campo etiqueta="Dirección">
                <input className="input" autoComplete="street-address" value={form.direccion} onChange={setF('direccion')} />
              </Campo>
            </div>
          </Seccion>

          <Seccion titulo="Enlaces" icono={IconoEnlace}>
            <div className="grid gap-4 sm:grid-cols-3">
              <Campo etiqueta="LinkedIn">
                <input className="input" value={form.linkedin} onChange={setF('linkedin')} placeholder="linkedin.com/in/…" />
              </Campo>
              <Campo etiqueta="GitHub">
                <input className="input" value={form.github} onChange={setF('github')} placeholder="github.com/…" />
              </Campo>
              <Campo etiqueta="Portafolio">
                <input className="input" value={form.portafolio_url} onChange={setF('portafolio_url')} placeholder="mi-portafolio.com" />
              </Campo>
            </div>
            <p className="help mt-2">Opcionales. Pueden aceptar el dominio sin https://.</p>
          </Seccion>

          <Seccion titulo="Disponibilidad" icono={IconoReloj}>
            <Campo
              etiqueta="¿Cuándo podés empezar?"
              ayuda={`Se compara con la disponibilidad de cada convocatoria: si coincide, sumás ${puntosDisponibilidad} puntos de KPI.`}
            >
              <select className="input" value={form.disponibilidad || dispPorDefecto} onChange={setF('disponibilidad')}>
                {cats.disponibilidades.length === 0 ? <option value="">Cargando…</option> : null}
                {cats.disponibilidades.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Campo>
          </Seccion>

          <Seccion
            titulo="Habilidades"
            icono={IconoDocumento}
            extra={<Pill tono={habs.length ? 'cyan' : 'slate'}>{habs.length}</Pill>}
          >
            <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_7rem_auto]">
              <Campo etiqueta="Tecnología">
                <input
                  className="input"
                  list="mpcat"
                  value={hab.nombre}
                  onChange={(e) => setHab({ ...hab, nombre: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarHab(); } }}
                  placeholder="Ej. react, sql…"
                />
                <datalist id="mpcat">{cats.tecnologias.map((t) => <option key={t} value={t} />)}</datalist>
              </Campo>
              <Campo etiqueta="Nivel">
                <select className="input" value={hab.nivel || nivelPorDefecto} onChange={(e) => setHab({ ...hab, nivel: e.target.value })}>
                  {cats.niveles.map((n) => <option key={n}>{n}</option>)}
                </select>
              </Campo>
              <Campo etiqueta="Años">
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="60"
                  value={hab.anios_uso}
                  onChange={(e) => setHab({ ...hab, anios_uso: Number(e.target.value) })}
                />
              </Campo>
              <Boton variante="secondary" icono={IconoMas} onClick={agregarHab} disabled={!hab.nombre.trim()} className="sm:mb-0.5">
                Agregar
              </Boton>
            </div>

            {habs.length === 0 ? (
              <p className="help mt-3">Todavía no cargaste habilidades.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {habs.map((h, i) => (
                  <span key={`${h.nombre}-${i}`} className="chip chip-soft">
                    <span className="font-semibold">{h.nombre}</span>
                    <span className="text-[11px] opacity-80">{h.nivel || nivelPorDefecto} · {Number(h.anios_uso) || 0}a</span>
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
                      onClick={() => setHabs((prev) => prev.filter((_, j) => j !== i))}
                      aria-label={`Quitar ${h.nombre}`}
                    >
                      <IconoX className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Seccion>

          <Seccion
            titulo="Experiencias"
            icono={IconoMaletin}
            extra={<Pill tono={exps.length ? 'violet' : 'slate'}>{exps.length}</Pill>}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Empresa *">
                <input className="input" value={exp.empresa} onChange={(e) => setExp({ ...exp, empresa: e.target.value })} />
              </Campo>
              <Campo etiqueta="Cargo *">
                <input className="input" value={exp.cargo} onChange={(e) => setExp({ ...exp, cargo: e.target.value })} />
              </Campo>
              <Campo etiqueta="Descripción" className="sm:col-span-2">
                <textarea
                  className="input min-h-20"
                  value={exp.descripcion}
                  onChange={(e) => setExp({ ...exp, descripcion: e.target.value })}
                  placeholder="Tareas, logros y tecnologías usadas…"
                />
              </Campo>
              <Campo etiqueta="Jornada">
                <select
                  className="input"
                  value={exp.tipo_trabajo || jornadaPorDefecto}
                  onChange={(e) => setExp({ ...exp, tipo_trabajo: e.target.value })}
                >
                  {cats.tipos_trabajo.map((t) => <option key={t} value={t}>{t === 'tiempo_completo' ? 'Tiempo completo' : 'Medio tiempo'}</option>)}
                </select>
              </Campo>
              <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={exp.es_actual}
                  onChange={(e) => setExp({ ...exp, es_actual: e.target.checked, fecha_fin: e.target.checked ? '' : exp.fecha_fin })}
                />
                Trabajo actual
              </label>
              <Campo etiqueta="Fecha inicio">
                <input className="input" type="date" value={exp.fecha_inicio} onChange={(e) => setExp({ ...exp, fecha_inicio: e.target.value })} />
              </Campo>
              <Campo etiqueta="Fecha fin">
                <input
                  className="input"
                  type="date"
                  value={exp.fecha_fin}
                  disabled={exp.es_actual}
                  onChange={(e) => setExp({ ...exp, fecha_fin: e.target.value })}
                />
              </Campo>
            </div>
            <Boton variante="secondary" tamano="sm" icono={IconoMas} onClick={agregarExp} className="mt-3">
              Agregar experiencia
            </Boton>

            {exps.length === 0 ? (
              <p className="help mt-3">Todavía no cargaste experiencias.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {exps.map((e, i) => (
                  <li key={`${e.empresa}-${i}`} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{e.cargo} · {e.empresa}</p>
                      <p className="help">
                        {e.fecha_inicio || '—'} — {e.es_actual ? 'Actual' : (e.fecha_fin || '—')}
                        {e.tipo_trabajo ? ` · ${e.tipo_trabajo === 'tiempo_completo' ? 'Tiempo completo' : 'Medio tiempo'}` : ''}
                      </p>
                      {e.descripcion ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{e.descripcion}</p> : null}
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost shrink-0 p-2 text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40"
                      onClick={() => setExps((prev) => prev.filter((_, j) => j !== i))}
                      aria-label={`Quitar experiencia en ${e.empresa}`}
                    >
                      <IconoBasura className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Seccion>

          <Seccion
            titulo="Formaciones"
            icono={IconoDocumento}
            extra={<Pill tono={forms.length ? 'emerald' : 'slate'}>{forms.length}</Pill>}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Título *">
                <input className="input" value={formF.titulo} onChange={(e) => setFormF({ ...formF, titulo: e.target.value })} />
              </Campo>
              <Campo etiqueta="Institución">
                <select className="input" value={formF.institucion || institucionPorDefecto} onChange={(e) => setFormF({ ...formF, institucion: e.target.value })}>
                  {cats.instituciones.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Campo>
              <Campo etiqueta="Nivel">
                <select className="input" value={formF.nivel || nivelFormacionPorDefecto} onChange={(e) => setFormF({ ...formF, nivel: e.target.value })}>
                  {cats.niveles_formacion.map((n) => <option key={n}>{n}</option>)}
                </select>
              </Campo>
              <div className="grid grid-cols-2 gap-3">
                <Campo etiqueta="Fecha inicio">
                  <input className="input" type="date" value={formF.fecha_inicio} onChange={(e) => setFormF({ ...formF, fecha_inicio: e.target.value })} />
                </Campo>
                <Campo etiqueta="Fecha fin">
                  <input className="input" type="date" value={formF.fecha_fin} onChange={(e) => setFormF({ ...formF, fecha_fin: e.target.value })} />
                </Campo>
              </div>
            </div>
            <Boton variante="secondary" tamano="sm" icono={IconoMas} onClick={agregarFormacion} className="mt-3">
              Agregar formación
            </Boton>

            {forms.length === 0 ? (
              <p className="help mt-3">Todavía no cargaste formaciones.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {forms.map((f, i) => (
                  <li key={`${f.titulo}-${i}`} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{f.titulo}</p>
                      <p className="help">
                        {f.institucion}
                        {f.nivel ? ` · ${f.nivel}` : ''}
                        {f.fecha_inicio || f.fecha_fin ? ` · ${f.fecha_inicio || '—'} — ${f.fecha_fin || '—'}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost shrink-0 p-2 text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40"
                      onClick={() => setForms((prev) => prev.filter((_, j) => j !== i))}
                      aria-label={`Quitar formación ${f.titulo}`}
                    >
                      <IconoBasura className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Seccion>
        </div>

        <aside className="card p-5 xl:sticky xl:top-6">
          <div className="flex flex-col items-center text-center">
            <AnilloKPI valor={(kpi && kpi.kpi) || 0} etiqueta="Perfil" clasificacion={kpi && kpi.clasificacion} />
            {kpi ? <Pill tono={tonoClasif} className="mt-3">{kpi.clasificacion}</Pill> : null}
            <p className="help mt-2">El perfil general solo desempata el ranking. Lo que define tu lugar es el KPI de cada convocatoria.</p>
          </div>

          <div className="divider my-4" />

          <div className="flex items-center justify-between gap-2">
            <p className="section-title">Tu perfil al día</p>
            <Pill tono={listos === pasos.length ? 'green' : 'slate'}>{listos}/{pasos.length}</Pill>
          </div>
          <Progress valor={listos} max={pasos.length} tono={listos === pasos.length ? 'emerald' : 'cyan'} className="mt-2" />
          <ul className="mt-3 space-y-2">
            {pasos.map((p) => (
              <li key={p.etiqueta} className="flex items-center gap-2 text-sm">
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${p.listo ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}>
                  {p.listo ? <IconoCheck className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                </span>
                <span className={p.listo ? '' : 'text-slate-500 dark:text-slate-400'}>{p.etiqueta}</span>
              </li>
            ))}
          </ul>

          <Boton
            variante="primary"
            tamano="lg"
            className="mt-5 w-full"
            cargando={cargando}
            disabled={pendiente}
            onClick={guardar}
          >
            Guardar mi perfil
          </Boton>
          <p className="help mt-2 text-center">
            {pendiente
              ? 'Un administrador debe aprobar tu cuenta para guardar.'
              : 'Al guardar se recalcula tu KPI y tu lugar en las convocatorias.'}
          </p>
        </aside>
      </div>
    </div>
  );
}
