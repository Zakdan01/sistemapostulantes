import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { TablaKPI } from '../components/TablaKPI';
import { Aviso, Boton, Campo, PageHeader, Pill, SkeletonTabla } from '../components/ui';
import { IconoBuscar, IconoFiltro, IconoUsuarios, IconoX } from '../components/Iconos';

const MODOS = [
  { valor: 'cualquiera', etiqueta: 'Al menos uno', ayuda: 'Sabe 1 o más de los elegidos' },
  { valor: 'todos', etiqueta: 'Todos estos', ayuda: 'Sabe todos los elegidos (puede saber más)' },
  { valor: 'solo', etiqueta: 'Solo estos', ayuda: 'Sabe exactamente esos y ningún otro' }
];

// Busqueda del padron (staff). Filtra por tecnologias, modo, años, jornada y nivel.
// El catalogo de tecnologias/niveles viene del backend, no esta hardcodeado aca.
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
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api('/api/catalogos')
      .then((c) => setCats({
        tecnologias: c.tecnologias || [],
        niveles: c.niveles || [],
        tipos_trabajo: c.tipos_trabajo || []
      }))
      .catch(() => {});
  }, []);

  const buscar = useCallback(async () => {
    try {
      const q = new URLSearchParams();
      if (elegidas.length) q.set('tec', elegidas.join(','));
      q.set('modo', modo);
      if (anios !== '') q.set('anios_min', anios);
      if (tipo) q.set('tipo_trabajo', tipo);
      if (nivel) q.set('nivel', nivel);
      const r = await api(`/api/personas?${q.toString()}`);
      setFilas(r.resultados || []);
      setTotal(Number(r.total) || 0);
      setErr('');
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setCargando(false);
    }
  }, [elegidas, modo, anios, tipo, nivel]);

  useEffect(() => { buscar(); }, [buscar]);

  function toggle(t) {
    setElegidas((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function limpiar() {
    setElegidas([]);
    setModo('cualquiera');
    setAnios('');
    setTipo('');
    setNivel('');
  }

  const modoActual = MODOS.find((m) => m.valor === modo) || MODOS[0];
  const hayFiltros = elegidas.length > 0 || modo !== 'cualquiera' || anios !== '' || tipo !== '' || nivel !== '';
  const etiquetaTipo = (t) => (t === 'tiempo_completo' ? 'Tiempo completo' : t === 'medio_tiempo' ? 'Medio tiempo' : t);

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Búsqueda de postulantes"
        subtitulo="Explorá el padrón por tecnologías, nivel y experiencia. Los resultados se ordenan por el perfil general."
        icono={IconoBuscar}
      >
        <Pill tono={cargando ? 'slate' : 'cyan'} aria-live="polite">
          {cargando ? 'Buscando…' : `${total} resultado${total === 1 ? '' : 's'}`}
        </Pill>
      </PageHeader>

      <section className="card p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
            <IconoFiltro className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="section-title">Filtros</h2>
            <p className="help">Hacé clic en las tecnologías para sumarlas o quitarlas.</p>
          </div>
          <Boton variante="ghost" tamano="sm" icono={IconoX} onClick={limpiar} disabled={!hayFiltros}>
            Limpiar filtros
          </Boton>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="lab mb-0">Lenguajes / tecnologías</p>
            <Pill tono={elegidas.length ? 'cyan' : 'slate'}>{elegidas.length} elegidas</Pill>
          </div>
          <div className="mt-2 flex max-h-44 flex-wrap gap-1.5 overflow-y-auto pr-1">
            {cats.tecnologias.length === 0 ? (
              <p className="help">Cargando catálogo…</p>
            ) : (
              cats.tecnologias.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={elegidas.includes(t)}
                  onClick={() => toggle(t)}
                  className={`chip ${elegidas.includes(t) ? 'chip-on' : ''}`}
                >
                  {t}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Campo etiqueta="Modo" ayuda={modoActual.ayuda}>
            <select className="input" value={modo} onChange={(e) => setModo(e.target.value)}>
              {MODOS.map((m) => <option key={m.valor} value={m.valor}>{m.etiqueta}</option>)}
            </select>
          </Campo>
          <Campo etiqueta="Años de experiencia mín.">
            <input
              className="input"
              type="number"
              min="0"
              max="60"
              value={anios}
              onChange={(e) => setAnios(e.target.value)}
              placeholder="Sin mínimo"
            />
          </Campo>
          <Campo etiqueta="Jornada (tipo de trabajo)">
            <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="">Todas</option>
              {cats.tipos_trabajo.map((t) => <option key={t} value={t}>{etiquetaTipo(t)}</option>)}
            </select>
          </Campo>
          <Campo etiqueta="Nivel mínimo">
            <select className="input" value={nivel} onChange={(e) => setNivel(e.target.value)}>
              <option value="">Cualquiera</option>
              {cats.niveles.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Campo>
        </div>

        <Aviso tono="info" className="mt-4">
          <b>{modoActual.etiqueta}:</b> {modoActual.ayuda}. Ejemplo: elegir <b>javascript</b> y <b>react</b> con «Todos estos» muestra a quien sabe ambas, aunque sepa más.
        </Aviso>
      </section>

      {err ? <Aviso tono="error" titulo="No se pudo buscar">{err}</Aviso> : null}

      {cargando ? (
        <SkeletonTabla filas={6} />
      ) : (
        <TablaKPI filas={filas} onVer={(f) => nav(`/personas/${f.id}`)} />
      )}

      {!cargando && !err && filas.length > 0 ? (
        <p className="help flex items-center gap-1.5">
          <IconoUsuarios className="h-3.5 w-3.5" />
          Mostrando {filas.length} de {total} personas del padrón.
        </p>
      ) : null}
    </div>
  );
}
