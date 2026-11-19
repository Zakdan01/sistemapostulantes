import { Link } from 'react-router-dom';
import { Icono } from '../components/IconosCorporativos';

const PASOS = [
  { numero: '01', titulo: 'Recibimos', texto: 'Nos contás el puesto y el perfil que buscás, por correo o directamente en la plataforma.' },
  { numero: '02', titulo: 'Registramos', texto: 'Cargamos la convocatoria con requisitos, cupos, disponibilidad y umbral de enlistado.' },
  { numero: '03', titulo: 'Enlistamos', texto: 'El sistema ordena a los candidatos disponibles por afinidad con tus requisitos.' },
  { numero: '04', titulo: 'Acompañamos', texto: 'Seguimos cada etapa hasta la contratación y cerramos al cubrir los cupos.' }
];

export function Empresas() {
  return (
    <>
      <section className="section">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow eyebrow-soft">Para empresas</span>
            <h1>Publicá y cubrí con confianza</h1>
            <p>Definí el perfil, los cupos y el umbral. Nosotros registramos a los postulantes y armamos la lista ordenada por afinidad con tu convocatoria.</p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/contacto">Enviar una convocatoria <Icono nombre="arrow" /></Link>
              <Link className="btn btn-secondary" to="/interno/login">Acceso del equipo</Link>
            </div>
          </div>

          <div className="split">
            <article className="split-card split-empresas reveal">
              <span className="eyebrow eyebrow-soft">Para empresas</span>
              <h2>Publicá y cubrí con confianza</h2>
              <p>Definí el perfil, los cupos y el umbral. Nosotros registramos a los postulantes y armamos la lista ordenada por afinidad con tu convocatoria.</p>
              <ul className="check-list">
                <li><Icono nombre="check" /> Requisitos por tecnología y nivel</li>
                <li><Icono nombre="check" /> Control de cupos y cierre automático</li>
                <li><Icono nombre="check" /> Bitácora de cada movimiento</li>
              </ul>
              <Link className="btn btn-primary" to="/contacto">Ir a la plataforma <Icono nombre="arrow" /></Link>
            </article>
            <article className="split-card split-postulantes reveal">
              <span className="eyebrow eyebrow-soft">Para postulantes</span>
              <h2>Tu perfil trabaja por vos</h2>
              <p>Completá tu perfil una sola vez. El sistema te incluye automáticamente en las convocatorias donde cumplís el umbral y te muestra tu posición.</p>
              <ul className="check-list">
                <li><Icono nombre="check" /> Sin formularios por cada puesto</li>
                <li><Icono nombre="check" /> KPI y motivo de exclusión visibles</li>
                <li><Icono nombre="check" /> Seguimiento de tu estado</li>
              </ul>
              <Link className="btn btn-accent" to="/registro">Registrarme <Icono nombre="arrow" /></Link>
            </article>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow eyebrow-soft">Cómo trabajamos</span>
            <h2>Cuatro pasos, cero fricción</h2>
            <p>Un flujo corto y predecible para empresas y postulantes.</p>
          </div>
          <ol className="timeline">
            {PASOS.map((p) => (
              <li className="reveal" key={p.numero}>
                <span className="paso">{p.numero}</span>
                <div><h3>{p.titulo}</h3><p>{p.texto}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-cta reveal">
            <span>¿Querés sumar un puesto? Escribinos con el perfil que necesitás y coordinamos la publicación de la convocatoria.</span>
            <div className="cta-acciones">
              <Link className="btn btn-secondary btn-sm" to="/convocatorias">Ver convocatorias abiertas</Link>
              <Link className="btn btn-primary btn-sm" to="/contacto">Contactar al equipo <Icono nombre="arrow" /></Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
