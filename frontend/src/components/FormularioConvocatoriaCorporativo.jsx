// Formulario del sitio corporativo: prepara un correo con el pedido y muestra
// el resumen antes de abrir la aplicación de correo del visitante.
import { useEffect, useRef, useState } from 'react';
import { Icono } from './IconosCorporativos';
import { EMPRESA } from '../lib/empresa';
import { mensajeConvocatoria } from '../lib/corporativo';
import { useToast } from '../lib/toast';

const TIPOS = ['Pasantía', 'Momentáneo', 'Mensual', 'De planta'];
const VACIO = { nombre: '', empresa: '', correo: '', puesto: '', tipo: 'Pasantía', detalle: '' };

export function FormularioConvocatoriaCorporativo() {
  const toast = useToast();
  const [form, setForm] = useState(VACIO);
  const [mensaje, setMensaje] = useState(null);
  const abrirRef = useRef(null);
  const modalRef = useRef(null);
  const enviarRef = useRef(null);
  const set = (clave) => (e) => setForm({ ...form, [clave]: e.target.value });

  useEffect(() => {
    if (!mensaje) return undefined;
    const tarjeta = modalRef.current;
    const botonEnvio = enviarRef.current;
    const focoables = () => Array.from(tarjeta.querySelectorAll(
      'button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter((n) => n.getClientRects().length > 0);

    (abrirRef.current || focoables()[0] || tarjeta).focus();

    const alTeclado = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); setMensaje(null); return; }
      if (e.key !== 'Tab') return;
      const lista = focoables();
      if (!lista.length) { e.preventDefault(); tarjeta.focus(); return; }
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      if (e.shiftKey && (document.activeElement === primero || document.activeElement === tarjeta)) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };
    document.addEventListener('keydown', alTeclado);
    return () => {
      document.removeEventListener('keydown', alTeclado);
      botonEnvio?.focus();
    };
  }, [mensaje]);

  function enviar(e) {
    e.preventDefault();
    setMensaje(mensajeConvocatoria(form, EMPRESA.correo));
  }

  function abrirCorreo() {
    window.location.href = mensaje.mailto;
    setMensaje(null);
    toast('Se abrió tu aplicación de correo');
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensaje.cuerpo);
      toast('Mensaje copiado al portapapeles');
    } catch {
      const temporal = document.createElement('textarea');
      temporal.value = mensaje.cuerpo;
      document.body.appendChild(temporal);
      temporal.select();
      try {
        document.execCommand('copy');
        toast('Mensaje copiado al portapapeles');
      } catch {
        toast('No se pudo copiar; seleccioná el texto manualmente', false);
      }
      temporal.remove();
    }
  }

  return (
    <>
      <form className="form-card reveal" onSubmit={enviar}>
        <h3>Enviar una convocatoria</h3>
        <div className="form-row">
          <label>Tu nombre <input className="input" name="nombre" required placeholder="Nombre y apellido" autoComplete="name" value={form.nombre} onChange={set('nombre')} /></label>
          <label>Empresa <input className="input" name="empresa" required placeholder="Nombre de la empresa" autoComplete="organization" value={form.empresa} onChange={set('empresa')} /></label>
        </div>
        <div className="form-row">
          <label>Correo <input className="input" name="correo" type="email" required placeholder="nombre@empresa.com" autoComplete="email" value={form.correo} onChange={set('correo')} /></label>
          <label>Puesto <input className="input" name="puesto" required placeholder="Ej. Desarrollador Junior" value={form.puesto} onChange={set('puesto')} /></label>
        </div>
        <label>
          Tipo de convocatoria
          <select className="input" name="tipo" value={form.tipo} onChange={set('tipo')}>
            {TIPOS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label>
          Detalle del perfil
          <textarea className="input" name="detalle" rows="4" required placeholder="Tecnologías, años de experiencia, disponibilidad, cupos…" value={form.detalle} onChange={set('detalle')} />
        </label>
        <button className="btn btn-primary btn-full" type="submit" ref={enviarRef}>Preparar envío <Icono nombre="arrow" /></button>
        <p className="form-aviso">Se abre tu aplicación de correo con el mensaje listo. No enviamos datos a servidores de terceros.</p>
      </form>

      {mensaje ? (
        <div className="modal" role="presentation">
          <div className="modal-backdrop" onClick={() => setMensaje(null)} />
          <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modalTitulo" ref={modalRef} tabIndex={-1}>
            <button className="icon-btn modal-close" type="button" onClick={() => setMensaje(null)} aria-label="Cerrar">
              <Icono nombre="close" />
            </button>
            <span className="card-icon icon-emerald"><Icono nombre="mail" /></span>
            <h3 id="modalTitulo">Tu mensaje está listo</h3>
            <p>Revisá el resumen y abrí tu correo para enviarlo a <b>{EMPRESA.correo}</b>.</p>
            <pre>{mensaje.cuerpo}</pre>
            <div className="modal-acciones">
              <button className="btn btn-primary" type="button" ref={abrirRef} onClick={abrirCorreo}>
                Abrir correo <Icono nombre="arrow" />
              </button>
              <button className="btn btn-secondary" type="button" onClick={copiar}>
                <Icono nombre="copy" /> Copiar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
