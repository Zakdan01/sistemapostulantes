import { useEffect, useState } from 'react';
import { api } from '../lib/api';

// Solo admin: explica el cálculo del puntaje con los valores vivos de configuración.
export function ComoSeCalcula() {
  const [cfg, setCfg] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api('/api/configuracion').then(setCfg).catch((ex) => setErr(ex.message));
  }, []);

  if (err) return <p className="err-msg">{err}</p>;
  if (!cfg) return <p>Cargando configuración…</p>;

  const pesos = [
    ['Experiencia', cfg.peso_experiencia, 'tiene experiencia o años máx ≥ referencia'],
    ['Formación', cfg.peso_formacion, '≥1 formación'],
    ['Tecnologías', cfg.peso_tecnologias, '≥1 habilidad'],
    ['Nivel', cfg.peso_nivel, '≥1 nivel intermedio o más'],
    ['Actualidad', cfg.peso_actualidad, 'experiencia actual o evento']
  ];
  const niveles = [
    ['experto', '100% del valor del requisito'],
    ['avanzado', '75%'],
    ['intermedio', '50%'],
    ['básico', '25%'],
    ['principiante', '10%']
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h2 className="page-title">Cómo se calcula el puntaje</h2>

      <div className="card p-4">
        <h3 className="font-bold mb-2">KPI de convocatoria (el que ordena el ranking, 0–100)</h3>
        <p className="text-sm">Cada requisito reparte puntos según obligatoriedad (obligatoria ×{cfg.mult_obligatorio}, deseable ×{cfg.mult_deseable}), nivel y años de uso (tope {cfg.tope_anios_req} años). Más experiencia afín (+{cfg.peso_exp_afin}) y disponibilidad coincidente (+10). Sin filtro duro: quien no cumple nada puntúa bajo y queda al fondo.</p>
        <p className="text-sm mt-2"><b>Nivel mínimo por requisito</b> (parte de la calificación): cada requisito exige un nivel mínimo (por defecto <b>básico</b>). Quien está por debajo puntúa <b>0 en ese requisito</b> pero sigue en el ranking al fondo — no se le expulsa. Ejemplo: convocatoria que exige <b>python ≥ avanzado</b>: un intermedio puntúa 0 ahí aunque sepa todo lo demás; un avanzado puntúa completo.</p>
        <div className="tbl-wrap mt-2">
          <table className="min-w-full tbl">
            <thead><tr><th className="p-2 text-left">Nivel</th><th className="p-2 text-right">Vale</th></tr></thead>
            <tbody>
              {niveles.map(([n, v]) => <tr key={n}><td className="p-2">{n}</td><td className="p-2 text-right">{v}</td></tr>)}
            </tbody>
          </table>
        </div>
        <p className="help mt-2">Ejemplo: convocatoria que exige c++. A (todo menos c++, perfil 100) → KPI conv ≈15. B (solo c++ básico 1 año) → ≈16.7. B queda arriba: importa el encaje, no el perfil.</p>
      </div>

      <div className="card p-4">
        <h3 className="font-bold mb-2">Perfil completo % (calidad general, solo desempata)</h3>
        <div className="tbl-wrap mt-2">
          <table className="min-w-full tbl">
            <thead><tr><th className="p-2 text-left">Criterio</th><th className="p-2 text-right">Peso</th><th className="p-2 text-left">Cumple si</th></tr></thead>
            <tbody>
              {pesos.map(([k, v, c]) => <tr key={k}><td className="p-2">{k}</td><td className="p-2 text-right">{v}</td><td className="p-2">{c}</td></tr>)}
            </tbody>
          </table>
        </div>
        <p className="help mt-2">Clasificación: ≥{cfg.umbral_alto} Alto · ≥{cfg.umbral_medio} Medio · si no, Bajo. Referencia de años: {cfg.anios_referencia}.</p>
      </div>

      <div className="card p-4">
        <h3 className="font-bold mb-2">Pipeline y match de referencia</h3>
        <p className="text-sm">Convocatoria: pendiente → abierta (solo admin) → cerrada o rechazada. Postulación: postulado → preseleccionado → contratado (o descartado). Match = obligatorios cumplidos / totales (columna informativa).</p>
      </div>
    </div>
  );
}
