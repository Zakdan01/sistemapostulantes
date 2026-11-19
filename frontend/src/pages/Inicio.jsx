import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { EMPRESA } from '../lib/empresa';
import { Icono } from '../components/IconosCorporativos';
import { ConvocatoriaCardCorporativa } from '../components/ConvocatoriaCardCorporativa';
import { FormularioConvocatoriaCorporativo } from '../components/FormularioConvocatoriaCorporativo';

const SERVICIOS = [
  { icono: 'briefcase', color: 'cyan', titulo: 'Recepción de convocatorias', texto: 'Cargamos el puesto, el tipo de contrato, los cupos, los años de experiencia y los requisitos tecnológicos con su nivel mínimo.', pie: 'Todo queda pendiente de aprobación antes de publicarse.' },
  { icono: 'users', color: 'violet', titulo: 'Registro de postulantes', texto: 'El postulante crea su perfil con experiencia, formación, habilidades y disponibilidad. Cada cuenta es revisada por nuestro equipo.', pie: 'Un correo, un perfil, cero duplicados.' },
  { icono: 'target', color: 'emerald', titulo: 'Enlistado inteligente', texto: 'Al publicar, el sistema arma la lista de candidatos disponibles y la ordena por un KPI de convocatoria calculado con reglas transparentes.', pie: 'Quien no supera el umbral aparece con su motivo.' },
  { icono: 'chart', color: 'amber', titulo: 'Pipeline de selección', texto: 'Tomamos candidatos, registramos contactos, preseleccionamos y contratamos con transiciones controladas y cupos bajo control.', pie: 'El cierre es automático al cubrir la última vacante.' },
  { icono: 'check', color: 'rose', titulo: 'Auditoría y bitácora', texto: 'Cada movimiento del proceso queda registrado. Los snapshots del KPI se congelan al tomar a un candidato para comparar después.', pie: 'Trazabilidad real para auditorías internas.' },
  { icono: 'clock', color: 'slate', titulo: 'Estados y permisos', texto: 'Administrador, reclutador y postulante ven exactamente lo que necesitan. Cada rol trabaja sobre su propio alcance.', pie: 'Acceso simple, información protegida.' }
];

const PASOS = [
  { numero: '01', titulo: 'Recibimos', texto: 'Nos escribís con el puesto y el perfil que buscás. También podés cargarlo directamente en la plataforma.' },
  { numero: '02', titulo: 'Registramos', texto: 'Convertimos tu pedido en una convocatoria con requisitos, cupos, disponibilidad y umbral de enlistado.' },
  { numero: '03', titulo: 'Enlistamos', texto: 'El sistema cruza los perfiles disponibles con los requisitos y ordena a los candidatos por KPI.' },
  { numero: '04', titulo: 'Acompañamos', texto: 'Seguimos cada etapa hasta la contratación y cerramos la convocatoria al cubrir los cupos.' }
];

export function Inicio() {
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let vivo = true;
    api('/api/publico/convocatorias')
      .then((r) => { if (vivo) setLista(r || []); })
      .catch((ex) => { if (vivo) { console.error('No se pudieron cargar las convocatorias públicas', ex); setErr('no disponible'); } })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, []);

  return (
    <>
      <section className="hero" id="inicio">
        <div className="hero-scene" aria-hidden="true" />
        <div className="hero-grid-bg" aria-hidden="true" />
        <div className="container hero-inner">
          <div className="hero-copy reveal">
            <span className="eyebrow"><Icono nombre="spark" /> Selección con criterios claros</span>
            <h1>Conectamos talento con <span className="grad-text">oportunidades reales</span>.</h1>
            <p className="lead">
              En <strong>nuestra consultora</strong> recibimos y registramos convocatorias y postulantes.
              Organizamos cada proceso en una sola plataforma: requisitos, perfiles, umbrales y seguimiento,
              sin hojas de cálculo ni correos perdidos.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/convocatorias">Ver convocatorias <Icono nombre="arrow" /></Link>
              <Link className="btn btn-secondary" to="/contacto">Enviar una convocatoria</Link>
            </div>
            <div className="hero-stats" aria-label="Cifras de la operación">
              <div className="mini-stat"><b data-conteo="15">15</b><span>Convocatorias registradas</span></div>
              <div className="mini-stat"><b data-conteo="50">50</b><span>Candidatos activos</span></div>
              <div className="mini-stat"><b data-conteo="3">3</b><span>Perfiles de acceso</span></div>
            </div>
          </div>

          <div className="hero-visual reveal" aria-hidden="true">
            <div className="mock-card">
              <div className="mock-head">
                <span className="mock-dots"><i /><i /><i /></span>
                <span className="mock-title">Panel de convocatorias</span>
                <span className="mock-live">● en vivo</span>
              </div>
              <div className="mock-body">
                <div className="mock-kpis">
                  <div><b>08</b><span>Abiertas</span></div>
                  <div><b>39</b><span>En selección</span></div>
                  <div><b>05</b><span>Contratados</span></div>
                </div>
                <div className="mock-row mock-row-head"><span>Puesto</span><span>Cupos</span><span>KPI</span></div>
                <div className="mock-row"><span><i className="dot dot-cyan" /> Desarrollador Junior</span><span>0 / 3</span><span><i className="barra" style={{ '--w': '78%' }} /></span></div>
                <div className="mock-row"><span><i className="dot dot-violet" /> Analista de Datos</span><span>1 / 2</span><span><i className="barra" style={{ '--w': '62%' }} /></span></div>
                <div className="mock-row"><span><i className="dot dot-emerald" /> Diseño UI</span><span>1 / 1</span><span><i className="barra" style={{ '--w': '94%' }} /></span></div>
                <div className="mock-tags">
                  <span>python ★</span><span>postgres ★</span><span>react ○</span><span>+ 12 requisitos</span>
                </div>
              </div>
            </div>
            <div className="float-chip float-chip-a"><Icono nombre="users" /> Perfil registrado</div>
            <div className="float-chip float-chip-b"><Icono nombre="check" /> Umbral superado</div>
          </div>
        </div>
      </section>

      <section className="section" id="servicios">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow eyebrow-soft">Lo que hacemos</span>
            <h2>Un solo lugar para recibir, registrar y decidir</h2>
            <p>Diseñamos el proceso para que cada convocatoria tenga trazabilidad desde el primer correo hasta el cierre.</p>
          </div>
          <div className="cards-3">
            {SERVICIOS.map((s) => (
              <article className="card reveal" key={s.titulo}>
                <span className={`card-icon icon-${s.color}`}><Icono nombre={s.icono} /></span>
                <h3>{s.titulo}</h3>
                <p>{s.texto}</p>
                <span className="card-foot">{s.pie}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt" id="proceso">
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

      <section className="section" id="convocatorias">
        <div className="container">
          <div className="section-head section-head-row reveal">
            <div>
              <span className="eyebrow eyebrow-soft">Oportunidades</span>
              <h2>Convocatorias registradas</h2>
              <p>
                Procesos abiertos en este momento.{' '}
                <span className={`estado-datos ${err ? 'muestra' : 'en-vivo'}`}>
                  {err ? 'No se pudieron cargar las convocatorias' : 'Datos en vivo del sistema'}
                </span>
              </p>
            </div>
            <Link className="btn btn-ghost btn-sm" to="/convocatorias">
              <Icono nombre="arrow" /> Ver todas las convocatorias
            </Link>
          </div>
          <div className="cards-convocatorias" aria-live="polite">
            {cargando ? <p className="estado-datos">Cargando convocatorias…</p> : null}
            {!cargando && !err && lista.length === 0 ? <p className="estado-datos">No hay convocatorias abiertas por ahora.</p> : null}
            {!cargando && !err ? lista.slice(0, 6).map((c) => <ConvocatoriaCardCorporativa key={c.id} c={c} />) : null}
          </div>
          <div className="section-cta reveal">
            <span>¿Buscás una oportunidad? Completá tu perfil y entrás automáticamente en las listas donde cumplas el umbral.</span>
            <div className="cta-acciones">
              <Link className="btn btn-secondary btn-sm" to="/convocatorias">Ver convocatorias</Link>
              <Link className="btn btn-primary btn-sm" to="/registro">Crear mi perfil <Icono nombre="arrow" /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-plataforma" id="plataforma">
        <div className="container">
          <div className="section-head section-head-row reveal">
            <div>
              <span className="eyebrow eyebrow-soft">Acceso al sistema</span>
              <h2>Nuestra plataforma de gestión</h2>
              <p>Accedé al sistema de convocatorias y postulantes: cuentas, perfiles, convocatorias y selección. Los accesos abren dentro de este mismo sitio.</p>
            </div>
            <span className="pill-acceso"><Icono nombre="arrow" /> Acceso directo</span>
          </div>

          <div className="plataforma-bar reveal">
            <div className="rutas-rapidas" role="group" aria-label="Atajos de la plataforma">
              <Link className="ruta-btn activa" to="/login">Ingresar</Link>
              <Link className="ruta-btn" to="/registro">Registro</Link>
              <Link className="ruta-btn" to="/convocatorias">Convocatorias</Link>
              <Link className="ruta-btn" to="/mis-convocatorias">Mis convocatorias</Link>
            </div>
          </div>
          <p className="help-plataforma">Todos los accesos son internos: elegí el que necesitás y seguís dentro del sitio, sin direcciones ni pestañas nuevas.</p>

          <div className="acceso-card reveal">
            <div className="acceso-principal">
              <span className="acceso-icono"><Icono nombre="lock" /></span>
              <div className="acceso-copy">
                <h3>¿Ya tenés cuenta?</h3>
                <p>Ingresá con tu usuario de administrador, reclutador o postulante y seguí tus convocatorias desde la plataforma.</p>
              </div>
              <Link className="btn btn-primary" to="/login">Ir al login <Icono nombre="arrow" /></Link>
            </div>
            <div className="acceso-secundario">
              <Link className="acceso-link" to="/registro"><span>Crear perfil de postulante</span><Icono nombre="arrow" /></Link>
              <Link className="acceso-link" to="/convocatorias"><span>Explorar convocatorias</span><Icono nombre="arrow" /></Link>
              <Link className="acceso-link" to="/mis-convocatorias"><span>Ver mis convocatorias</span><Icono nombre="arrow" /></Link>
            </div>
          </div>
          <p className="help-plataforma">Credenciales de demostración del sistema: <code>admin@consultora.com</code> · <code>reclutador1@consultora.com</code> · <code>postulante01@test.com</code> — contraseña <code>Admin123!</code></p>
        </div>
      </section>

      <section className="section" id="soluciones">
        <div className="container">
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
              <Link className="btn btn-primary" to="/login">Ir a la plataforma <Icono nombre="arrow" /></Link>
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

      <section className="section section-contacto" id="contacto">
        <div className="container contacto-grid">
          <div className="contacto-copy reveal">
            <span className="eyebrow eyebrow-soft">Contacto</span>
            <h2>Contanos qué necesitás cubrir</h2>
            <p>Enviamos tu pedido por correo con todos los datos y lo registramos en la plataforma para arrancar el proceso.</p>
            <div className="contacto-datos">
              <div><Icono nombre="mail" /><span><b>Correo</b> {EMPRESA.correo}</span></div>
              <div><Icono nombre="pin" /><span><b>Oficina</b> {EMPRESA.direccion}</span></div>
              <div><Icono nombre="clock" /><span><b>Horario</b> {EMPRESA.horario}</span></div>
            </div>
          </div>
          <FormularioConvocatoriaCorporativo />
        </div>
      </section>
    </>
  );
}
