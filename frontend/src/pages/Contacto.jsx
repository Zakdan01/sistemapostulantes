import { Link } from 'react-router-dom';
import { EMPRESA } from '../lib/empresa';
import { Pill } from '../components/ui';
import { IconoCorreo, IconoReloj, IconoTelefono, IconoUbicacion } from '../components/Iconos';

const tel = EMPRESA.telefono.replace(/[^\d+]/g, '');

const DATOS = [
  { Icono: IconoUbicacion, etiqueta: 'Oficina', valor: EMPRESA.direccion, href: EMPRESA.mapa, accion: 'Cómo llegar' },
  { Icono: IconoTelefono, etiqueta: 'Teléfono', valor: EMPRESA.telefono, href: `tel:${tel}` },
  { Icono: IconoCorreo, etiqueta: 'Correo', valor: EMPRESA.correo, href: `mailto:${EMPRESA.correo}` },
  { Icono: IconoReloj, etiqueta: 'Horario de atención', valor: EMPRESA.horario }
];

// Datos de la consultora para empresas: donde acercarse y como escribirnos.
export function Contacto() {
  const asunto = encodeURIComponent('Quiero publicar una convocatoria');

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:pt-16">
      <Pill tono="violet">Contacto</Pill>
      <h1 className="page-title mt-4 lg:text-5xl">Hablemos de tu próxima búsqueda.</h1>
      <p className="help mt-4 max-w-2xl text-base">
        Contanos qué perfil necesitás y coordinamos la publicación de la convocatoria.
        Podés escribirnos, llamarnos o pasar por la oficina.
      </p>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="card p-5 sm:p-6" aria-label="Datos de contacto">
          <p className="section-title">Dónde estamos</p>
          <ul className="mt-4 space-y-4">
            {DATOS.map((d) => (
              <li key={d.etiqueta} className="flex gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  <d.Icono className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{d.etiqueta}</p>
                  {d.href ? (
                    <a
                      className="link text-sm font-semibold"
                      href={d.href}
                      target={d.href.startsWith('http') ? '_blank' : undefined}
                      rel={d.href.startsWith('http') ? 'noreferrer' : undefined}
                    >
                      {d.valor}
                    </a>
                  ) : (
                    <p className="text-sm font-semibold">{d.valor}</p>
                  )}
                  {d.accion ? <p className="help mt-0.5">{d.accion} en el mapa</p> : null}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card flex flex-col gap-4 p-5 sm:p-6" aria-label="Escribir al equipo">
          <div>
            <p className="section-title">¿Querés publicar un puesto?</p>
            <p className="help mt-1">
              Mandanos el perfil buscado y los requisitos; te respondemos en horario de oficina
              con el paso siguiente.
            </p>
          </div>
          <div className="mt-auto flex flex-wrap gap-2">
            <a className="btn btn-primary px-5 py-3 text-base" href={`mailto:${EMPRESA.correo}?subject=${asunto}`}>
              Escribirnos
            </a>
            <a className="btn btn-secondary px-5 py-3 text-base" href={`tel:${tel}`}>Llamarnos</a>
          </div>
          <p className="help">
            ¿Todavía no conocés el servicio? <Link className="link" to="/empresas">Mirá cómo funciona para empresas</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
