import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Badge } from '../components/TablaKPI';
import { AnilloKPI, Avatar, Aviso, Boton, PageHeader, Pill, Seccion, StatCard } from '../components/ui';
import {
  IconoChispa,
  IconoCorreo,
  IconoDocumento,
  IconoEnlace,
  IconoFlechaIzq,
  IconoMaletin,
  IconoTelefono,
  IconoUbicacion,
  IconoUsuario
} from '../components/Iconos';

function urlSegura(valor) {
  const texto = String(valor || '').trim();
  if (!texto) return '';
  return /^https?:\/\//i.test(texto) ? texto : `https://${texto}`;
}

function fechaCorta(valor) {
  if (!valor) return '';
  const [anio, mes, dia] = String(valor).slice(0, 10).split('-');
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : String(valor).slice(0, 10);
}

function capitalizar(texto) {
  const s = String(texto || '').replace(/_/g, ' ');
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

function tonoNivel(nivel) {
  const n = String(nivel || '').toLowerCase();
  if (n === 'experto' || n === 'avanzado') return 'green';
  if (n === 'intermedio') return 'cyan';
  if (n === 'basico' || n === 'básico') return 'amber';
  return 'slate';
}

function rango(e) {
  const inicio = fechaCorta(e.fecha_inicio);
  const fin = e.es_actual ? 'Actual' : fechaCorta(e.fecha_fin);
  if (!inicio && !fin) return '';
  return [inicio, fin || '—'].filter(Boolean).join(' — ');
}

export function Detalle() {
  const { id } = useParams();
  const nav = useNavigate();
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api(`/api/personas/${id}`)
      .then((r) => { setD(r); setErr(''); })
      .catch((ex) => setErr(ex.message));
  }, [id]);

  if (err) {
    return (
      <div className="space-y-4">
        <PageHeader titulo="Perfil del postulante" icono={IconoUsuario}>
          <Boton variante="ghost" icono={IconoFlechaIzq} onClick={() => nav(-1)}>Volver</Boton>
        </PageHeader>
        <Aviso tono="error" titulo="No se pudo cargar el perfil">{err}</Aviso>
      </div>
    );
  }

  if (!d) {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="skeleton h-8 w-72 max-w-full" />
          <div className="skeleton h-4 w-96 max-w-full" />
        </div>
        <div className="skeleton h-44" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton h-24" />)}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="skeleton h-72" />
          <div className="skeleton h-72" />
        </div>
      </div>
    );
  }

  const nombre = [d.nombres, d.apellidos].filter(Boolean).join(' ') || `Persona #${d.id}`;
  const habilidades = d.habilidades || [];
  const experiencias = d.experiencias || [];
  const formaciones = d.formaciones || [];
  const enlaces = [
    { valor: d.linkedin, etiqueta: 'LinkedIn' },
    { valor: d.github, etiqueta: 'GitHub' },
    { valor: d.portafolio_url, etiqueta: 'Portafolio' }
  ].filter((x) => x.valor);

  return (
    <div className="space-y-5">
      <PageHeader
        titulo={nombre}
        subtitulo={`Perfil de postulante${d.correo ? ` · ${d.correo}` : ''}`}
        icono={IconoUsuario}
      >
        <Boton variante="ghost" icono={IconoFlechaIzq} onClick={() => nav(-1)}>Volver</Boton>
        {d.clasificacion ? <Badge valor={d.clasificacion} /> : null}
        {d.disponibilidad ? <Pill tono="cyan" punto>{capitalizar(d.disponibilidad)}</Pill> : null}
      </PageHeader>

      <section className="card card-accent overflow-hidden">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
          <Avatar nombre={nombre} tamano="xl" />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-extrabold tracking-tight">{nombre}</p>
            <p className="help mt-0.5">Persona #{d.id}{d.actualizado_en ? ` · actualizado el ${fechaCorta(d.actualizado_en)}` : ''}</p>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {d.correo ? (
                <span className="inline-flex min-w-0 items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <IconoCorreo className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate">{d.correo}</span>
                </span>
              ) : null}
              {d.telefono ? (
                <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <IconoTelefono className="h-4 w-4 shrink-0 text-slate-400" />
                  {d.telefono}
                </span>
              ) : null}
              {d.direccion ? (
                <span className="inline-flex min-w-0 items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <IconoUbicacion className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate">{d.direccion}</span>
                </span>
              ) : null}
              {enlaces.map((e) => (
                <a
                  key={e.etiqueta}
                  className="link inline-flex items-center gap-1.5"
                  href={urlSegura(e.valor)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <IconoEnlace className="h-4 w-4" />
                  {e.etiqueta}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 sm:flex-col sm:items-center">
            <AnilloKPI valor={d.kpi || 0} etiqueta="Perfil" clasificacion={d.clasificacion} />
            <p className="max-w-[7rem] text-center text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Se usa solo para desempatar el ranking.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard valor={habilidades.length} etiqueta="Habilidades" hint="Tecnologías declaradas" icono={IconoChispa} tono="cyan" />
        <StatCard valor={experiencias.length} etiqueta="Experiencias" hint="Trayectoria laboral" icono={IconoMaletin} tono="violet" />
        <StatCard valor={formaciones.length} etiqueta="Formaciones" hint="Estudios y certificaciones" icono={IconoDocumento} tono="emerald" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Seccion titulo="Habilidades" icono={IconoChispa} extra={<Pill tono="cyan">{habilidades.length}</Pill>}>
          {habilidades.length === 0 ? (
            <p className="help">Sin habilidades declaradas.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {habilidades.map((h) => (
                <li key={h.id || h.nombre} className="flex flex-wrap items-center gap-2 py-2.5 first:pt-0 last:pb-0">
                  <span className="min-w-0 flex-1 truncate font-semibold">{h.nombre}</span>
                  <Pill tono={tonoNivel(h.nivel)}>{h.nivel || 'sin nivel'}</Pill>
                  <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                    {Number(h.anios_uso) || 0} año{Number(h.anios_uso) === 1 ? '' : 's'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Seccion>

        <Seccion titulo="Experiencias" icono={IconoMaletin} extra={<Pill tono="violet">{experiencias.length}</Pill>}>
          {experiencias.length === 0 ? (
            <p className="help">Sin experiencias registradas.</p>
          ) : (
            <ol className="space-y-3">
              {experiencias.map((e) => (
                <li key={e.id || `${e.empresa}-${e.cargo}`} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold">{e.cargo || 'Cargo sin especificar'}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{e.empresa || 'Empresa sin especificar'}</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {e.tipo_trabajo ? <Pill tono="slate">{capitalizar(e.tipo_trabajo)}</Pill> : null}
                      {e.es_actual ? <Pill tono="green" punto>Actual</Pill> : null}
                    </div>
                  </div>
                  {rango(e) ? <p className="help mt-1">{rango(e)}</p> : null}
                  {e.descripcion ? (
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{e.descripcion}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </Seccion>
      </div>

      <Seccion titulo="Formaciones" icono={IconoDocumento} extra={<Pill tono="emerald">{formaciones.length}</Pill>}>
        {formaciones.length === 0 ? (
          <p className="help">Sin formaciones registradas.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {formaciones.map((f) => (
              <article key={f.id || `${f.titulo}-${f.institucion}`} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <p className="font-semibold">{f.titulo || 'Formación sin título'}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{f.institucion || 'Institución sin especificar'}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {f.nivel ? <Pill tono="emerald">{capitalizar(f.nivel)}</Pill> : null}
                  {f.fecha_inicio || f.fecha_fin ? (
                    <span className="help">{fechaCorta(f.fecha_inicio) || '—'} — {fechaCorta(f.fecha_fin) || '—'}</span>
                  ) : null}
                </div>
                {f.certificado_url ? (
                  <a className="link mt-2 inline-flex items-center gap-1.5 text-xs" href={urlSegura(f.certificado_url)} target="_blank" rel="noreferrer">
                    <IconoEnlace className="h-3.5 w-3.5" />
                    Ver certificado
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </Seccion>
    </div>
  );
}
