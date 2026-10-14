import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Registro } from './pages/Registro';
import { Buscar } from './pages/Buscar';
import { Detalle } from './pages/Detalle';
import { Convocatorias } from './pages/Convocatorias';
import { Ranking } from './pages/Ranking';
import { MisPostulaciones } from './pages/MisPostulaciones';
import { MiPerfil } from './pages/MiPerfil';
import { Gestor } from './pages/Gestor';
import { Postular } from './pages/Postular';
import { ComoSeCalcula } from './pages/ComoSeCalcula';
import { sesion, salir } from './lib/api';
import { ToastProvider } from './components/Toast';
import { useState } from 'react';

function usaTema() {
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

function Nav() {
  const nav = useNavigate();
  const s = sesion();
  const [tema, setTema] = usaTema();
  const esStaff = s.token && (s.rol === 'admin' || s.rol === 'reclutador');
  const esAdmin = s.token && s.rol === 'admin';
  const esPostulante = s.token && s.rol === 'postulante';
  return (
    <nav className="bg-sky-900 dark:bg-gradient-to-r dark:from-slate-950 dark:to-cyan-950 dark:border-b dark:border-cyan-900 text-white px-4 py-3 flex gap-4 items-center">
      <span className="font-bold">Postulantes v2</span>
      {s.token && <Link to="/">Gestor</Link>}
      {esStaff && <Link to="/buscar">Búsqueda</Link>}
      {s.token && !esPostulante && <Link to="/convocatorias">Convocatorias</Link>}
      {esAdmin && <Link to="/postular">Postular</Link>}
      {esAdmin && <Link to="/como-se-calcula">Cómo se calcula</Link>}
      {esPostulante && <Link to="/postular">Postular</Link>}
      {esPostulante && <Link to="/mi-perfil">Mi perfil</Link>}
      <span className="ml-auto text-sm">{s.correo || 'Sin sesión'}{s.estado === 'pendiente' ? ' (pendiente)' : ''}</span>
      <button className="text-sm border border-white/30 rounded px-2" title="Cambiar tema" onClick={() => setTema(tema === 'dark' ? 'light' : 'dark')}>
        {tema === 'dark' ? '☀' : '🌙'}
      </button>
      {s.token
        ? <button className="underline text-sm" onClick={() => { salir(); nav('/login'); }}>Salir</button>
        : <><Link to="/login">Entrar</Link><Link to="/registro">Inscribirme</Link></>}
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
      <Nav />
      <main className="max-w-5xl mx-auto p-4">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/" element={<Protegida><Gestor /></Protegida>} />
          <Route path="/buscar" element={<Protegida roles={['admin', 'reclutador']}><Buscar /></Protegida>} />
          <Route path="/personas/:id" element={<Protegida roles={['admin', 'reclutador']}><Detalle /></Protegida>} />
          <Route path="/convocatorias" element={<Protegida roles={['admin', 'reclutador']}><Convocatorias /></Protegida>} />
          <Route path="/convocatorias/:id" element={<Protegida roles={['admin', 'reclutador']}><Ranking /></Protegida>} />
          <Route path="/postular" element={<Protegida roles={['admin', 'postulante']}><Postular /></Protegida>} />
          <Route path="/como-se-calcula" element={<Protegida roles={['admin']}><ComoSeCalcula /></Protegida>} />
          <Route path="/mi-perfil" element={<Protegida roles={['postulante']}><MiPerfil /></Protegida>} />
          <Route path="/mis-postulaciones" element={<Protegida roles={['postulante']}><MisPostulaciones /></Protegida>} />
          <Route path="/vacantes" element={<Navigate to="/convocatorias" replace />} />
          <Route path="/vacantes/:id" element={<Navigate to="/convocatorias" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
      </ToastProvider>
    </BrowserRouter>
  );
}
