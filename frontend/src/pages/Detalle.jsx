import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Badge } from '../components/TablaKPI';

export function Detalle() {
  const { id } = useParams();
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api(`/api/personas/${id}`).then(setD).catch((ex) => setErr(ex.message));
  }, [id]);

  if (err) return <p className="text-red-600 dark:text-red-400">{err}</p>;
  if (!d) return <p>Cargando...</p>;

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="page-title">{d.nombres} {d.apellidos}</h2>
        <Badge valor={d.clasificacion} />
        <span className="font-bold">Perfil {d.kpi}%</span>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{d.correo} · {d.telefono} · {d.direccion}</p>
      <div>
        <h3 className="section-title">Habilidades ({d.habilidades?.length})</h3>
        <ul className="list-disc ml-5 text-sm">
          {(d.habilidades || []).map((h) => <li key={h.id}>{h.nombre} — {h.nivel} — {h.anios_uso} años</li>)}
        </ul>
      </div>
      <div>
        <h3 className="section-title">Experiencias ({d.experiencias?.length})</h3>
        <ul className="list-disc ml-5 text-sm">
          {(d.experiencias || []).map((e) => <li key={e.id}>{e.empresa} · {e.cargo} ({e.tipo_trabajo})</li>)}
        </ul>
      </div>
      <div>
        <h3 className="section-title">Formaciones ({d.formaciones?.length})</h3>
        <ul className="list-disc ml-5 text-sm">
          {(d.formaciones || []).map((f) => <li key={f.id}>{f.titulo} — {f.institucion} ({f.nivel})</li>)}
        </ul>
      </div>
    </div>
  );
}
