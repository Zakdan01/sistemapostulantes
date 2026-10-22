import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
  Link,
  useNavigate,
  useLocation
} from 'react-router-dom';
import { useState } from 'react';
import { Login } from './pages/Login';
import { Registro } from './pages/Registro';
import { Buscar } from './pages/Buscar';
import { Detalle } from './pages/Detalle';
import { Convocatorias } from './pages/Convocatorias';
import { Ranking } from './pages/Ranking';
import { MisConvocatorias } from './pages/MisConvocatorias';
import { MiPerfil } from './pages/MiPerfil';
import { Gestor } from './pages/Gestor';
import { ComoSeCalcula } from './pages/ComoSeCalcula';
import { sesion, salir } from './lib/api';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Avatar } from './components/ui';
import {
  IconoPanel,
  IconoBuscar,
  IconoMaletin,
  IconoChispa,
  IconoUsuario,
  IconoSalir,
  IconoSol,
  IconoLuna,
  IconoMenu,
  IconoCerrar
} from './components/Iconos';

function useTema() {
  const [tema, setTema] = useState(() => localStorage.getItem('tema') || 'dark');
  if (tema === 'dark') document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
  return [tema, (t) => { localStorage.setItem('tema', t); setTema(t); }];
}

function Protegida({ children, roles }) {
  const s = sesion();
  if (!s.token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(s.rol)) {
    return <Navigate to="/" replace />;
  }
  if (s.estado === 'pendiente' && !['/', '/mi-perfil'].includes(window.location.pathname)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

const ROLES = {
  admin: 'Administrador',
  reclutador: 'Reclutador',
  postulante: 'Postulante'
};

function enlacesDe(rol, estado) {
  const gestor = { to: '/', etiqueta: 'Gestor', icono: IconoPanel, end: true };
  if (rol === 'admin') {
    return [
      gestor,
      { to: '/buscar', etiqueta: 'Búsqueda', icono: IconoBuscar },
      { to: '/convocatorias', etiqueta: 'Convocatorias', icono: IconoMaletin },
      { to: '/como-se-calcula', etiqueta: 'Cómo se calcula', icono: IconoChispa }
    ];
  }
  if (rol === 'reclutador') {
    return [
      gestor,
      { to: '/buscar', etiqueta: 'Búsqueda', icono: IconoBuscar },
      { to: '/convocatorias', etiqueta: 'Convocatorias', icono: IconoMaletin }
    ];
  }
  if (rol === 'postulante') {
    const enlaces = [gestor];
    if (estado !== 'pendiente') {
      enlaces.push({ to: '/mis-convocatorias', etiqueta: 'Mis convocatorias', icono: IconoMaletin });
    }
    enlaces.push({ to: '/mi-perfil', etiqueta: 'Mi perfil', icono: IconoUsuario });
    return enlaces;
  }
  return [gestor];
}

function Sidebar({ abierto, onCerrar, tema, onTema }) {
  const nav = useNavigate();
  const s = sesion();
  const enlaces = enlacesDe(s.rol, s.estado);
  return (
    <aside className={`side-panel ${abierto ? 'side-open' : ''}`} aria-label="Menú principal">
      <div className="flex items-center gap-2.5 px-1 py-1">
        <Link to="/" onClick={onCerrar} className="flex min-w-0 items-center gap-2.5" aria-label="Ir al gestor">
          <span className="brand-mark">P</span>
          <span className="min-w-0">
            <span className="brand-title block truncate">Postulantes</span>
            <span className="brand-sub block">Selección inteligente</span>
          </span>
        </Link>
        <button
          type="button"
          className="btn btn-ghost ml-auto p-2 lg:hidden"
          onClick={onCerrar}
          aria-label="Cerrar menú"
        >
          <IconoCerrar className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1">
        <p className="side-label">Menú</p>
        <div className="space-y-1">
          {enlaces.map((e) => (
            <NavLink
              key={e.to}
              to={e.to}
              end={e.end}
              onClick={onCerrar}
              className={({ isActive }) => `side-link ${isActive ? 'side-link-active' : ''}`}
            >
              <e.icono className="h-[18px] w-[18px] shrink-0" />
              <span className="truncate">{e.etiqueta}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="side-foot">
        <div className="side-user">
          <Avatar nombre={s.correo || 'Sin sesión'} tamano="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{s.correo || 'Sin sesión'}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              {ROLES[s.rol] || 'Invitado'}
              {s.estado === 'pendiente' ? (
                <span className="pill pill-amber">pendiente</span>
              ) : null}
            </p>
          </div>
        </div>
        <button type="button" className="btn btn-ghost w-full justify-start px-3 py-2 text-sm" onClick={onTema}>
          {tema === 'dark' ? <IconoSol className="h-4 w-4" /> : <IconoLuna className="h-4 w-4" />}
          {tema === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        </button>
        <button
          type="button"
          className="btn btn-ghost w-full justify-start px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40"
          onClick={() => { salir(); nav('/login'); }}
        >
          <IconoSalir className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

function Topbar({ onAbrir, tema, onTema }) {
  return (
    <header className="topbar lg:hidden">
      <button
        type="button"
        className="btn btn-ghost p-2"
        onClick={onAbrir}
        aria-label="Abrir menú"
      >
        <IconoMenu className="h-5 w-5" />
      </button>
      <Link to="/" className="flex items-center gap-2 font-bold" aria-label="Ir al gestor">
        <span className="brand-mark h-8 w-8 rounded-lg text-sm">P</span>
        <span className="text-sm">Postulantes</span>
      </Link>
      <button
        type="button"
        className="btn btn-ghost ml-auto p-2"
        onClick={onTema}
        aria-label={tema === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        {tema === 'dark' ? <IconoSol className="h-5 w-5" /> : <IconoLuna className="h-5 w-5" />}
      </button>
    </header>
  );
}

function TemaFlotante({ tema, onTema }) {
  return (
    <button
      type="button"
      className="btn btn-secondary fixed right-4 top-4 z-30 h-10 w-10 rounded-full p-0 shadow-soft"
      onClick={onTema}
      aria-label={tema === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={tema === 'dark' ? 'Modo claro' : 'Modo oscuro'}
    >
      {tema === 'dark' ? <IconoSol className="h-5 w-5" /> : <IconoLuna className="h-5 w-5" />}
    </button>
  );
}

// Las rutas van dentro de un ErrorBoundary con key por ruta: si una pagina falla al
// renderizar se ve el mensaje (no la pantalla en blanco) y se resetea al navegar.
function Paginas() {
  const loc = useLocation();
  return (
    <ErrorBoundary key={loc.pathname}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/" element={<Protegida><Gestor /></Protegida>} />
        <Route path="/buscar" element={<Protegida roles={['admin', 'reclutador']}><Buscar /></Protegida>} />
        <Route path="/personas/:id" element={<Protegida roles={['admin', 'reclutador']}><Detalle /></Protegida>} />
        <Route path="/convocatorias" element={<Protegida roles={['admin', 'reclutador']}><Convocatorias /></Protegida>} />
        <Route path="/convocatorias/:id" element={<Protegida roles={['admin', 'reclutador']}><Ranking /></Protegida>} />
        <Route path="/como-se-calcula" element={<Protegida roles={['admin']}><ComoSeCalcula /></Protegida>} />
        <Route path="/mi-perfil" element={<Protegida roles={['postulante']}><MiPerfil /></Protegida>} />
        <Route path="/mis-convocatorias" element={<Protegida roles={['postulante']}><MisConvocatorias /></Protegida>} />
        <Route path="/vacantes" element={<Navigate to="/convocatorias" replace />} />
        <Route path="/vacantes/:id" element={<Navigate to="/convocatorias" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

function Shell() {
  const loc = useLocation();
  const s = sesion();
  const [abierto, setAbierto] = useState(false);
  const [tema, setTema] = useTema();
  const alternarTema = () => setTema(tema === 'dark' ? 'light' : 'dark');
  const autenticado = Boolean(s.token);
  const esAuth = loc.pathname === '/login' || loc.pathname === '/registro';
  const conSidebar = autenticado && !esAuth;

  return (
    <div className="min-h-screen">
      {conSidebar && (
        <Sidebar abierto={abierto} onCerrar={() => setAbierto(false)} tema={tema} onTema={alternarTema} />
      )}
      {conSidebar && abierto && (
        <button
          type="button"
          className="side-overlay lg:hidden"
          aria-label="Cerrar menú"
          onClick={() => setAbierto(false)}
        />
      )}

      <div className={conSidebar ? 'lg:pl-72' : ''}>
        {conSidebar && (
          <Topbar onAbrir={() => setAbierto(true)} tema={tema} onTema={alternarTema} />
        )}
        {!conSidebar && <TemaFlotante tema={tema} onTema={alternarTema} />}
        <main className={conSidebar ? 'mx-auto w-full max-w-6xl px-4 pb-12 pt-5 sm:px-6 lg:px-8 lg:pt-8' : ''}>
          <Paginas />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </BrowserRouter>
  );
}
