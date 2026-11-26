// Marco del sitio corporativo: cabecera, navegación, pie y el CSS aislado.
// Envuelve también /login y /registro para que no haya dos cabeceras distintas.
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { sesion, salir } from '../lib/api';
import { esRutaCorporativa } from '../lib/corporativo';
import { Icono, SpriteCorporativo } from './IconosCorporativos';
import { LogoHeartgold } from './LogoHeartgold';
import { useCorporateEffects } from '../hooks/useCorporateEffects';

const ID_MARCO = 'css-marco';
const ID_CSS = 'css-corporativo';
const ANIO = new Date().getFullYear();

function asegurarHoja(id, href) {
  let hoja = document.getElementById(id);
  if (!hoja) {
    hoja = document.createElement('link');
    hoja.id = id;
    hoja.rel = 'stylesheet';
    hoja.href = href;
    document.head.appendChild(hoja);
  }
  return hoja;
}

const ENLACES = [
  { to: '/#servicios', etiqueta: 'Servicios' },
  { to: '/#proceso', etiqueta: 'Cómo trabajamos' },
  { to: '/convocatorias', etiqueta: 'Convocatorias' },
  { to: '/#plataforma', etiqueta: 'Plataforma' },
  { to: '/contacto', etiqueta: 'Contacto' }
];

export function PublicoCorporativo({ tema, onTema }) {
  const [abierto, setAbierto] = useState(false);
  const { pathname } = useLocation();
  const corporativa = esRutaCorporativa(pathname);
  const s = sesion();
  const panel = s.rol === 'postulante'
    ? (s.estado === 'pendiente' ? '/mi-perfil' : '/mis-convocatorias')
    : '/interno';
  useCorporateEffects();

  useEffect(() => {
    const hoja = asegurarHoja(ID_MARCO, '/marco.css');
    return () => { hoja.remove(); };
  }, []);

  useEffect(() => {
    if (!corporativa) return undefined;
    const hoja = asegurarHoja(ID_CSS, '/corporativo.css');
    return () => { hoja.remove(); };
  }, [corporativa]);

  useEffect(() => {
    const cerrar = (e) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    const fuera = (e) => {
      if (!e.target.closest('.nav-wrap')) setAbierto(false);
    };
    document.addEventListener('keydown', cerrar);
    document.addEventListener('click', fuera);
    return () => {
      document.removeEventListener('keydown', cerrar);
      document.removeEventListener('click', fuera);
    };
  }, []);

  const cerrarMenu = () => setAbierto(false);

  return (
    <>
      <SpriteCorporativo />
      <a className="skip-link" href="#main">Saltar al contenido principal</a>
      <div className="scroll-progress" aria-hidden="true" />

      <header className="site-header" id="siteHeader">
        <div className="container nav-wrap">
          <Link className="brand" to="/" onClick={cerrarMenu} aria-label="Heartgold Inc., inicio">
            <LogoHeartgold className="h-12 w-12 shrink-0" />
            <span className="brand-copy">
              <strong>Heartgold Inc.</strong>
              <small>Registro y selección de talento</small>
            </span>
          </Link>

          <nav className={`nav ${abierto ? 'abierta' : ''}`} id="navPrincipal" aria-label="Navegación principal">
            {ENLACES.map((e) => (
              <Link key={e.to} to={e.to} onClick={cerrarMenu}>{e.etiqueta}</Link>
            ))}
            <Link className="nav-cta-movil" to={s.token ? panel : '/login'} onClick={cerrarMenu}>
              {s.token ? 'Ir a mi panel' : 'Ingresar'}
            </Link>
          </nav>

          <div className="nav-actions">
            <button
              className="icon-btn"
              id="temaBtn"
              type="button"
              onClick={onTema}
              aria-label={tema === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title="Cambiar tema"
            >
              <Icono nombre={tema === 'dark' ? 'sun' : 'moon'} />
            </button>
            <Link className="btn btn-primary btn-sm nav-cta" to={s.token ? panel : '/login'}>
              <Icono nombre="lock" />
              {s.token ? 'Ir a mi panel' : 'Ingresar a la plataforma'}
            </Link>
            {s.token ? (
              <button
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={() => { salir(); window.location.assign('/'); }}
              >
                Salir
              </button>
            ) : null}
            <button
              className="icon-btn menu-btn"
              id="menuBtn"
              type="button"
              onClick={() => setAbierto((v) => !v)}
              aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={abierto}
              aria-controls="navPrincipal"
            >
              <Icono nombre={abierto ? 'close' : 'menu'} />
            </button>
          </div>
        </div>
      </header>

      <div id="main" className="flex-1">
        <Outlet />
      </div>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <Link className="brand brand-footer" to="/" aria-label="Heartgold Inc., inicio">
              <LogoHeartgold className="h-12 w-12 shrink-0" />
              <span className="brand-copy">
                <strong>Heartgold Inc.</strong>
                <small>Registro y selección de talento</small>
              </span>
            </Link>
            <p>Recibimos y registramos convocatorias y postulantes. Selección con criterios claros, trazabilidad real.</p>
          </div>
          <div>
            <h4>Navegación</h4>
            <Link to="/#servicios">Servicios</Link>
            <Link to="/#proceso">Cómo trabajamos</Link>
            <Link to="/#casos">Casos de uso</Link>
            <Link to="/convocatorias">Convocatorias</Link>
            <Link to="/#faq">Preguntas frecuentes</Link>
            <Link to="/#plataforma">Plataforma</Link>
          </div>
          <div>
            <h4>Accesos</h4>
            <Link to="/interno/login">Administración</Link>
            <Link to="/registro">Registro de postulante</Link>
            <Link to="/contacto">Contacto</Link>
          </div>
          <div>
            <h4>Plataforma</h4>
            <p>Sistema de convocatorias y postulantes integrado en este sitio.</p>
            <Link className="btn btn-secondary btn-sm" to={s.token ? panel : '/login'}>
              <Icono nombre="arrow" /> Abrir sistema
            </Link>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {ANIO} Heartgold Inc. Todos los derechos reservados.</span>
          <span>Hecho para conectar talento y oportunidades. Fotos de paisaje: Unsplash.</span>
        </div>
      </footer>
    </>
  );
}
