import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { TablaKPI } from '../components/TablaKPI';

const MODOS = [
  { valor: 'cualquiera', etiqueta: 'Al menos uno', ayuda: 'Sabe 1 o más de los elegidos' },
  { valor: 'todos', etiqueta: 'Todos estos', ayuda: 'Sabe todos los elegidos (puede saber más)' },
  { valor: 'solo', etiqueta: 'Solo estos', ayuda: 'Sabe exactamente esos y ningún otro' }
];

export function Buscar() {
  const nav = useNavigate();
  const [elegidas, setElegidas] = useState(['javascript', 'sql']);
  const [modo, setModo] = useState('cualquiera');
  const [anios, setAnios] = useState('');
  const [tipo, setTipo] = useState('');
  const [nivel, setNivel] = useState('');
  const [cats, setCats] = useState({ tecnologias: [], niveles: [], tipos_trabajo: [] });
  const [filas, setFilas] = useState([]);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState('');

  useEffect(() => {
    api('/api/catalogos').then(setCats).catch(() => {});
  }, []);
  useEffect(() => { buscar(); }, [elegidas, modo, anios, tipo, nivel]);

  function toggle(t) {
    setElegidas(elegidas.includes(t) ? elegidas.filter((x) => x !== t) : [...elegidas, t]);
  }

  async function buscar() {
    setErr('');
    try {
      const q = new URLSearchParams();
      if (elegidas.length) q.set('tec', elegidas.join(','));
      q.set('modo', modo);
      if (anios !== '') q.set('anios_min', anios);
      if (tipo) q.set('tipo_trabajo', tipo);
      if (nivel) q.set('nivel', nivel);
      const r = await api(`/api/personas?${q.toString()}`);
      setFilas(r.resultados);
      setTotal(r.total);
    } catch (ex) { setErr(ex.message); }
  }

  return (
    <div className="space-y-4">
      <h2 className="page-title">Búsqueda de postulantes</h2>
      <div className="card p-4 space-y-3">
        <div>
          <p className="text-xs font-semibold mb-1">Lenguajes / tecnologías — click para elegir ({elegidas.length})</p>
          <div className="flex flex-wrap gap-1">
            {cats.tecnologias.map((t) => (
              <button key={t} type="button" onClick={() => toggle(t)}
                className={`text-xs px-2 py-1 rounded ${elegidas.includes(t) ? 'btn-primary' : 'bg-slate-100 dark:bg-slate-800'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="text-xs">Modo</label>
            <select className="input block" value={modo} onChange={(e) => setModo(e.target.value)}>
              {MODOS.map((m) => <option key={m.valor} value={m.valor}>{m.etiqueta}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs">Años experiencia mín.</label>
            <input className="input w-24 block" type="number" min="0" max="60" value={anios} onChange={(e) => setAnios(e.target.value)} placeholder="—" />
          </div>
        <div>
          <label className="text-xs">Jornada (tipo de trabajo)</label>
          <select className="input block" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">—</option>
            {cats.tipos_trabajo.map((t) => <option key={t} value={t}>{t === 'tiempo_completo' ? 'Tiempo completo' : t === 'medio_tiempo' ? 'Medio tiempo' : t}</option>)}
          </select>
        </div>
          <div>
            <label className="text-xs">Nivel mínimo</label>
            <select className="input block" value={nivel} onChange={(e) => setNivel(e.target.value)}>
              <option value="">—</option>
              {cats.niveles.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <span className="text-sm text-slate-500 dark:text-slate-400 ml-auto">total: {total}</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{MODOS.find((m) => m.valor === modo).ayuda}. Ej: javascript,react + Todos = sabe ambas aunque sepa más.</p>
      </div>
      {err && <p className="err-msg">{err}</p>}
      <TablaKPI filas={filas} onVer={(f) => nav(`/personas/${f.id}`)} />
    </div>
  );
}
