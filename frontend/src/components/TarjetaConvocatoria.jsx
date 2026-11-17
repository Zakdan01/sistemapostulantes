// Tarjeta publica de convocatoria: banner por tipo y requisitos separados en
// obligatorios y deseables. La API manda los deseables con el sufijo " (deseable)".
import { Pill } from './ui';
import { IconoCalendario, IconoCheck, IconoMaletin, IconoObjetivo, IconoReloj } from './Iconos';

const ESTILOS = {
  'Pasantía': { Icono: IconoObjetivo, banner: 'from-cyan-500 to-sky-600' },
  'Momentáneo': { Icono: IconoReloj, banner: 'from-amber-500 to-orange-600' },
  'Mensual': { Icono: IconoCalendario, banner: 'from-violet-500 to-fuchsia-600' },
  'De planta': { Icono: IconoMaletin, banner: 'from-emerald-500 to-teal-600' }
};

const OTRO = { Icono: IconoMaletin, banner: 'from-slate-500 to-slate-700' };
const SUFIJO = ' (deseable)';

function separar(requisitos = []) {
  return {
    obligatorios: requisitos.filter((r) => !r.endsWith(SUFIJO)),
    deseables: requisitos.filter((r) => r.endsWith(SUFIJO)).map((r) => r.slice(0, -SUFIJO.length))
  };
}

function Chips({ titulo, items, obligatorio }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{titulo}</p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {items.map((r) => (
          <span
            key={r}
            className={obligatorio
              ? 'inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-800 ring-1 ring-brand-200 dark:bg-brand-950 dark:text-brand-200 dark:ring-brand-800'
              : 'inline-flex items-center rounded-lg border border-dashed border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 dark:border-slate-600 dark:text-slate-300'}
          >
            {obligatorio ? <IconoCheck className="h-3 w-3 shrink-0" /> : null}
            <span className="capitalize">{r}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function TarjetaConvocatoria({ c, compacta = false, className = '' }) {
  const { Icono, banner } = ESTILOS[c.tipo] || OTRO;
  const { obligatorios, deseables } = separar(c.requisitos);

  return (
    <article className={`card card-hover flex flex-col overflow-hidden ${className}`}>
      <div className={`flex items-center gap-3 bg-gradient-to-br px-4 ${banner} ${compacta ? 'py-3' : 'py-4'}`}>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/20 text-white ring-1 ring-white/30">
          <Icono className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-white/80">Convocatoria</span>
          <span className="block truncate text-sm font-bold text-white">{c.tipo || 'General'}</span>
        </span>
        <span className="ml-auto shrink-0 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white ring-1 ring-white/30">
          {c.vacantes} {c.vacantes === 1 ? 'vacante' : 'vacantes'}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="text-base font-bold leading-snug">{c.titulo}</h3>

        <div className="flex flex-wrap gap-1.5">
          <Pill tono="slate">{c.anios_min} años mín.</Pill>
          {c.disponibilidad ? <Pill tono="slate">{c.disponibilidad}</Pill> : null}
        </div>

        <div className="mt-auto space-y-2.5">
          {obligatorios.length ? <Chips titulo="Obligatorios" items={obligatorios} obligatorio /> : null}
          {deseables.length ? <Chips titulo="Deseables" items={deseables} /> : null}
          {!obligatorios.length && !deseables.length ? (
            <p className="help">Sin requisitos técnicos: evalúa tu perfil general.</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
