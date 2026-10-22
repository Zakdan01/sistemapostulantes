import { TONOS, ETIQUETAS } from '../lib/estados';
import { Pill } from './ui';

// Badge del estado del candidato en la seleccion (tomado/contactado/preseleccionado/...).
export function EstadoBadge({ estado }) {
  if (!estado) return <span className="help">—</span>;
  return (
    <Pill tono={TONOS[estado] || 'slate'} punto>
      {ETIQUETAS[estado] || estado}
    </Pill>
  );
}
