const NIVEL_NOMBRE = { 1: 'principiante', 2: 'basico', 3: 'intermedio', 4: 'avanzado', 5: 'experto' };

export function Badge({ valor }) {
  const color = valor === 'Alto'
    ? 'bg-green-100 dark:bg-green-900 dark:bg-green-900 dark:text-green-100 text-green-800'
    : valor === 'Medio'
      ? 'bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-100 text-yellow-800'
      : 'bg-red-100 dark:bg-red-900 dark:text-red-100 text-red-800';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{valor}</span>;
}

export function TablaKPI({ filas, onVer }) {
  if (!filas.length) return <p className="text-slate-500 dark:text-slate-400">Sin resultados.</p>;
  return (
    <div className="tbl-wrap">
      <table className="min-w-full tbl">
        <thead>
          <tr>
            <th className="p-2 text-left">ID</th>
            <th className="p-2 text-left">Nombres</th>
            <th className="p-2 text-right" title="Calidad general del perfil">Perfil %</th>
            <th className="p-2 text-left">Clasif.</th>
            <th className="p-2 text-left">Lenguajes</th>
            <th className="p-2 text-right" title="Cantidad de experiencias laborales registradas">N.º exps.</th>
            <th className="p-2 text-right" title="Máximos años de uso en una tecnología">Años</th>
            <th className="p-2 text-right" title="Cantidad de tecnologías que domina">Habs</th>
            <th className="p-2 text-left" title="Nivel máximo alcanzado en alguna tecnología">Nivel máx</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.id} className="border-t hover:bg-slate-50 dark:hover:bg-slate-800">
              <td className="p-2">{f.id}</td>
              <td className="p-2">{f.nombres} {f.apellidos}</td>
              <td className="p-2 text-right font-bold">{f.kpi ?? f.score}</td>
              <td className="p-2">{f.clasificacion ? <Badge valor={f.clasificacion} /> : '—'}</td>
              <td className="p-2">{(f.lenguajes || []).join(', ')}</td>
              <td className="p-2 text-right">{f.total_experiencias ?? ''}</td>
              <td className="p-2 text-right">{f.anios_max ?? ''}</td>
              <td className="p-2 text-right">{f.total_habilidades ?? ''}</td>
              <td className="p-2">{NIVEL_NOMBRE[f.nivel_max] || '—'}</td>
              <td className="p-2 text-right">
                {onVer && <button className="text-cyan-700 dark:text-cyan-400 underline" onClick={() => onVer(f)}>Ver</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
