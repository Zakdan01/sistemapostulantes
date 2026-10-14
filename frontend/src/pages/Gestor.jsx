import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, sesion } from '../lib/api';
import { TablaKPI } from '../components/TablaKPI';
import { useToast } from '../components/Toast';

// Gestor por rol:
// - admin: resumen + cuentas por aprobar + convocatorias por aprobar + postulaciones por aceptar + todo.
// - reclutador: resumen propio + sus convocatorias + postulantes en sus postulaciones.
// - postulante: tablero de todas las postulaciones (suyas destacadas) + las suyas.
export function Gestor() {
  const nav = useNavigate();
  const rol = sesion().rol;
  const esAdmin = rol === 'admin';
  const esPostulante = rol === 'postulante';
  const [resumen, setResumen] = useState(null);
  const [pendientes, setPendientes] = useState([]);
  const [porAprobar, setPorAprobar] = useState([]);
  const [convocatorias, setConvocatorias] = useState([]);
  const [postulantes, setPostulantes] = useState([]);
  const [tablero, setTablero] = useState([]);
  const [mis, setMis] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [yoId, setYoId] = useState(null);
  const [err, setErr] = useState('');
  const [ocupado, setOcupado] = useState(null);
  const toast = useToast();

  function cargar() {
    setErr('');
    if (esPostulante) {
      Promise.all([api('/api/postulaciones'), api('/api/mis-postulaciones'), api('/api/yo')])
        .then(([t, m, y]) => { setTablero(t); setMis(m); setYoId(y.id); })
        .catch((ex) => setErr(ex.message));
      return;
    }
    const llamadas = [
      api('/api/admin/resumen'),
      api('/api/postulaciones?estado=postulado'),
      api('/api/convocatorias?estado=pendiente'),
      api('/api/convocatorias')
    ];
    if (esAdmin) {
      llamadas.push(api('/api/personas'));
      llamadas.push(api('/api/admin/usuarios?estado=pendiente'));
    } else {
      llamadas.push(api('/api/postulaciones'));
    }
    Promise.all(llamadas).then(([r, p, pa, c, extra, cuentasP]) => {
      setResumen(r);
      setPendientes(p);
      setPorAprobar(pa);
      setConvocatorias(c);
      if (esAdmin) {
        setPostulantes(extra.resultados);
        setCuentas(cuentasP);
      } else {
        // postulantes en sus postulaciones (únicos por persona)
        const vistos = new Map();
        for (const t of extra) {
          if (!vistos.has(t.persona_id)) {
            vistos.set(t.persona_id, {
              id: t.persona_id, nombres: t.nombres, apellidos: t.apellidos, correo: t.correo,
              kpi: t.kpi_al_postular, match: t.match_pct, estado_postulacion: t.estado,
              convocatoria_titulo: t.convocatoria_titulo, lenguajes: []
            });
          }
        }
        setPostulantes([...vistos.values()]);
      }
    }).catch((ex) => setErr(ex.message));
  }
  useEffect(() => { cargar(); }, []);

  async function decidir(id, estado, etiqueta) {
    setErr('');
    setOcupado(`p${id}${estado}`);
    try {
      await api(`/api/postulaciones/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) });
      toast(`Postulación ${etiqueta || estado}.`);
      cargar();
    } catch (ex) { setErr(ex.message); toast(ex.message, false); }
    finally { setOcupado(null); }
  }

  async function decidirConv(id, accion, etiqueta) {
    setErr('');
    setOcupado(`c${id}${accion}`);
    try {
      await api(`/api/convocatorias/${id}/${accion}`, { method: 'PATCH' });
      toast(`Convocatoria ${etiqueta}.`);
      cargar();
    } catch (ex) { setErr(ex.message); toast(ex.message, false); }
    finally { setOcupado(null); }
  }

  async function decidirCuenta(id, accion, etiqueta) {
    setErr('');
    setOcupado(`u${id}${accion}`);
    try {
      await api(`/api/admin/usuarios/${id}/${accion}`, { method: 'PATCH' });
      toast(`Cuenta ${etiqueta}.`);
      cargar();
    } catch (ex) { setErr(ex.message); toast(ex.message, false); }
    finally { setOcupado(null); }
  }

  const [staff, setStaff] = useState({ correo: '', password: '', rol: 'reclutador' });
  const [staffMsg, setStaffMsg] = useState('');

  const [staffCargando, setStaffCargando] = useState(false);

  async function crearStaff(e) {
    e.preventDefault();
    setErr(''); setStaffMsg('');
    setStaffCargando(true);
    try {
      const r = await api('/api/admin/usuarios', { method: 'POST', body: JSON.stringify(staff) });
      const m = `Cuenta ${r.rol} creada y activa: ${r.correo}`;
      setStaffMsg(m);
      toast(m);
      setStaff({ correo: '', password: '', rol: 'reclutador' });
    } catch (ex) { setErr(ex.message); toast(ex.message, false); }
    finally { setStaffCargando(false); }
  }

  if (esPostulante) {
    const porConv = {};
    for (const t of tablero) {
      (porConv[t.convocatoria_titulo] = porConv[t.convocatoria_titulo] || []).push(t);
    }
    return (
      <div className="space-y-4">
        <h2 className="page-title">Gestor de postulaciones</h2>
        {err && <p className="err-msg">{err}</p>}
        {sesion().estado === 'pendiente' && (
          <p className="card p-4 text-amber-700 dark:text-amber-400 text-sm font-semibold">Tu cuenta está pendiente de aprobación: puedes ver y completar tu perfil, pero postularás cuando el admin te apruebe.</p>
        )}
        <div className="card p-4">
          <h3 className="font-bold mb-2">Mis postulaciones ({mis.length})</h3>
          {mis.length === 0 && <p className="help">Aún no te postulaste. Ve a Postular.</p>}
          {mis.map((p) => (
            <div key={p.id} className="border-t border-slate-200 dark:border-slate-800 py-2 text-sm">
              <b>{p.convocatoria_titulo}</b> ({p.convocatoria_estado}) · KPI {p.kpi_al_postular} · match {p.match_pct}% · <b>{p.estado}</b>
            </div>
          ))}
        </div>
        <div className="card p-4">
          <h3 className="font-bold mb-2">Todas las postulaciones ({tablero.length})</h3>
          {Object.entries(porConv).map(([titulo, lista]) => (
            <div key={titulo} className="border-t border-slate-200 dark:border-slate-800 py-2">
              <p className="font-semibold text-sm">{titulo} ({lista.length})</p>
              {lista.map((p) => (
                <p key={p.id} className={`text-sm ${p.persona_id === yoId ? 'font-bold text-cyan-700 dark:text-cyan-400' : ''}`}>
                  {p.nombres} {p.apellidos}{p.persona_id === yoId ? ' (tú)' : ''} — {p.estado}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="page-title">Gestor {rol === 'reclutador' ? 'de mis convocatorias' : 'de postulantes'}</h2>
      {err && <p className="err-msg">{err}</p>}
      {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ['Convocatorias abiertas', resumen.abiertas],
            ['Cerradas', resumen.cerradas],
            ['Postulantes', resumen.postulantes],
            ['Pendientes de aceptar', resumen.pendientes],
            ['Convocatorias por aprobar', resumen.pendientes_aprobacion ?? porAprobar.length],
            ['Preseleccionados', resumen.preseleccionados],
            ['Contratados', resumen.contratados],
            ['Descartados', resumen.descartados]
          ].map(([k, v]) => (
            <div key={k} className="card p-4">
              <p className="text-3xl font-extrabold">{v}</p>
              <p className="help">{k}</p>
            </div>
          ))}
        </div>
      )}
      {esAdmin && (
        <div className="card p-4">
          <h3 className="font-bold mb-2">Crear cuenta de staff (reclutador/admin, nace activa)</h3>
          {staffMsg && <p className="ok-msg mb-2">{staffMsg}</p>}
          <form onSubmit={crearStaff} className="grid grid-cols-2 md:grid-cols-4 gap-2 items-end">
            <label className="lab col-span-2 md:col-span-1">Correo*<input className="input w-full" value={staff.correo} onChange={(e) => setStaff({ ...staff, correo: e.target.value })} /></label>
            <label className="lab col-span-2 md:col-span-1">Contraseña (8+)*<input className="input w-full" type="password" value={staff.password} onChange={(e) => setStaff({ ...staff, password: e.target.value })} /></label>
            <label className="lab">Rol<select className="input w-full" value={staff.rol} onChange={(e) => setStaff({ ...staff, rol: e.target.value })}>
              <option value="reclutador">Reclutador</option>
              <option value="admin">Admin</option>
            </select></label>
            <button className="btn-primary px-4 py-3" disabled={staffCargando}>{staffCargando ? `Creando…` : `Crear cuenta`}</button>
          </form>
          <h3 className="font-bold mt-4 mb-2">Cuentas por aprobar ({cuentas.length})</h3>
          {cuentas.length === 0 && <p className="help">Sin cuentas pendientes.</p>}
          {cuentas.map((u) => (
            <div key={u.id} className="border-t border-slate-200 dark:border-slate-800 py-2 flex items-center gap-3 text-sm">
              <span className="flex-1"><b>{u.correo}</b> · {u.rol}</span>
              <button className="bg-green-600 dark:bg-green-500 text-white px-3 py-1 rounded" onClick={() => decidirCuenta(u.id, 'aprobar', 'aprobada')} disabled={ocupado === 'u'+u.id+'aprobar'}>{ocupado === 'u'+u.id+'aprobar' ? '…' : 'Aprobar'}</button>
              <button className="bg-red-100 dark:bg-red-900 dark:text-red-100 text-red-700 px-3 py-1 rounded" onClick={() => decidirCuenta(u.id, 'rechazar', 'rechazada y eliminada')} disabled={ocupado === 'u'+u.id+'rechazar'}>{ocupado === 'u'+u.id+'rechazar' ? '…' : 'Rechazar'}</button>
            </div>
          ))}
        </div>
      )}
      <div className="card p-4">
        <h3 className="font-bold mb-2">Convocatorias por aprobar ({porAprobar.length})</h3>
        {porAprobar.length === 0 && <p className="help">Sin pendientes de publicación.</p>}
        {porAprobar.map((c) => (
          <div key={c.id} className="border-t border-slate-200 dark:border-slate-800 py-2 flex items-center gap-3 text-sm">
            <span className="flex-1"><b>{c.titulo}</b> · {c.creada_por_correo} · {c.requisitos || 'sin requisitos'}</span>
            {esAdmin ? (
              <>
                <button className="bg-green-600 dark:bg-green-500 text-white px-3 py-1 rounded" onClick={() => decidirConv(c.id, 'aprobar', 'publicada')} disabled={ocupado === 'c'+c.id+'aprobar'}>{ocupado === 'c'+c.id+'aprobar' ? '…' : 'Publicar'}</button>
                <button className="bg-red-100 dark:bg-red-900 dark:text-red-100 text-red-700 px-3 py-1 rounded" onClick={() => decidirConv(c.id, 'rechazar', 'rechazada')} disabled={ocupado === 'c'+c.id+'rechazar'}>{ocupado === 'c'+c.id+'rechazar' ? '…' : 'Rechazar'}</button>
              </>
            ) : <span className="help">Solo el admin puede aprobar</span>}
          </div>
        ))}
      </div>
      <div className="card p-4">
        <h3 className="font-bold mb-2">Postulaciones por aceptar ({pendientes.length})</h3>
        {pendientes.length === 0 && <p className="help">Sin pendientes.</p>}
        {pendientes.map((p) => (
          <div key={p.id} className="border-t border-slate-200 dark:border-slate-800 py-2 flex items-center gap-3 text-sm">
            <span className="flex-1"><b>{p.nombres} {p.apellidos}</b> → {p.convocatoria_titulo} (KPI conv {p.kpi_al_postular}, match {p.match_pct}%)</span>
            <button className="bg-green-600 dark:bg-green-500 text-white px-3 py-1 rounded" onClick={() => decidir(p.id, 'preseleccionado', 'aceptada')} disabled={ocupado === 'p'+p.id+'preseleccionado'}>{ocupado === 'p'+p.id+'preseleccionado' ? '…' : 'Aceptar'}</button>
            <button className="bg-red-100 dark:bg-red-900 dark:text-red-100 text-red-700 px-3 py-1 rounded" onClick={() => decidir(p.id, 'descartado', 'rechazada')} disabled={ocupado === 'p'+p.id+'descartado'}>{ocupado === 'p'+p.id+'descartado' ? '…' : 'Rechazar'}</button>
          </div>
        ))}
      </div>
      <div className="card p-4">
        <h3 className="font-bold mb-2">{rol === 'reclutador' ? 'Mis convocatorias' : 'Todas las convocatorias'} ({convocatorias.length})</h3>
        {convocatorias.map((c) => (
          <div key={c.id} className="border-t border-slate-200 dark:border-slate-800 py-2 flex items-center gap-3 text-sm">
            <span className="flex-1"><b>{c.titulo}</b> ({c.estado}) · {c.total_postulados} postulados</span>
            <button className="text-cyan-700 dark:text-cyan-400 underline" onClick={() => nav(`/convocatorias/${c.id}`)}>Ranking</button>
          </div>
        ))}
      </div>
      <div>
        <h3 className="font-bold mb-2">{rol === 'reclutador' ? 'Postulantes en mis postulaciones' : 'Todos los postulantes'} ({postulantes.length})</h3>
        <TablaKPI filas={postulantes} onVer={(f) => nav(`/personas/${f.id}`)} />
      </div>
    </div>
  );
}
