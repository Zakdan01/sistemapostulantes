import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Icono } from '../components/IconosCorporativos';
import { ConvocatoriaCardCorporativa } from '../components/ConvocatoriaCardCorporativa';

// Catálogo público: solo convocatorias abiertas y solo datos publicables.
export function ConvocatoriasPublicas() {
  const [lista, setLista] = useState([]);
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState('');
  const [cargando, setCargando] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let vivo = true;
    api('/api/publico/convocatorias')
      .then((r) => { if (vivo) setLista(r || []); })
      .catch((ex) => { if (vivo) { console.error('No se pudieron cargar las convocatorias públicas', ex); setErr('No se pudieron cargar las convocatorias'); } })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, []);

  const tipos = [...new Set(lista.map((c) => c.tipo).filter(Boolean))];
  const q = busca.trim().toLowerCase();
  const filtradas = lista.filter((c) => {
    if (tipo && c.tipo !== tipo) return false;
    if (!q) return true;
    return [c.titulo, c.tipo, c.disponibilidad, ...(c.requisitos || [])]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  });
  const limpiar = () => { setBusca(''); setTipo(''); };

  return (
    <section className="section">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow eyebrow-soft">Oportunidades</span>
          <h1>Convocatorias abiertas</h1>
          <p>Mirá los requisitos de cada convocatoria. Para que el sistema evalúe tu perfil y te enliste, creá tu cuenta o iniciá sesión.</p>
        </div>

        <div className="plataforma-bar reveal">
          <label className="estado-datos" htmlFor="busca-conv">Buscar por título, tipo o requisito</label>
          <input
            id="busca-conv"
            className="input"
            style={{ maxWidth: '420px' }}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="ej. React, pasantía, remoto"
          />
        </div>

        {tipos.length ? (
          <div className="rutas-rapidas reveal" role="group" aria-label="Filtrar por tipo">
            <button className={`ruta-btn ${tipo ? '' : 'activa'}`} type="button" aria-pressed={!tipo} onClick={() => setTipo('')}>
              Todas
            </button>
            {tipos.map((t) => (
              <button
                key={t}
                className={`ruta-btn ${tipo === t ? 'activa' : ''}`}
                type="button"
                aria-pressed={tipo === t}
                onClick={() => setTipo(tipo === t ? '' : t)}
              >
                {t}
              </button>
            ))}
          </div>
        ) : null}

        <p className="help-plataforma">
          {cargando ? 'Cargando convocatorias…' : `${filtradas.length} de ${lista.length} convocatorias`}
        </p>

        <div className="cards-convocatorias" aria-live="polite">
          {err ? <p className="estado-datos muestra">{err}. Intentá recargar la página.</p> : null}
          {!cargando && !err && filtradas.length === 0 ? (
            <div className="section-cta">
              <span>{lista.length ? 'Ninguna convocatoria coincide con la búsqueda.' : 'No hay convocatorias abiertas por ahora.'}</span>
              <div className="cta-acciones">
                {lista.length
                  ? <button className="btn btn-secondary btn-sm" type="button" onClick={limpiar}>Limpiar filtros</button>
                  : <Link className="btn btn-primary btn-sm" to="/registro">Inscribirme <Icono nombre="arrow" /></Link>}
              </div>
            </div>
          ) : null}
          {!cargando && !err ? filtradas.map((c) => <ConvocatoriaCardCorporativa key={c.id} c={c} />) : null}
        </div>

        <div className="section-cta reveal">
          <span>¿Ninguna encaja todavía? Creá tu perfil y el sistema te enlistará donde cumplas el umbral.</span>
          <div className="cta-acciones">
            <Link className="btn btn-secondary btn-sm" to="/login">Ya tengo cuenta</Link>
            <Link className="btn btn-primary btn-sm" to="/registro">Inscribirme como postulante <Icono nombre="arrow" /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
