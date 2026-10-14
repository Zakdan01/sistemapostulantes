import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export function MisPostulaciones() {
  const [filas, setFilas] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    api('/api/mis-postulaciones').then(setFilas).catch((ex) => setErr(ex.message));
  }, []);

  if (err) return <p className="text-red-600 dark:text-red-400">{err}</p>;

  return (
    <div className="space-y-4">
      <h2 className="page-title">Mis postulaciones ({filas.length})</h2>
      {filas.length === 0 && <p className="help">Aún no te postulaste a ninguna convocatoria.</p>}
      <div className="grid gap-3">
        {filas.map((p) => (
          <div key={p.id} className="card p-4 flex items-center gap-3">
            <div className="flex-1">
              <p className="font-bold">{p.convocatoria_titulo} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({p.convocatoria_estado})</span></p>
              <p className="text-sm text-slate-500 dark:text-slate-400">KPI conv. al postular: {p.kpi_al_postular} · Match: {p.match_pct}%</p>
            </div>
            <span className="text-xs bg-cyan-100 dark:bg-cyan-900 dark:text-cyan-100 text-cyan-900 px-2 py-1 rounded">{p.estado}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
