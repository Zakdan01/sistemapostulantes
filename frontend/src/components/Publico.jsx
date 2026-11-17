// Marco del sitio publico (visitantes y postulantes): cabecera, navegacion y pie.
// El sistema interno vive aparte, bajo /interno, con su propio sidebar.
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { sesion, salir } from '../lib/api';
import { IconoSalir, IconoSol, IconoLuna } from './Iconos';

const ENLACES = [
  { to: '/', etiqueta: 'Inicio', end: true },
  { to: '/convocatorias', etiqueta: 'Convocatorias' },
  { to: '/empresas', etiqueta: 'Empresas' },
  { to: '/contacto', etiqueta: 'Contacto' }
];

export function Publico({ tema, onTema }) {
  const nav = useNavigate();
  const s = sesion();
  const panel = s.rol === 'postulante' ? '/mi-panel' : '/interno';

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/85">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Postulantes, ir al inicio">
            <span className="brand-mark">P</span>
            <span>
              <span className="brand-title block">Postulantes</span>
              <span className="brand-sub block">Selección inteligente</span>
            </span>
          </Link>

          <nav className="order-3 flex w-full gap-1 sm:order-none sm:ml-4 sm:w-auto" aria-label="Sitio público">
            {ENLACES.map((e) => (
              <NavLink
                key={e.to}
                to={e.to}
                end={e.end}
                className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}
              >
                {e.etiqueta}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn btn-ghost p-2"
              onClick={onTema}
              aria-label={tema === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {tema === 'dark' ? <IconoSol className="h-4 w-4" /> : <IconoLuna className="h-4 w-4" />}
            </button>
            {s.token ? (
              <>
                <Link className="btn btn-primary px-4 py-2 text-sm" to={panel}>
                  {s.rol === 'postulante' ? 'Mi panel' : 'Ir al sistema'}
                </Link>
                <button
                  type="button"
                  className="btn btn-ghost px-3 py-2 text-sm"
                  onClick={() => { salir(); window.location.assign('/'); }}
                >
                  <IconoSalir className="h-4 w-4" />
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link className="btn btn-secondary px-4 py-2 text-sm" to="/login">Iniciar sesión</Link>
                <Link className="btn btn-primary px-4 py-2 text-sm" to="/registro">Inscribirme</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1">
        <Outlet />
      </div>

      <footer className="border-t border-slate-200 py-6 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:px-6 dark:text-slate-400">
          <p>Postulantes · selección inteligente.</p>
          <div className="flex flex-wrap gap-4 sm:ml-auto">
            <Link className="link" to="/convocatorias">Convocatorias</Link>
            <Link className="link" to="/empresas">Empresas</Link>
            <Link className="link" to="/contacto">Contacto</Link>
            <Link className="link" to="/interno/login">Acceso del equipo</Link>
            <button type="button" className="link" onClick={() => nav('/login')}>Acceso de postulantes</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
