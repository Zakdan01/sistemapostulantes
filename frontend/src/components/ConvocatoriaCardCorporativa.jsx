// Tarjeta del sitio corporativo. Solo consume campos públicos: la API no expone
// umbral, correos ni conteos internos.
import { cuposCubiertos, separarRequisitos } from '../lib/corporativo';

export function ConvocatoriaCardCorporativa({ c }) {
  const contratados = cuposCubiertos(c);
  const cupos = Number(c.cupos) || 0;
  const pct = cupos ? Math.min(100, Math.round((contratados / cupos) * 100)) : 0;
  const { obligatorios, deseables } = separarRequisitos(c.requisitos);
  const requisitos = [...obligatorios, ...deseables.map((r) => `${r} (deseable)`)];
  const estado = String(c.estado || 'abierta').toLowerCase();

  return (
    <article className="conv-card reveal">
      <div className="conv-top">
        <h3>{c.titulo}</h3>
        <span className={`pill-estado pe-${estado}`}>{estado}</span>
      </div>

      <div className="conv-tags">
        <span>{c.tipo}</span>
        <span>{c.anios_min} años mín.</span>
        {c.disponibilidad ? <span>{c.disponibilidad}</span> : null}
      </div>

      <p className="conv-req">Requiere: {requisitos.length ? requisitos.join(', ') : 'perfil general'}</p>

      <div className="conv-progress">
        <span>{contratados}/{cupos} cupos cubiertos</span>
        <div className="progress-track">
          <i className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="conv-foot">
        <span><b>{c.vacantes}</b> {c.vacantes === 1 ? 'vacante disponible' : 'vacantes disponibles'}</span>
        <span>Enlistado automático</span>
      </div>
    </article>
  );
}
