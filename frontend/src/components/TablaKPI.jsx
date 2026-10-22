import { useCatalogos } from '../lib/catalogos';
import { Avatar, EmptyState, Pill } from './ui';
import { IconoUsuarios } from './Iconos';

export function Badge({ valor }) {
  const tono = valor === 'Alto' ? 'green' : valor === 'Medio' ? 'amber' : 'red';
  return <Pill tono={tono}>{valor}</Pill>;
}

export function TablaKPI({ filas, onVer }) {
  const catalogos = useCatalogos();
  const niveles = (catalogos && catalogos.niveles_tecnologia) || [];
  const nombreNivel = (orden) => {
    const n = niveles.find((x) => x.orden === orden);
    return n ? n.nombre : '—';
  };

  if (!filas.length) {
    return (
      <EmptyState
        icono={IconoUsuarios}
        titulo="Sin resultados"
        texto="Probá ajustar los filtros o la búsqueda para ver más personas."
      />
    );
  }

  return (
    <div className="tbl-wrap">
      <table className="min-w-full tbl">
        <thead>
          <tr>
            <th className="text-left">ID</th>
            <th className="text-left">Nombres</th>
            <th className="text-right" title="Calidad general del perfil">Perfil %</th>
            <th className="text-left">Clasif.</th>
            <th className="text-left">Lenguajes</th>
            <th className="text-right" title="Cantidad de experiencias laborales registradas">N.º exps.</th>
            <th className="text-right" title="Máximos años de uso en una tecnología">Años</th>
            <th className="text-right" title="Cantidad de tecnologías que domina">Habs</th>
            <th className="text-left" title="Nivel máximo alcanzado en alguna tecnología">Nivel máx</th>
            <th className="text-right"><span className="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.id}>
              <td className="text-xs tabular-nums text-slate-400 dark:text-slate-500">#{f.id}</td>
              <td>
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar nombre={`${f.nombres} ${f.apellidos}`} tamano="sm" />
                  <span className="truncate font-semibold">{f.nombres} {f.apellidos}</span>
                </div>
              </td>
              <td className="text-right font-bold tabular-nums">{f.kpi ?? f.score}</td>
              <td>{f.clasificacion ? <Badge valor={f.clasificacion} /> : '—'}</td>
              <td className="max-w-[15rem] truncate" title={(f.lenguajes || []).join(', ')}>
                {(f.lenguajes || []).join(', ') || '—'}
              </td>
              <td className="text-right tabular-nums">{f.total_experiencias ?? ''}</td>
              <td className="text-right tabular-nums">{f.anios_max ?? ''}</td>
              <td className="text-right tabular-nums">{f.total_habilidades ?? ''}</td>
              <td>{nombreNivel(f.nivel_max)}</td>
              <td className="text-right">
                {onVer ? (
                  <button
                    type="button"
                    className="link text-xs"
                    onClick={() => onVer(f)}
                    aria-label={`Ver el perfil de ${f.nombres} ${f.apellidos}`}
                  >
                    Ver
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
