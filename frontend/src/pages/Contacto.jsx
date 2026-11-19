import { Link } from 'react-router-dom';
import { EMPRESA } from '../lib/empresa';
import { Icono } from '../components/IconosCorporativos';
import { FormularioConvocatoriaCorporativo } from '../components/FormularioConvocatoriaCorporativo';

export function Contacto() {
  return (
    <section className="section section-contacto">
      <div className="container contacto-grid">
        <div className="contacto-copy reveal">
          <span className="eyebrow eyebrow-soft">Contacto</span>
          <h1>Contanos qué necesitás cubrir</h1>
          <p>Enviamos tu pedido por correo con todos los datos y lo registramos en la plataforma para arrancar el proceso.</p>
          <div className="contacto-datos">
            <div><Icono nombre="mail" /><span><b>Correo</b> {EMPRESA.correo}</span></div>
            <div><Icono nombre="pin" /><span><b>Oficina</b> {EMPRESA.direccion}</span></div>
            <div><Icono nombre="clock" /><span><b>Horario</b> {EMPRESA.horario}</span></div>
          </div>
          <div className="hero-actions">
            <a className="btn btn-secondary" href={`mailto:${EMPRESA.correo}`}>Escribirnos directamente</a>
            <Link className="btn btn-ghost" to="/empresas">Cómo trabajamos <Icono nombre="arrow" /></Link>
          </div>
        </div>
        <FormularioConvocatoriaCorporativo />
      </div>
    </section>
  );
}
