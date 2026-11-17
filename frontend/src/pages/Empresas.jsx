import { Link } from 'react-router-dom';
import { Pill } from '../components/ui';
import { IlustracionEmpresas } from '../components/Ilustraciones';
import { IconoCheck, IconoChispa, IconoObjetivo, IconoUsuarios } from '../components/Iconos';

const BENEFICIOS = [
  {
    icono: IconoUsuarios,
    titulo: 'Lista viva, no un buzón',
    texto: 'Cada convocatoria arma sola el padrón de candidatos disponibles y lo ordena por encaje.'
  },
  {
    icono: IconoChispa,
    titulo: 'Puntaje explicado',
    texto: 'El KPI dice por qué alguien está arriba: cobertura de requisitos, nivel, años y disponibilidad.'
  },
  {
    icono: IconoObjetivo,
    titulo: 'Pipeline con cupos',
    texto: 'Tomar, contactar, preseleccionar y contratar con transiciones claras. Al llenar los cupos, cierra sola.'
  }
];

const PASOS = [
  'Nos contás el perfil que buscás y los requisitos del puesto.',
  'Cargamos la convocatoria con su umbral de enlistado y la publicamos.',
  'Recibís el ranking explicado y avanzás con el pipeline hasta la contratación.'
];

export function Empresas() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:pt-16">
      <section className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Pill tono="violet">Para empresas</Pill>
          <h1 className="page-title mt-4 lg:text-5xl">Publicá tu convocatoria y recibí el ranking listo.</h1>
          <p className="help mt-4 max-w-xl text-base">
            Cargamos tu búsqueda en el sistema y los postulantes con perfil completo entran solos en la lista,
            ordenados por encaje con tus requisitos. Vos solo decidís a quién contactar.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link className="btn btn-primary px-5 py-3 text-base" to="/contacto">
              Quiero publicar una convocatoria
            </Link>
            <Link className="btn btn-secondary px-5 py-3 text-base" to="/interno/login">Acceso del equipo</Link>
          </div>
          <p className="help mt-3">
            El alta y la publicación las hace el equipo de selección: no hay autoservicio todavía.
          </p>
        </div>

        <div className="space-y-4">
          <IlustracionEmpresas />
          <div className="card p-5">
            <p className="section-title">Qué incluye</p>
            <ul className="mt-4 space-y-4">
              {BENEFICIOS.map((b) => (
                <li key={b.titulo} className="flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400">
                    <b.icono className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{b.titulo}</p>
                    <p className="help mt-0.5">{b.texto}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-14">
        <p className="section-title">Cómo se publica</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {PASOS.map((texto, i) => (
            <div key={texto} className="card p-4">
              <span className="pill pill-cyan">Paso {i + 1}</span>
              <p className="mt-3 text-sm">{texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card mt-12 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="section-title flex items-center gap-2">
            <IconoCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            ¿Querés sumar un puesto?
          </p>
          <p className="help mt-1 max-w-xl">
            Escribinos con el perfil que necesitás y coordinamos la publicación de la convocatoria.
            También podés acercarte a nuestra oficina.
          </p>
        </div>
        <Link className="btn btn-primary px-5 py-3 text-base" to="/contacto">
          Contactar al equipo
        </Link>
      </section>
    </div>
  );
}
