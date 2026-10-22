// Componentes visuales reutilizables del frontend (sin dependencias externas).
import { IconoAlerta, IconoCheck, IconoInfo } from './Iconos';

const VARIANTES = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  success: 'btn-success',
  warning: 'btn-warning',
  accent: 'btn-accent'
};

const TAMANOS = {
  xs: 'px-2.5 py-1.5 text-xs',
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base'
};

export function Spinner({ className = 'h-4 w-4' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Boton({
  variante = 'secondary',
  tamano = 'md',
  cargando = false,
  icono: Icono,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={`btn ${VARIANTES[variante] || VARIANTES.secondary} ${TAMANOS[tamano] || TAMANOS.md} ${className}`}
      disabled={disabled || cargando}
      {...props}
    >
      {cargando ? <Spinner /> : Icono ? <Icono className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

export function Campo({ etiqueta, ayuda, error, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {etiqueta ? <span className="lab">{etiqueta}</span> : null}
      {children}
      {error ? <span className="err-msg mt-1 block">{error}</span> : null}
      {ayuda ? <span className="help mt-1 block">{ayuda}</span> : null}
    </label>
  );
}

const TONOS_PILL = {
  slate: 'pill-slate',
  cyan: 'pill-cyan',
  green: 'pill-green',
  emerald: 'pill-emerald',
  amber: 'pill-amber',
  red: 'pill-red',
  violet: 'pill-violet'
};

export function Pill({ tono = 'slate', punto = false, children, className = '' }) {
  return (
    <span className={`pill ${TONOS_PILL[tono] || TONOS_PILL.slate} ${className}`}>
      {punto ? <span className="pill-dot" /> : null}
      {children}
    </span>
  );
}

function hashTexto(texto) {
  let h = 0;
  for (let i = 0; i < texto.length; i += 1) h = (h * 31 + texto.charCodeAt(i)) % 360;
  return h;
}

const TAMANOS_AVATAR = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-20 w-20 text-2xl'
};

export function Avatar({ nombre = '', tamano = 'md', className = '' }) {
  const partes = String(nombre).trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const letras = partes.map((p) => p[0]).join('').toUpperCase() || '?';
  const tono = hashTexto(String(nombre) || '?');
  return (
    <span
      className={`avatar shrink-0 ${TAMANOS_AVATAR[tamano] || TAMANOS_AVATAR.md} ${className}`}
      style={{ '--av-h': tono }}
      aria-hidden="true"
    >
      {letras}
    </span>
  );
}

export function Progress({ valor = 0, max = 100, tono = 'cyan', etiqueta, className = '' }) {
  const numeroMax = Number(max) || 0;
  const pct = numeroMax > 0 ? Math.max(0, Math.min(100, (Number(valor) / numeroMax) * 100)) : 0;
  return (
    <div className={className}>
      <div className="progress" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <span className={`progress-fill progress-${tono}`} style={{ width: `${pct}%` }} />
      </div>
      {etiqueta ? <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">{etiqueta}</p> : null}
    </div>
  );
}

export function AnilloKPI({ valor = 0, max = 100, tamano = 104, etiqueta, clasificacion }) {
  const numero = Number(valor) || 0;
  const pct = Math.max(0, Math.min(1, numero / (Number(max) || 100)));
  const radio = 42;
  const circunferencia = 2 * Math.PI * radio;
  const color = clasificacion === 'Alto' ? '#10b981' : clasificacion === 'Medio' ? '#f59e0b' : '#06b6d4';
  return (
    <div className="relative shrink-0" style={{ width: tamano, height: tamano }}>
      <svg viewBox="0 0 100 100" width={tamano} height={tamano} className="-rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={radio} fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-200 dark:text-slate-800" />
        <circle
          cx="50"
          cy="50"
          r={radio}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${circunferencia * pct} ${circunferencia}`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-xl font-extrabold leading-none tabular-nums">{Math.round(numero)}</p>
          {etiqueta ? <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{etiqueta}</p> : null}
        </div>
      </div>
    </div>
  );
}

const TONOS_STAT = {
  cyan: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
};

export function StatCard({ valor, etiqueta, icono: Icono, tono = 'cyan', hint, className = '' }) {
  return (
    <div className={`card card-hover p-4 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-2xl font-extrabold leading-tight tracking-tight tabular-nums sm:text-3xl">{valor ?? 0}</p>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{etiqueta}</p>
        </div>
        {Icono ? (
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${TONOS_STAT[tono] || TONOS_STAT.cyan}`}>
            <Icono className="h-5 w-5" />
          </span>
        ) : null}
      </div>
      {hint ? <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function Tabs({ items, valor, onChange, className = '' }) {
  return (
    <div className={`tabs ${className}`} role="tablist">
      {items.map((item) => (
        <button
          key={item.valor}
          type="button"
          role="tab"
          aria-selected={valor === item.valor}
          onClick={() => onChange(item.valor)}
          className={`tab ${valor === item.valor ? 'tab-active' : ''}`}
        >
          {item.etiqueta}
          {item.contador !== undefined ? <span className="tab-count">{item.contador}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ icono: Icono, titulo, texto, children, className = '' }) {
  return (
    <div className={`empty ${className}`}>
      {Icono ? (
        <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          <Icono className="h-6 w-6" />
        </span>
      ) : null}
      {titulo ? <p className="font-semibold">{titulo}</p> : null}
      {texto ? <p className="help mx-auto mt-1 max-w-md">{texto}</p> : null}
      {children ? <div className="mt-3 flex flex-wrap justify-center gap-2">{children}</div> : null}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonTabla({ filas = 5 }) {
  return (
    <div className="card space-y-2 p-4">
      {Array.from({ length: filas }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-10" />
        </div>
      ))}
    </div>
  );
}

const AVISOS = {
  info: { clase: 'aviso-info', Icono: IconoInfo },
  warn: { clase: 'aviso-warn', Icono: IconoAlerta },
  error: { clase: 'aviso-error', Icono: IconoAlerta },
  ok: { clase: 'aviso-ok', Icono: IconoCheck }
};

export function Aviso({ tono = 'info', titulo, children, icono: Icono, className = '' }) {
  const cfg = AVISOS[tono] || AVISOS.info;
  const IconoFinal = Icono || cfg.Icono;
  return (
    <div className={`aviso ${cfg.clase} ${className}`}>
      <IconoFinal className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 text-sm">
        {titulo ? <p className="font-semibold">{titulo}</p> : null}
        <div className={titulo ? 'mt-0.5' : ''}>{children}</div>
      </div>
    </div>
  );
}

export function DialogoConfirmar({
  abierto,
  titulo,
  texto,
  confirmar = 'Confirmar',
  ocupado = false,
  tono = 'danger',
  onConfirmar,
  onCancelar
}) {
  if (!abierto) return null;
  return (
    <div className="dialog-backdrop" role="presentation" onClick={onCancelar}>
      <div
        className="dialog card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialogo-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
            <IconoAlerta className="h-5 w-5" />
          </span>
          <div>
            <h2 id="dialogo-titulo" className="section-title">{titulo}</h2>
            {texto ? <p className="help mt-1">{texto}</p> : null}
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Boton variante="secondary" onClick={onCancelar} disabled={ocupado}>Cancelar</Boton>
          <Boton variante={tono} onClick={onConfirmar} cargando={ocupado}>{confirmar}</Boton>
        </div>
      </div>
    </div>
  );
}

export function PageHeader({ titulo, subtitulo, icono: Icono, children }) {
  return (
    <div className="page-head">
      <div className="flex min-w-0 items-start gap-3">
        {Icono ? (
          <span className="hidden h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-600 text-white shadow-lg shadow-brand-500/25 sm:grid">
            <Icono className="h-5 w-5" />
          </span>
        ) : null}
        <div className="min-w-0">
          <h1 className="page-title">{titulo}</h1>
          {subtitulo ? <p className="help mt-1 max-w-2xl">{subtitulo}</p> : null}
        </div>
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}

export function Seccion({ titulo, icono: Icono, extra, children, className = '' }) {
  return (
    <section className={`card p-5 ${className}`}>
      {titulo || extra ? (
        <div className="mb-3 flex items-center gap-2">
          {Icono ? (
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
              <Icono className="h-4 w-4" />
            </span>
          ) : null}
          {titulo ? <h2 className="section-title flex-1">{titulo}</h2> : null}
          {extra}
        </div>
      ) : null}
      {children}
    </section>
  );
}
