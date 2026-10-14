import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, sesion } from '../lib/api';
import { FormularioPostulacion } from '../components/FormularioPostulacion';
import { useToast } from '../components/Toast';

const ORDEN_CAT = ['lenguaje', 'framework', 'base_datos', 'herramienta', 'otro'];
const ETIQ_CAT = { lenguaje: 'Lenguajes', framework: 'Frameworks', base_datos: 'Base de datos', herramienta: 'Herramientas', otro: 'Otras' };
const NIVELES_REQ = ['principiante', 'basico', 'intermedio', 'avanzado', 'experto'];

export function Convocatorias() {
  const nav = useNavigate();
  const [lista, setLista] = useState([]);
  const [cats, setCats] = useState({ tecnologias: [], disponibilidades: [], detalle_tecnologias: [], categorias: [] });
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [form, setForm] = useState({ titulo: '', descripcion: '', anios_min: 1, disponibilidad: 'Inmediata', reqs: {} });
  const [otra, setOtra] = useState({ nombre: '', categoria: 'lenguaje', nivel_minimo: 'basico' });
  const [abierto, setAbierto] = useState(null);
  const [yo, setYo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const toast = useToast();
  const rol = sesion().rol;
  const esPostulante = rol === 'postulante';
  const puedeCrear = rol === 'admin' || rol === 'reclutador';

  function cargar() {
    api('/api/convocatorias').then(setLista).catch((ex) => setErr(ex.message));
  }
  function cargarCats() {
    api('/api/catalogos').then(setCats).catch(() => {});
  }
  useEffect(() => {
    cargar();
    cargarCats();
    if (esPostulante) api('/api/yo').then(setYo).catch(() => {});
  }, []);

  function toggleReq(nombre) {
    const reqs = { ...form.reqs };
    if (reqs[nombre] === undefined) reqs[nombre] = { obligatorio: true, categoria: catDe(nombre), nivel_minimo: 'basico' };
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

  function agregarOtra() {
    const nombre = otra.nombre.trim().toLowerCase();
    if (!nombre) return;
    setForm({ ...form, reqs: { ...form.reqs, [nombre]: { obligatorio: true, categoria: otra.categoria, nivel_minimo: otra.nivel_minimo || 'basico' } } });
    setOtra({ nombre: '', categoria: 'lenguaje', nivel_minimo: 'basico' });
  }

  async function crear(e) {
    e.preventDefault();
    setErr(''); setOk('');
    setCargando(true);
    try {
      const requisitos = Object.entries(form.reqs).map(([nombre, r]) => ({ nombre, obligatorio: r.obligatorio, categoria: r.categoria, nivel_minimo: r.nivel_minimo || 'basico' }));
      await api('/api/convocatorias', {
        method: 'POST',
        body: JSON.stringify({
          titulo: form.titulo, descripcion: form.descripcion,
          anios_min: Number(form.anios_min), disponibilidad: form.disponibilidad, requisitos
        })
      });
      const nuevas = Object.keys(form.reqs).filter((k) => !(cats.detalle_tecnologias || []).some((x) => x.nombre === k));
      const msg = nuevas.length ? `Convocatoria creada. Nuevas en catálogo: ${nuevas.join(', ')}` : 'Convocatoria creada. Queda pendiente de aprobación.';
      setOk(msg);
      toast(msg);
      setForm({ titulo: '', descripcion: '', anios_min: 1, disponibilidad: 'Inmediata', reqs: {} });
      cargar();
      cargarCats();
    } catch (ex) { setErr(ex.message); toast(ex.message, false); }
    finally { setCargando(false); }
  }

  const grupos = {};
  for (const t of cats.detalle_tecnologias || []) {
    const c = t.categoria || 'otro';
    (grupos[c] = grupos[c] || []).push(t.nombre);
  }

  return (
    <div className="space-y-4">
      <h2 className="page-title">Convocatorias</h2>
      {err && <p className="err-msg">{err}</p>}
      {ok && <p className="ok-msg">{ok}</p>}
      {puedeCrear && (
        <form onSubmit={crear} className="card p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <input className="input flex-1" placeholder="Título*" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            <input className="input flex-1" placeholder="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            <label className="text-xs">Años mín.<input className="input w-20 block" type="number" min="0" value={form.anios_min} onChange={(e) => setForm({ ...form, anios_min: e.target.value })} /></label>
            <label className="text-xs">Disponibilidad<select className="input block" value={form.disponibilidad} onChange={(e) => setForm({ ...form, disponibilidad: e.target.value })}>{cats.disponibilidades.map((d) => <option key={d}>{d}</option>)}</select></label>
          </div>
          <div>
            <p className="text-sm font-semibold">Requisitos del catálogo (click: ★ obligatoria → ○ deseable → quitar)</p>
            {ORDEN_CAT.filter((c) => grupos[c]?.length).map((c) => (
              <div key={c} className="mt-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{ETIQ_CAT[c]}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {grupos[c].map((t) => (
                    <button type="button" key={t} onClick={() => toggleReq(t)}
                      className={`text-xs px-2 py-1 rounded ${form.reqs[t] === undefined ? 'bg-slate-100 dark:bg-slate-800' : form.reqs[t].obligatorio ? 'bg-cyan-700 dark:bg-cyan-600 text-white' : 'bg-sky-200 dark:bg-cyan-800'}`}>
                      {t}{form.reqs[t] === undefined ? '' : form.reqs[t].obligatorio ? ' ★' : ' ○'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">★ obligatoria · ○ deseable · {Object.keys(form.reqs).length} elegidas (cada una con su nivel mínimo)</p>
            {Object.keys(form.reqs).length > 0 && (
              <div className="mt-1 space-y-1">
                <p className="text-xs font-semibold">Elegidos — nivel mínimo exigido:</p>
                {Object.entries(form.reqs).map(([k, r]) => (
                  <div key={k} className="flex gap-2 items-center text-xs">
                    <span className="flex-1"><b>{k}</b> {r.obligatorio ? '★' : '○'}</span>
                    <select className="input" value={r.nivel_minimo || 'basico'} onChange={(e) => setNivelReq(k, e.target.value)}>
                      {NIVELES_REQ.map((n) => <option key={n} value={n}>≥ {n}</option>)}
                    </select>
                    <button type="button" className="text-red-600 dark:text-red-400" onClick={() => { const x = { ...form.reqs }; delete x[k]; setForm({ ...form, reqs: x }); }}>x</button>
                  </div>
                ))}
              </div>
            )}
            {Object.keys(form.reqs).filter((k) => !(cats.detalle_tecnologias || []).some((x) => x.nombre === k)).length > 0 && (
              <div className="mt-1">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Nuevas (se crearán al guardar):</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Object.keys(form.reqs).filter((k) => !(cats.detalle_tecnologias || []).some((x) => x.nombre === k)).map((k) => (
                    <span key={k} className="bg-amber-100 dark:bg-amber-900 dark:bg-amber-900 dark:text-amber-100 text-amber-900 text-xs px-2 py-1 rounded">{k} · {ETIQ_CAT[form.reqs[k].categoria] || form.reqs[k].categoria}{form.reqs[k].obligatorio ? ' ★' : ' ○'}
                      <button type="button" className="ml-1 text-red-600 dark:text-red-400" onClick={() => { const r = { ...form.reqs }; delete r[k]; setForm({ ...form, reqs: r }); }}>x</button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 items-end">
            <input className="input flex-1" placeholder="Otra tecnología ej. c++" value={otra.nombre} onChange={(e) => setOtra({ ...otra, nombre: e.target.value })} />
            <select className="input w-full" value={otra.categoria} onChange={(e) => setOtra({ ...otra, categoria: e.target.value })}>
              {(cats.categorias?.length ? cats.categorias : ORDEN_CAT).map((c) => <option key={c} value={c}>{ETIQ_CAT[c] || c}</option>)}
            </select>
            <select className="input w-full" value={otra.nivel_minimo} onChange={(e) => setOtra({ ...otra, nivel_minimo: e.target.value })}>
              {NIVELES_REQ.map((n) => <option key={n} value={n}>≥ {n}</option>)}
            </select>
            <button type="button" className="btn-secondary px-3 py-2" onClick={agregarOtra}>Agregar</button>
          </div>
          <button className="btn-primary px-4 py-2" disabled={cargando}>{cargando ? 'Creando…' : 'Nueva convocatoria'}</button>
        </form>
      )}
      <div className="grid gap-3">
        {lista.map((v) => (
          <div key={v.id} className="card p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="font-bold">{v.titulo} <span className={`text-xs font-normal px-1 rounded ${v.estado === 'abierta' ? 'bg-green-100 dark:bg-green-900' : v.estado === 'pendiente' ? 'bg-amber-100 dark:bg-amber-900' : 'btn-secondary'}`}>({v.estado})</span> <span className="text-xs font-normal text-slate-500 dark:text-slate-400">· {v.total_postulados} postulados</span></p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{v.descripcion}</p>
                {v.requisitos && <p className="text-xs text-slate-500 dark:text-slate-400">Requiere: {v.requisitos}</p>}
                {v.estado === 'pendiente' && <p className="text-xs text-amber-700 dark:text-amber-400">En espera de aprobación del admin</p>}
              </div>
              {!esPostulante && <button className="text-cyan-700 dark:text-cyan-400 underline text-sm" onClick={() => nav(`/convocatorias/${v.id}`)}>Ranking</button>}
              {esPostulante && v.estado === 'abierta' && (
                <button className="btn-primary px-3 py-1 text-sm" onClick={() => setAbierto(abierto === v.id ? null : v.id)}>
                  {abierto === v.id ? 'Cerrar' : 'Postularme'}
                </button>
              )}
            </div>
            {esPostulante && abierto === v.id && (
              <div className="border-t mt-3 pt-3">
                <FormularioPostulacion
                  convocatoriaId={v.id}
                  prefill={yo}
                  onOk={(r) => { const m = `Postulación enviada (match ${r.match_pct}%, KPI ${r.kpi_al_postular})`; setOk(m); toast(m); setAbierto(null); }}
                  onErr={(m) => { setErr(m); toast(m, false); }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
