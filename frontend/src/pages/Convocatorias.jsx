import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useToast } from '../lib/toast';
import { useCatalogos, invalidarCatalogos } from '../lib/catalogos';
import {
  Aviso,
  Boton,
  Campo,
  EmptyState,
  PageHeader,
  Pill,
  Progress
} from '../components/ui';
import { IconoBuscar, IconoMaletin, IconoMas, IconoX } from '../components/Iconos';

const ORDEN_CAT = ['lenguaje', 'framework', 'base_datos', 'herramienta', 'otro'];
const ETIQ_CAT = {
  lenguaje: 'Lenguajes',
  framework: 'Frameworks',
  base_datos: 'Base de datos',
  herramienta: 'Herramientas',
  otro: 'Otras'
};

function EstadoPill({ estado }) {
  const tono = estado === 'abierta' ? 'green' : estado === 'pendiente' ? 'amber' : estado === 'cerrada' ? 'slate' : 'red';
  return <Pill tono={tono} punto>{estado}</Pill>;
}

// Gestion de convocatorias (staff). El postulante NO se postula: el sistema arma solo
// la lista de candidatos segun el umbral (kpi_minimo) de cada convocatoria.
export function Convocatorias() {
  const nav = useNavigate();
  const catalogos = useCatalogos();
  // Defaults de arrays: en el primer render el catalogo todavia no llego (null) y la
  // pagina no debe romperse por un `.map` sobre undefined.
  const cats = useMemo(() => ({
    tecnologias: [],
    disponibilidades: [],
    detalle_tecnologias: [],
    categorias: [],
    niveles_tecnologia: [],
    niveles_formacion: [],
    instituciones: [],
    tipos_trabajo: [],
    ...(catalogos || {})
  }), [catalogos]);
  const niveles = useMemo(
    () => ((cats.niveles_tecnologia || []).map((n) => n.nombre)),
    [cats]
  );
  const kpiDefecto = cats.kpi_minimo_por_defecto;
  const kpiRango = cats.kpi_minimo_rango || {};
  const nivelPorDefecto = niveles.includes('basico') ? 'basico' : (niveles[0] || '');
  const dispPorDefecto = (cats.disponibilidades || [])[0] || '';
  const [lista, setLista] = useState([]);
  const [filtro, setFiltro] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [cargandoLista, setCargandoLista] = useState(true);
  const [form, setForm] = useState({ titulo: '', descripcion: '', anios_min: 1, disponibilidad: '', kpi_minimo: '', cupos: '', reqs: {} });
  const [otra, setOtra] = useState({ nombre: '', categoria: 'lenguaje', nivel_minimo: '' });
  const [cargando, setCargando] = useState(false);
  const toast = useToast();

  // `''` significa "todavia no elegi": se muestra y se envia el default del catalogo.
  const dispElegida = form.disponibilidad || dispPorDefecto;
  const kpiElegido = form.kpi_minimo === '' || form.kpi_minimo === undefined ? (kpiDefecto ?? '') : form.kpi_minimo;
  const cuposDefecto = cats.cupos_por_defecto ?? 1;
  const cuposRango = cats.cupos_rango || {};
  const cuposElegidos = form.cupos === '' || form.cupos === undefined ? cuposDefecto : form.cupos;
  const nivelOtra = otra.nivel_minimo || nivelPorDefecto;

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return lista.filter((v) => {
      const coincideEstado = filtro === 'todas' || v.estado === filtro;
      const coincideTexto = !texto || String(v.titulo || '').toLowerCase().includes(texto);
      return coincideEstado && coincideTexto;
    });
  }, [lista, filtro, busqueda]);

  function cargar() {
    setErr('');
    api('/api/convocatorias')
      .then(setLista)
      .catch((ex) => setErr(ex.message))
      .finally(() => setCargandoLista(false));
  }
  useEffect(() => { cargar(); }, []);

  function toggleReq(nombre) {
    const reqs = { ...form.reqs };
    if (reqs[nombre] === undefined) reqs[nombre] = { obligatorio: true, categoria: catDe(nombre), nivel_minimo: nivelPorDefecto };
    else if (reqs[nombre].obligatorio) reqs[nombre] = { ...reqs[nombre], obligatorio: false };
    else delete reqs[nombre];
    setForm({ ...form, reqs });
  }

  function setNivelReq(nombre, nivel_minimo) {
    setForm({ ...form, reqs: { ...form.reqs, [nombre]: { ...form.reqs[nombre], nivel_minimo } } });
  }

  function catDe(nombre) {
    const t = (cats.detalle_tecnologias || []).find((x) => x.nombre === nombre);
    return t ? t.categoria : 'otro';
  }

  function quitarReq(nombre) {
    const reqs = { ...form.reqs };
    delete reqs[nombre];
    setForm({ ...form, reqs });
  }

  function agregarOtra() {
    const nombre = otra.nombre.trim().toLowerCase();
    if (!nombre) return;
    setForm({ ...form, reqs: { ...form.reqs, [nombre]: { obligatorio: true, categoria: otra.categoria, nivel_minimo: otra.nivel_minimo || nivelPorDefecto } } });
    setOtra({ nombre: '', categoria: 'lenguaje', nivel_minimo: nivelPorDefecto });
  }

  async function crear(e) {
    e.preventDefault();
    setErr(''); setOk('');
    setCargando(true);
    try {
      const requisitos = Object.entries(form.reqs).map(([nombre, r]) => ({
        nombre,
        obligatorio: r.obligatorio,
        categoria: r.categoria,
        nivel_minimo: r.nivel_minimo || nivelPorDefecto
      }));
      await api('/api/convocatorias', {
        method: 'POST',
        body: JSON.stringify({
          titulo: form.titulo,
          descripcion: form.descripcion,
          anios_min: Number(form.anios_min),
          disponibilidad: dispElegida || null,
          kpi_minimo: Number(kpiElegido),
          cupos: Number(cuposElegidos),
          requisitos
        })
      });
      const nuevas = Object.keys(form.reqs).filter((k) => !(cats.detalle_tecnologias || []).some((x) => x.nombre === k));
      const msg = nuevas.length
        ? `Convocatoria creada. Nuevas en catálogo: ${nuevas.join(', ')}`
        : 'Convocatoria creada. Queda pendiente de aprobación.';
      setOk(msg);
      toast(msg);
      invalidarCatalogos(); // puede haber tecnologias nuevas
      setForm({ titulo: '', descripcion: '', anios_min: 1, disponibilidad: '', kpi_minimo: '', cupos: '', reqs: {} });
      setMostrarForm(false);
      cargar();
    } catch (ex) { setErr(ex.message); toast(ex.message, false); }
    finally { setCargando(false); }
  }

  const grupos = {};
  for (const t of cats.detalle_tecnologias || []) {
    const c = t.categoria || 'otro';
    (grupos[c] = grupos[c] || []).push(t.nombre);
  }

  const conteos = {
    todas: lista.length,
    abierta: lista.filter((v) => v.estado === 'abierta').length,
    pendiente: lista.filter((v) => v.estado === 'pendiente').length,
    cerrada: lista.filter((v) => v.estado === 'cerrada').length
  };

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Convocatorias"
        subtitulo="El postulante no se postula: al publicar, el sistema enlistan solo a quienes pasan el umbral (KPI mínimo) y los ordena por KPI de convocatoria."
        icono={IconoMaletin}
      >
        <Boton
          variante={mostrarForm ? 'secondary' : 'primary'}
          icono={mostrarForm ? IconoX : IconoMas}
          onClick={() => setMostrarForm(!mostrarForm)}
        >
          {mostrarForm ? 'Cerrar formulario' : 'Nueva convocatoria'}
        </Boton>
      </PageHeader>

      {err ? <Aviso tono="error" titulo="No se pudo completar la operación">{err}</Aviso> : null}
      {ok ? <Aviso tono="ok">{ok}</Aviso> : null}

      {mostrarForm ? (
        <form onSubmit={crear} className="card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/40">
            <div>
              <h2 className="section-title">Nueva convocatoria</h2>
              <p className="help mt-0.5">Completa los datos, elige los requisitos y publica.</p>
            </div>
            <Boton variante="ghost" tamano="sm" icono={IconoX} onClick={() => setMostrarForm(false)}>Cancelar</Boton>
          </div>

          <div className="space-y-6 p-5">
            <div>
              <p className="mb-3 flex items-center gap-2 text-sm font-bold">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-100 text-xs text-brand-800 dark:bg-brand-900 dark:text-brand-200">1</span>
                Datos generales
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Campo etiqueta="Título *" className="sm:col-span-2">
                  <input
                    className="input"
                    placeholder="Ej. Desarrollador Full Stack"
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    required
                  />
                </Campo>
                <Campo etiqueta="Años mínimos">
                  <input
                    className="input"
                    type="number"
                    min="0"
                    max="60"
                    value={form.anios_min}
                    onChange={(e) => setForm({ ...form, anios_min: e.target.value })}
                  />
                </Campo>
                <Campo etiqueta="Descripción" className="sm:col-span-2 lg:col-span-3">
                  <textarea
                    className="input min-h-[4.5rem] resize-y"
                    placeholder="Responsabilidades, modalidad, equipo…"
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  />
                </Campo>
                <Campo etiqueta="Disponibilidad">
                  <select className="input" value={dispElegida} onChange={(e) => setForm({ ...form, disponibilidad: e.target.value })}>
                    {(cats.disponibilidades || []).map((d) => <option key={d}>{d}</option>)}
                  </select>
                </Campo>
                <Campo
                  etiqueta={`KPI mínimo (${kpiRango.min ?? 0}-${kpiRango.max ?? 100})`}
                  ayuda="Quien no lo alcanza aparece en excluidos, con el motivo."
                >
                  <input
                    className="input"
                    type="number"
                    min={kpiRango.min ?? 0}
                    max={kpiRango.max ?? 100}
                    value={kpiElegido}
                    onChange={(e) => setForm({ ...form, kpi_minimo: e.target.value })}
                  />
                </Campo>
                <Campo
                  etiqueta={`Cupos (${cuposRango.min ?? 1}-${cuposRango.max ?? 999})`}
                  ayuda="Al contratar a esa cantidad, la convocatoria se cierra sola."
                >
                  <input
                    className="input"
                    type="number"
                    min={cuposRango.min ?? 1}
                    max={cuposRango.max ?? 999}
                    value={cuposElegidos}
                    onChange={(e) => setForm({ ...form, cupos: e.target.value })}
                  />
                </Campo>
              </div>
            </div>

            <div className="divider pt-5">
              <p className="mb-1 flex items-center gap-2 text-sm font-bold">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-100 text-xs text-brand-800 dark:bg-brand-900 dark:text-brand-200">2</span>
                Requisitos
              </p>
              <p className="help mb-3">Click para alternar: <b>★ obligatoria</b> → ○ deseable → quitar.</p>

              <div className="space-y-3">
                {ORDEN_CAT.filter((c) => grupos[c]?.length).map((c) => (
                  <div key={c}>
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">{ETIQ_CAT[c]}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {grupos[c].map((t) => {
                        const elegido = form.reqs[t];
                        const clase = !elegido ? 'chip' : elegido.obligatorio ? 'chip chip-on' : 'chip chip-soft';
                        return (
                          <button type="button" key={t} onClick={() => toggleReq(t)} className={clase}>
                            {t}{elegido ? (elegido.obligatorio ? ' ★' : ' ○') : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <p className="help mt-3">
                ★ obligatoria · ○ deseable · {Object.keys(form.reqs).length} elegidas (cada una con su nivel mínimo)
              </p>

              {Object.keys(form.reqs).length > 0 ? (
                <div className="mt-3 space-y-1.5 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                  <p className="text-xs font-semibold">Nivel mínimo exigido</p>
                  {Object.entries(form.reqs).map(([k, r]) => (
                    <div key={k} className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="min-w-0 flex-1 truncate">
                        <b>{k}</b> <span className="text-brand-600 dark:text-brand-300">{r.obligatorio ? '★' : '○'}</span>
                      </span>
                      <select
                        className="input w-auto py-1.5 text-xs"
                        value={r.nivel_minimo || 'basico'}
                        onChange={(e) => setNivelReq(k, e.target.value)}
                      >
                        {niveles.map((n) => <option key={n} value={n}>≥ {n}</option>)}
                      </select>
                      <Boton variante="ghost" tamano="xs" onClick={() => quitarReq(k)} aria-label={`Quitar ${k}`}>
                        <IconoX className="h-3.5 w-3.5" />
                      </Boton>
                    </div>
                  ))}
                </div>
              ) : null}

              {Object.keys(form.reqs).filter((k) => !(cats.detalle_tecnologias || []).some((x) => x.nombre === k)).length > 0 ? (
                <div className="mt-3">
                  <p className="mb-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">Nuevas tecnologías (se crearán al guardar):</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(form.reqs).filter((k) => !(cats.detalle_tecnologias || []).some((x) => x.nombre === k)).map((k) => (
                      <span key={k} className="chip chip-warn cursor-default">
                        {k} · {ETIQ_CAT[form.reqs[k].categoria] || form.reqs[k].categoria}{form.reqs[k].obligatorio ? ' ★' : ' ○'}
                        <button type="button" className="ml-1 text-rose-600 dark:text-rose-300" onClick={() => quitarReq(k)} aria-label={`Quitar ${k}`}>
                          <IconoX className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="divider pt-5">
              <p className="mb-1 flex items-center gap-2 text-sm font-bold">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-100 text-xs text-brand-800 dark:bg-brand-900 dark:text-brand-200">3</span>
                Otra tecnología
              </p>
              <p className="help mb-3">Si no está en el catálogo, la agregamos automáticamente.</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_12rem_12rem_auto]">
                <input
                  className="input"
                  placeholder="Ej. c++"
                  value={otra.nombre}
                  onChange={(e) => setOtra({ ...otra, nombre: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarOtra(); } }}
                />
                <select className="input" value={otra.categoria} onChange={(e) => setOtra({ ...otra, categoria: e.target.value })}>
                  {(cats.categorias?.length ? cats.categorias : ORDEN_CAT).map((c) => (
                    <option key={c} value={c}>{ETIQ_CAT[c] || c}</option>
                  ))}
                </select>
                <select className="input" value={nivelOtra} onChange={(e) => setOtra({ ...otra, nivel_minimo: e.target.value })}>
                  {niveles.map((n) => <option key={n} value={n}>≥ {n}</option>)}
                </select>
                <Boton variante="secondary" icono={IconoMas} onClick={agregarOtra}>Agregar</Boton>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/40">
            <Boton variante="ghost" onClick={() => setMostrarForm(false)}>Cancelar</Boton>
            <Boton type="submit" variante="primary" cargando={cargando} icono={IconoMas}>
              {cargando ? 'Creando…' : 'Crear convocatoria'}
            </Boton>
          </div>
        </form>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <div className="tabs">
          {[
            { valor: 'todas', etiqueta: 'Todas' },
            { valor: 'abierta', etiqueta: 'Abiertas' },
            { valor: 'pendiente', etiqueta: 'Pendientes' },
            { valor: 'cerrada', etiqueta: 'Cerradas' }
          ].map((f) => (
            <button
              key={f.valor}
              type="button"
              role="tab"
              aria-selected={filtro === f.valor}
              onClick={() => setFiltro(f.valor)}
              className={`tab ${filtro === f.valor ? 'tab-active' : ''}`}
            >
              {f.etiqueta}
              <span className="tab-count">{conteos[f.valor]}</span>
            </button>
          ))}
        </div>
        <div className="relative min-w-[13rem] flex-1 sm:max-w-xs">
          <IconoBuscar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Buscar por título…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar convocatoria por título"
          />
          {busqueda ? (
            <button
              type="button"
              className="btn btn-ghost absolute right-1 top-1/2 -translate-y-1/2 p-1.5"
              onClick={() => setBusqueda('')}
              aria-label="Limpiar búsqueda"
            >
              <IconoX className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {cargandoLista ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-52" />)}
        </div>
      ) : visibles.length === 0 ? (
        <EmptyState
          icono={IconoMaletin}
          titulo="No hay convocatorias en este filtro"
          texto={busqueda ? 'Probá con otro título o limpiá la búsqueda.' : 'Cambiá el filtro o crea la primera convocatoria.'}
        >
          {busqueda ? <Boton variante="secondary" onClick={() => setBusqueda('')}>Limpiar búsqueda</Boton> : null}
          <Boton variante="primary" icono={IconoMas} onClick={() => setMostrarForm(true)}>Nueva convocatoria</Boton>
        </EmptyState>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visibles.map((v) => (
            <article key={v.id} className="card card-hover flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold">{v.titulo}</h3>
                    <EstadoPill estado={v.estado} />
                    {v.completa ? <Pill tono="cyan">cupos completos</Pill> : null}
                  </div>
                  {v.descripcion ? <p className="help mt-1 line-clamp-2">{v.descripcion}</p> : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <Pill tono="slate">{v.total_candidatos} candidatos</Pill>
                <Pill tono="violet">{v.total_postulados} en selección</Pill>
                <Pill tono="cyan">umbral {v.kpi_minimo}</Pill>
                <Pill tono="slate">{v.anios_min} años mín.</Pill>
                <Pill tono="slate">{v.disponibilidad || 'sin disponibilidad'}</Pill>
              </div>

              {v.requisitos ? <p className="help line-clamp-2"><b>Requiere:</b> {v.requisitos}</p> : null}

              <Progress
                valor={v.contratados}
                max={v.cupos}
                tono={v.completa ? 'emerald' : 'cyan'}
                etiqueta={`${v.contratados}/${v.cupos} cupos cubiertos`}
              />

              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
                {v.estado === 'pendiente' ? (
                  <span className="help">En espera de aprobación del admin</span>
                ) : (
                  <span className="help">KPI mínimo de enlistado: {v.kpi_minimo}</span>
                )}
                <Boton variante="secondary" tamano="sm" onClick={() => nav(`/convocatorias/${v.id}`)}>
                  Ver candidatos
                </Boton>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
