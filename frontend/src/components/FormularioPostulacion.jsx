import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const NIVELES = ['principiante', 'basico', 'intermedio', 'avanzado', 'experto'];
const DISP = ['Inmediata', 'En 15 días', 'En 1 mes', 'Medio tiempo', 'No disponible'];
const HAB0 = { nombre: '', nivel: 'intermedio', anios_uso: 1 };
const EXP0 = { empresa: '', cargo: '', descripcion: '', tipo_trabajo: 'tiempo_completo', fecha_inicio: '', fecha_fin: '', es_actual: false };
const FORM0 = { titulo: '', institucion: '', nivel: '', fecha_inicio: '', fecha_fin: '' };

// Formulario completo de postulación: lo que ve el postulante.
// Props: convocatoriaId, convocatoriaOpciones? [{id,titulo}] (muestra select primero si no hay convocatoriaId),
// personaId? (admin), prefill? (datos persona), soloVista? (preview sin envío), onOk, onErr.
export function FormularioPostulacion({ convocatoriaId, convocatoriaOpciones, personaId, prefill, soloVista, onOk, onErr }) {
  const [cats, setCats] = useState({ tecnologias: [], tipos_trabajo: ['tiempo_completo', 'medio_tiempo'], niveles: NIVELES, instituciones: ['umsa', 'otra'], niveles_formacion: ['licenciatura', 'otro'], disponibilidades: DISP });
  const [identidad, setIdentidad] = useState({ nombres: '', apellidos: '', correo: '' });
  const [selConv, setSelConv] = useState('');
  const [contacto, setContacto] = useState({ telefono: '', direccion: '', linkedin: '', github: '', portafolio_url: '' });
  const [disponibilidad, setDisponibilidad] = useState('Inmediata');
  const [habs, setHabs] = useState([]);
  const [hab, setHab] = useState(HAB0);
  const [exps, setExps] = useState([]);
  const [exp, setExp] = useState(EXP0);
  const [forms, setForms] = useState([]);
  const [formF, setFormF] = useState(FORM0);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api('/api/catalogos').then((c) => setCats({
      tecnologias: c.tecnologias || [],
      tipos_trabajo: c.tipos_trabajo?.length ? c.tipos_trabajo : ['tiempo_completo', 'medio_tiempo'],
      niveles: c.niveles?.length ? c.niveles : NIVELES,
      instituciones: c.instituciones?.length ? c.instituciones : ['umsa', 'otra'],
      niveles_formacion: c.niveles_formacion?.length ? c.niveles_formacion : ['licenciatura', 'otro'],
      disponibilidades: c.disponibilidades?.length ? c.disponibilidades : DISP
    })).catch(() => {});
  }, []);

  useEffect(() => {
    if (!prefill) return;
    setIdentidad({
      nombres: prefill.nombres || '', apellidos: prefill.apellidos || '', correo: prefill.correo || ''
    });
    setContacto({
      telefono: prefill.telefono || '', direccion: prefill.direccion || '',
      linkedin: prefill.linkedin || '', github: prefill.github || '', portafolio_url: prefill.portafolio_url || ''
    });
    setHabs((prefill.habilidades || []).map((h) => ({ nombre: h.nombre, nivel: h.nivel || 'intermedio', anios_uso: Number(h.anios_uso) || 0 })));
    setExps((prefill.experiencias || []).map((e) => ({
      empresa: e.empresa || '', cargo: e.cargo || '', descripcion: e.descripcion || '',
      tipo_trabajo: e.tipo_trabajo || 'tiempo_completo',
      fecha_inicio: (e.fecha_inicio || '').slice(0, 10), fecha_fin: (e.fecha_fin || '').slice(0, 10),
      es_actual: !!e.es_actual
    })));
    setForms((prefill.formaciones || []).map((f) => ({
      titulo: f.titulo || '', institucion: f.institucion || cats.instituciones[0] || 'umsa', nivel: f.nivel || cats.niveles_formacion[0] || 'licenciatura',
      fecha_inicio: (f.fecha_inicio || '').slice(0, 10), fecha_fin: (f.fecha_fin || '').slice(0, 10)
    })));
  }, [prefill]);

  function agregarHab() {
    if (!hab.nombre.trim()) return;
    setHabs([...habs, { ...hab, nombre: hab.nombre.trim().toLowerCase() }]);
    setHab(HAB0);
  }
  function agregarExp() {
    if (!exp.empresa.trim() || !exp.cargo.trim()) { onErr?.('Experiencia requiere empresa y cargo'); return; }
    setExps([...exps, { ...exp }]);
    setExp(EXP0);
  }
  function agregarForm() {
    if (!formF.titulo.trim()) { onErr?.('Formación requiere título'); return; }
    setForms([...forms, { ...formF }]);
    setFormF(FORM0);
  }

  async function enviar() {
    onErr?.('');
    const convId = convocatoriaId || Number(selConv);
    if (!convId) { onErr?.('Elige la convocatoria'); return; }
    if (!identidad.nombres.trim()) { onErr?.('Nombres es requerido'); return; }
    if (!habs.length) { onErr?.('Agrega al menos 1 habilidad'); return; }
    if (!exps.length) { onErr?.('Agrega al menos 1 experiencia'); return; }
    setEnviando(true);
    try {
      const body = { nombres: identidad.nombres.trim(), apellidos: identidad.apellidos.trim(), disponibilidad, ...contacto, habilidades: habs, experiencias: exps, formaciones: forms };
      if (personaId) body.persona_id = personaId;
      const r = await api(`/api/convocatorias/${convId}/postular`, { method: 'POST', body: JSON.stringify(body) });
      onOk?.(r);
    } catch (ex) { onErr?.(ex.message); }
    finally { setEnviando(false); }
  }

  const setC = (k) => (e) => setContacto({ ...contacto, [k]: e.target.value });
  const setI = (k) => (e) => setIdentidad({ ...identidad, [k]: e.target.value });
  const lab = 'lab';

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">Formulario de postulación — completa todos tus datos para esta convocatoria</p>
      {convocatoriaId ? null : (
        <label className={lab}>Convocatoria*
          <select className="input w-full font-normal" value={selConv} onChange={(e) => setSelConv(e.target.value)}>
            <option value="">— Elige la convocatoria —</option>
            {(convocatoriaOpciones || []).map((c) => <option key={c.id} value={c.id}>{c.titulo} ({c.estado})</option>)}
          </select>
        </label>
      )}
      <div className="grid grid-cols-2 gap-2">
        <label className={lab}>Nombres*<input className="input w-full font-normal" placeholder="ej. Diego" value={identidad.nombres} onChange={setI('nombres')} /></label>
        <label className={lab}>Apellidos<input className="input w-full font-normal" placeholder="ej. Aguilar Rojas" value={identidad.apellidos} onChange={setI('apellidos')} /></label>
        <label className={`${lab} col-span-2`}>Correo (tu cuenta, no se cambia)<input className="input w-full font-normal bg-slate-100 dark:bg-slate-800" readOnly value={identidad.correo} /></label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className={lab}>Teléfono<input className="input w-full font-normal" placeholder="ej. 71234567" value={contacto.telefono} onChange={setC('telefono')} /></label>
        <label className={lab}>Dirección<input className="input w-full font-normal" placeholder="ej. Av. Arce #210" value={contacto.direccion} onChange={setC('direccion')} /></label>
        <label className={lab}>LinkedIn<input className="input w-full font-normal" placeholder="linkedin.com/in/..." value={contacto.linkedin} onChange={setC('linkedin')} /></label>
        <label className={lab}>GitHub<input className="input w-full font-normal" placeholder="github.com/..." value={contacto.github} onChange={setC('github')} /></label>
        <label className={`${lab} col-span-2`}>Portafolio URL<input className="input w-full font-normal" placeholder="https://..." value={contacto.portafolio_url} onChange={setC('portafolio_url')} /></label>
        <label className={`${lab} col-span-2`}>Disponibilidad<select className="input w-full font-normal" value={disponibilidad} onChange={(e) => setDisponibilidad(e.target.value)}>
          {cats.disponibilidades.map((d) => <option key={d}>{d}</option>)}
        </select></label>
      </div>
      <div className="border-t pt-2">
        <p className="text-sm font-semibold">Habilidades* ({habs.length})</p>
        <div className="flex gap-2 mt-1 items-end">
          <label className={lab}>Tecnología<input className="input w-full font-normal" list="fhcat" placeholder="ej. python" value={hab.nombre} onChange={(e) => setHab({ ...hab, nombre: e.target.value })} /></label>
          <datalist id="fhcat">{cats.tecnologias.map((t) => <option key={t} value={t} />)}</datalist>
          <label className={lab}>Nivel<select className="input font-normal" value={hab.nivel} onChange={(e) => setHab({ ...hab, nivel: e.target.value })}>
            {cats.niveles.map((n) => <option key={n}>{n}</option>)}
          </select></label>
          <label className={lab}>Años de uso<input className="input w-20 font-normal" type="number" min="0" value={hab.anios_uso} onChange={(e) => setHab({ ...hab, anios_uso: Number(e.target.value) })} /></label>
          <button type="button" className="btn-secondary px-3 py-2" onClick={agregarHab}>+</button>
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {habs.map((h, i) => <span key={i} className="bg-cyan-100 dark:bg-cyan-900 dark:text-cyan-100 text-cyan-900 text-xs px-2 py-1 rounded">{h.nombre} · {h.nivel} · {h.anios_uso}a <button className="ml-1 text-red-600 dark:text-red-400" onClick={() => setHabs(habs.filter((_, j) => j !== i))}>x</button></span>)}
        </div>
      </div>
      <div className="border-t pt-2">
        <p className="text-sm font-semibold">Experiencias* ({exps.length})</p>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <label className={lab}>Empresa*<input className="input w-full font-normal" value={exp.empresa} onChange={(e) => setExp({ ...exp, empresa: e.target.value })} /></label>
          <label className={lab}>Cargo*<input className="input w-full font-normal" value={exp.cargo} onChange={(e) => setExp({ ...exp, cargo: e.target.value })} /></label>
          <label className={`${lab} col-span-2`}>Descripción<input className="input w-full font-normal" value={exp.descripcion} onChange={(e) => setExp({ ...exp, descripcion: e.target.value })} /></label>
          <label className={lab}>Jornada<select className="input w-full font-normal" value={exp.tipo_trabajo} onChange={(e) => setExp({ ...exp, tipo_trabajo: e.target.value })}>
            {cats.tipos_trabajo.map((t) => <option key={t} value={t}>{t === 'tiempo_completo' ? 'Tiempo completo' : t === 'medio_tiempo' ? 'Medio tiempo' : t}</option>)}
          </select></label>
          <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={exp.es_actual} onChange={(e) => setExp({ ...exp, es_actual: e.target.checked })} /> Trabajo actual</label>
          <label className={lab}>Fecha inicio<input className="input w-full font-normal" type="date" value={exp.fecha_inicio} onChange={(e) => setExp({ ...exp, fecha_inicio: e.target.value })} /></label>
          <label className={lab}>Fecha fin<input className="input w-full font-normal" type="date" value={exp.fecha_fin} onChange={(e) => setExp({ ...exp, fecha_fin: e.target.value })} /></label>
        </div>
        <button type="button" className="btn-secondary px-3 py-1 mt-1 text-sm" onClick={agregarExp}>Agregar experiencia</button>
        <ul className="text-sm mt-1">
          {exps.map((e, i) => <li key={i}>{e.empresa} · {e.cargo} ({e.tipo_trabajo}) <button className="text-red-600 dark:text-red-400" onClick={() => setExps(exps.filter((_, j) => j !== i))}>x</button></li>)}
        </ul>
      </div>
      <div className="border-t pt-2">
        <p className="text-sm font-semibold">Formaciones ({forms.length})</p>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <label className={lab}>Título*<input className="input w-full font-normal" value={formF.titulo} onChange={(e) => setFormF({ ...formF, titulo: e.target.value })} /></label>
          <label className={lab}>Institución<select className="input w-full font-normal" value={formF.institucion} onChange={(e) => setFormF({ ...formF, institucion: e.target.value })}>
            {cats.instituciones.map((t) => <option key={t}>{t}</option>)}
          </select></label>
          <label className={lab}>Nivel de formación<select className="input w-full font-normal" value={formF.nivel} onChange={(e) => setFormF({ ...formF, nivel: e.target.value })}>
            {cats.niveles_formacion.map((n) => <option key={n}>{n}</option>)}
          </select></label>
          <div className="flex gap-2 items-end">
            <label className={lab}>Fecha inicio<input className="input w-full font-normal" type="date" value={formF.fecha_inicio} onChange={(e) => setFormF({ ...formF, fecha_inicio: e.target.value })} /></label>
            <label className={lab}>Fecha fin<input className="input w-full font-normal" type="date" value={formF.fecha_fin} onChange={(e) => setFormF({ ...formF, fecha_fin: e.target.value })} /></label>
          </div>
        </div>
        <button type="button" className="btn-secondary px-3 py-1 mt-1 text-sm" onClick={agregarForm}>Agregar formación</button>
        <ul className="text-sm mt-1">
          {forms.map((f, i) => <li key={i}>{f.titulo} — {f.institucion} ({f.nivel}) <button className="text-red-600 dark:text-red-400" onClick={() => setForms(forms.filter((_, j) => j !== i))}>x</button></li>)}
        </ul>
      </div>
      {soloVista
        ? <p className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm p-2 rounded text-center">Vista previa — entra como postulante para enviar</p>
        : <button className="btn-primary px-4 py-2 w-full" onClick={enviar} disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar postulación'}</button>}
    </div>
  );
}
