import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Badge } from '../components/TablaKPI';
import { useToast } from '../components/Toast';

export function Ranking() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [r, setR] = useState(null);
  const [err, setErr] = useState('');
  const [ocupado, setOcupado] = useState(null);

  function cargar() {
    api(`/api/convocatorias/${id}/ranking`).then(setR).catch((ex) => setErr(ex.message));
  }
  useEffect(() => { cargar(); }, [id]);

  async function cambiar(postulacionId, estado, etiqueta) {
    setErr('');
    setOcupado(`${postulacionId}${estado}`);
    try {
      await api(`/api/postulaciones/${postulacionId}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) });
      toast(`Postulación ${etiqueta}.`);
      cargar();
    } catch (ex) { setErr(ex.message); toast(ex.message, false); }
    finally { setOcupado(null); }
  }

  if (err) return <p className="err-msg">{err}</p>;
  if (!r) return <p>Cargando ranking...</p>;

  return (
    <div className="space-y-4">
      <h2 className="page-title">Ranking — {r.convocatoria.titulo} ({r.total} {r.total === 1 ? 'postulado' : 'postulados'})</h2>
      <p className="help">Solo quienes se postularon a esta convocatoria, ordenados por KPI de convocatoria.</p>
      <div className="tbl-wrap">
        <table className="min-w-full tbl">
          <thead>
            <tr>
              <th className="p-2 text-left">Persona</th>
              <th className="p-2 text-right" title="Puntaje contra los requisitos: nivel, años, experiencia afín">KPI conv.</th>
              <th className="p-2 text-right" title="Calidad general del perfil (desempate)">Perfil %</th>
              <th className="p-2 text-right" title="Obligatorios cumplidos / totales (referencia)">Match</th>
              <th className="p-2 text-left">Clasif.</th>
              <th className="p-2 text-left">Estado</th>
              <th className="p-2 text-left">Acción</th>
            </tr>
          </thead>
          <tbody>
            {r.resultados.map((p) => (
              <tr key={p.id}>
                <td className="p-2"><button className="text-cyan-700 dark:text-cyan-400 underline" onClick={() => nav(`/personas/${p.id}`)}>{p.nombres} {p.apellidos}</button></td>
                <td className="p-2 text-right font-bold" title={(p.desglose?.por_requisito || []).map((x) => `${x.nombre}${x.obligatorio ? '★' : '○'}${x.nivel_minimo ? `≥${x.nivel_minimo}` : ''}: ${x.cumplido ? x.puntos : 0}`).join(' | ')}>{p.kpi_conv ?? p.score}</td>
                <td className="p-2 text-right">{p.kpi}</td>
                <td className="p-2 text-right">{p.match}%</td>
                <td className="p-2"><Badge valor={p.clasificacion} /></td>
                <td className="p-2">{p.estado_postulacion || '—'}</td>
                <td className="p-2">
                  {p.postulacion_id ? (
                    <span className="flex gap-1">
                      <button className="text-xs bg-green-600 dark:bg-green-500 text-white px-2 py-1 rounded" disabled={ocupado === `${p.postulacion_id}preseleccionado`} onClick={() => cambiar(p.postulacion_id, 'preseleccionado', 'aceptada')}>{ocupado === `${p.postulacion_id}preseleccionado` ? '…' : 'Aceptar'}</button>
                      <button className="text-xs bg-red-100 dark:bg-red-900 dark:text-red-100 text-red-700 px-2 py-1 rounded" disabled={ocupado === `${p.postulacion_id}descartado`} onClick={() => cambiar(p.postulacion_id, 'descartado', 'rechazada')}>{ocupado === `${p.postulacion_id}descartado` ? '…' : 'Rechazar'}</button>
                    </span>
                  ) : <span className="help">sin postulación</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
