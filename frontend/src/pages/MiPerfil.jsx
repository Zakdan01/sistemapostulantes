import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';

const NIVELES = ['principiante', 'basico', 'intermedio', 'avanzado', 'experto'];

// Mi perfil: el postulante completa su CV (contacto + habilidades + experiencias + formaciones).
export function MiPerfil() {
  const [cats, setCats] = useState({ tecnologias: [], tipos_trabajo: ['tiempo_completo', 'medio_tiempo'], niveles: NIVELES, instituciones: ['umsa', 'otra'], niveles_formacion: ['licenciatura', 'otro'] });
  const [form, setForm] = useState({ nombres: '', apellidos: '', telefono: '', direccion: '', linkedin: '', github: '', portafolio_url: '' });
  const [habs, setHabs] = useState([]);
  const [hab, setHab] = useState({ nombre: '', nivel: 'intermedio', anios_uso: 1 });
  const [exps, setExps] = useState([]);
  const [exp, setExp] = useState({ empresa: '', cargo: '', descripcion: '', tipo_trabajo: 'tiempo_completo', fecha_inicio: '', fecha_fin: '', es_actual: false });
  const [forms, setForms] = useState([]);
  const [formF, setFormF] = useState({ titulo: '', institucion: 'umsa', nivel: 'licenciatura', fecha_inicio: '', fecha_fin: '' });
  const [kpi, setKpi] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [cargando, setCargando] = useState(false);
  const toast = useToast();

  function volcar(p) {
    setForm({
      nombres: p.nombres || '', apellidos: p.apellidos || '', telefono: p.telefono || '',
      direccion: p.direccion || '', linkedin: p.linkedin || '', github: p.github || '', portafolio_url: p.portafolio_url || ''
    });
    setHabs((p.habilidades || []).map((h) => ({ nombre: h.nombre, nivel: h.nivel || 'intermedio', anios_uso: Number(h.anios_uso) || 0 })));
    setExps((p.experiencias || []).map((e) => ({
      empresa: e.empresa || '', cargo: e.cargo || '', descripcion: e.descripcion || '', tipo_trabajo: e.tipo_trabajo || 'tiempo_completo',
      fecha_inicio: (e.fecha_inicio || '').slice(0, 10), fecha_fin: (e.fecha_fin || '').slice(0, 10), es_actual: !!e.es_actual
    })));
    setForms((p.formaciones || []).map((f) => ({
      titulo: f.titulo || '', institucion: f.institucion || 'umsa', nivel: f.nivel || 'licenciatura',
      fecha_inicio: (f.fecha_inicio || '').slice(0, 10), fecha_fin: (f.fecha_fin || '').slice(0, 10)
    })));
    setKpi({ kpi: p.kpi, clasificacion: p.clasificacion });
  }

  useEffect(() => {
    api('/api/catalogos').then((c) => setCats({
      tecnologias: c.tecnologias || [], tipos_trabajo: c.tipos_trabajo || ['tiempo_completo', 'medio_tiempo'],
      niveles: c.niveles || NIVELES, instituciones: c.instituciones || ['umsa', 'otra'],
      niveles_formacion: c.niveles_formacion || ['licenciatura', 'otro']
    })).catch(() => {});
    api('/api/yo').then(volcar).catch((ex) => setErr(ex.message));
  }, []);

  async function guardar() {
    setErr(''); setMsg('');
    setCargando(true);
    try {
      const r = await api('/api/yo', { method: 'PUT', body: JSON.stringify({ ...form, habilidades: habs, experiencias: exps, formaciones: forms }) });
      volcar(r);
      setMsg(`Perfil guardado. Perfil ${r.kpi}% (${r.clasificacion})`);
      toast(`Perfil guardado. Perfil ${r.kpi}% (${r.clasificacion})`);
    } catch (ex) { setErr(ex.message); toast(ex.message, false); }
    finally { setCargando(false); }
  }

  const setF = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="max-w-2xl mx-auto card p-6 space-y-4">
      <h2 className="page-title">Mi perfil {kpi && <span className="text-base font-normal">· Perfil {kpi.kpi}% ({kpi.clasificacion})</span>}</h2>
      {err && <p className="err-msg">{err}</p>}
      {msg && <p className="ok-msg">{msg}</p>}
      <div className="grid grid-cols-2 gap-2">
        <label className="lab">Nombres*<input className="input w-full" value={form.nombres} onChange={setF('nombres')} /></label>
        <label className="lab">Apellidos<input className="input w-full" value={form.apellidos} onChange={setF('apellidos')} /></label>
        <label className="lab">Teléfono<input className="input w-full" value={form.telefono} onChange={setF('telefono')} /></label>
        <label className="lab">Dirección<input className="input w-full" value={form.direccion} onChange={setF('direccion')} /></label>
        <label className="lab">LinkedIn<input className="input w-full" value={form.linkedin} onChange={setF('linkedin')} /></label>
        <label className="lab">GitHub<input className="input w-full" value={form.github} onChange={setF('github')} /></label>
        <label className="lab col-span-2">Portafolio URL<input className="input w-full" value={form.portafolio_url} onChange={setF('portafolio_url')} /></label>
      </div>
      <div className="border-t border-slate-200 dark:border-slate-800 pt-2">
        <p className="section-title">Habilidades ({habs.length})</p>
        <div className="flex gap-2 mt-1 items-end">
          <label className="lab">Tecnología<input className="input flex-1" list="mpcat" value={hab.nombre} onChange={(e) => setHab({ ...hab, nombre: e.target.value })} /></label>
          <datalist id="mpcat">{cats.tecnologias.map((t) => <option key={t} value={t} />)}</datalist>
          <label className="lab">Nivel<select className="input w-full" value={hab.nivel} onChange={(e) => setHab({ ...hab, nivel: e.target.value })}>{cats.niveles.map((n) => <option key={n}>{n}</option>)}</select></label>
          <label className="lab">Años<input className="input w-20" type="number" min="0" value={hab.anios_uso} onChange={(e) => setHab({ ...hab, anios_uso: Number(e.target.value) })} /></label>
          <button type="button" className="btn-secondary px-3 py-3" onClick={() => { if (hab.nombre.trim()) { setHabs([...habs, { ...hab, nombre: hab.nombre.trim().toLowerCase() }]); setHab({ nombre: '', nivel: 'intermedio', anios_uso: 1 }); } }}>+</button>
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {habs.map((h, i) => <span key={i} className="bg-cyan-100 dark:bg-cyan-900 dark:text-cyan-100 text-cyan-900 text-xs px-2 py-1 rounded">{h.nombre} · {h.nivel} · {h.anios_uso}a <button className="ml-1 text-red-600 dark:text-red-400" onClick={() => setHabs(habs.filter((_, j) => j !== i))}>x</button></span>)}
        </div>
      </div>
      <div className="border-t border-slate-200 dark:border-slate-800 pt-2">
        <p className="section-title">Experiencias ({exps.length})</p>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <label className="lab">Empresa*<input className="input w-full" value={exp.empresa} onChange={(e) => setExp({ ...exp, empresa: e.target.value })} /></label>
          <label className="lab">Cargo*<input className="input w-full" value={exp.cargo} onChange={(e) => setExp({ ...exp, cargo: e.target.value })} /></label>
          <label className="lab col-span-2">Descripción<input className="input w-full" value={exp.descripcion} onChange={(e) => setExp({ ...exp, descripcion: e.target.value })} /></label>
          <label className="lab">Jornada<select className="input w-full" value={exp.tipo_trabajo} onChange={(e) => setExp({ ...exp, tipo_trabajo: e.target.value })}>{cats.tipos_trabajo.map((t) => <option key={t} value={t}>{t === 'tiempo_completo' ? 'Tiempo completo' : 'Medio tiempo'}</option>)}</select></label>
          <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={exp.es_actual} onChange={(e) => setExp({ ...exp, es_actual: e.target.checked })} /> Trabajo actual</label>
          <label className="lab">Fecha inicio<input className="input w-full" type="date" value={exp.fecha_inicio} onChange={(e) => setExp({ ...exp, fecha_inicio: e.target.value })} /></label>
          <label className="lab">Fecha fin<input className="input w-full" type="date" value={exp.fecha_fin} onChange={(e) => setExp({ ...exp, fecha_fin: e.target.value })} /></label>
        </div>
        <button type="button" className="btn-secondary px-3 py-1 mt-1 text-sm" onClick={() => { if (exp.empresa.trim() && exp.cargo.trim()) { setExps([...exps, { ...exp }]); setExp({ empresa: '', cargo: '', descripcion: '', tipo_trabajo: 'tiempo_completo', fecha_inicio: '', fecha_fin: '', es_actual: false }); } else setErr('Experiencia requiere empresa y cargo'); }}>Agregar experiencia</button>
        <ul className="text-sm mt-1">{exps.map((e, i) => <li key={i}>{e.empresa} · {e.cargo} <button className="text-red-600 dark:text-red-400" onClick={() => setExps(exps.filter((_, j) => j !== i))}>x</button></li>)}</ul>
      </div>
      <div className="border-t border-slate-200 dark:border-slate-800 pt-2">
        <p className="section-title">Formaciones ({forms.length})</p>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <label className="lab">Título*<input className="input w-full" value={formF.titulo} onChange={(e) => setFormF({ ...formF, titulo: e.target.value })} /></label>
          <label className="lab">Institución<select className="input w-full" value={formF.institucion} onChange={(e) => setFormF({ ...formF, institucion: e.target.value })}>{cats.instituciones.map((t) => <option key={t}>{t}</option>)}</select></label>
          <label className="lab">Nivel<select className="input w-full" value={formF.nivel} onChange={(e) => setFormF({ ...formF, nivel: e.target.value })}>{cats.niveles_formacion.map((n) => <option key={n}>{n}</option>)}</select></label>
          <div className="flex gap-2 items-end">
            <label className="lab">Fecha inicio<input className="input w-full" type="date" value={formF.fecha_inicio} onChange={(e) => setFormF({ ...formF, fecha_inicio: e.target.value })} /></label>
            <label className="lab">Fecha fin<input className="input w-full" type="date" value={formF.fecha_fin} onChange={(e) => setFormF({ ...formF, fecha_fin: e.target.value })} /></label>
          </div>
        </div>
        <button type="button" className="btn-secondary px-3 py-1 mt-1 text-sm" onClick={() => { if (formF.titulo.trim()) { setForms([...forms, { ...formF }]); setFormF({ titulo: '', institucion: 'umsa', nivel: 'licenciatura', fecha_inicio: '', fecha_fin: '' }); } else setErr('Formación requiere título'); }}>Agregar formación</button>
        <ul className="text-sm mt-1">{forms.map((f, i) => <li key={i}>{f.titulo} — {f.institucion} <button className="text-red-600 dark:text-red-400" onClick={() => setForms(forms.filter((_, j) => j !== i))}>x</button></li>)}</ul>
      </div>
      <button className="btn-primary px-4 py-3 w-full" onClick={guardar} disabled={cargando}>{cargando ? 'Guardando…' : 'Guardar mi perfil'}</button>
    </div>
  );
}
