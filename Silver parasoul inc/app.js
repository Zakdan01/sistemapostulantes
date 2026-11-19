/* Consultora de Convocatorias · Interacciones de la web corporativa */
/* La plataforma se abre en una pestaña nueva; su dirección es configurable desde la propia página. */
(function () {
  'use strict';

  const URL_PREDETERMINADA = 'http://localhost:5173';
  const CLAVE_URL = 'sp_url_sistema';
  const CLAVE_TEMA = 'sp_tema';
  const CORREO = 'convocatorias@consultora.com';

  const $ = (selector, raiz = document) => raiz.querySelector(selector);
  const $$ = (selector, raiz = document) => Array.from(raiz.querySelectorAll(selector));

  const inputUrl = $('#urlSistema');
  const listaConv = $('#listaConvocatorias');

  let urlSistema = normalizarURL(localStorage.getItem(CLAVE_URL) || URL_PREDETERMINADA);
  let mailtoPendiente = '';
  let cuerpoPendiente = '';

  /* ---------------- Utilidades ---------------- */
  function normalizarURL(valor) {
    let v = String(valor || '').trim();
    if (!v) return URL_PREDETERMINADA;
    if (!/^https?:\/\//i.test(v)) v = 'http://' + v;
    try {
      const u = new URL(v);
      const base = u.origin + (u.pathname === '/' ? '' : u.pathname.replace(/\/+$/, ''));
      return base;
    } catch (_) {
      return URL_PREDETERMINADA;
    }
  }

  function urlCon(ruta) {
    return urlSistema + (ruta && ruta.startsWith('/') ? ruta : '/' + String(ruta || ''));
  }

  function el(etiqueta, clase, texto) {
    const n = document.createElement(etiqueta);
    if (clase) n.className = clase;
    if (texto !== undefined && texto !== null) n.textContent = String(texto);
    return n;
  }

  let toastTimer = null;
  function toast(mensaje) {
    const n = $('#toast');
    n.textContent = mensaje;
    n.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { n.hidden = true; }, 3200);
  }

  /* ---------------- Tema ---------------- */
  function aplicarTema(tema) {
    document.documentElement.dataset.theme = tema;
    localStorage.setItem(CLAVE_TEMA, tema);
    const btn = $('#temaBtn');
    btn.setAttribute('aria-label', tema === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    btn.querySelector('use').setAttribute('href', tema === 'dark' ? '#i-sun' : '#i-moon');
  }
  aplicarTema(localStorage.getItem(CLAVE_TEMA) === 'dark' ? 'dark' : 'light');
  $('#temaBtn').addEventListener('click', () => {
    aplicarTema(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  /* ---------------- Menú móvil y header ---------------- */
  const nav = $('#navPrincipal');
  const menuBtn = $('#menuBtn');
  function cerrarMenu() {
    nav.classList.remove('abierta');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Abrir menú');
    menuBtn.querySelector('use').setAttribute('href', '#i-menu');
  }
  menuBtn.addEventListener('click', () => {
    const abierta = nav.classList.toggle('abierta');
    menuBtn.setAttribute('aria-expanded', String(abierta));
    menuBtn.setAttribute('aria-label', abierta ? 'Cerrar menú' : 'Abrir menú');
    menuBtn.querySelector('use').setAttribute('href', abierta ? '#i-close' : '#i-menu');
  });
  $$('#navPrincipal a').forEach((a) => a.addEventListener('click', cerrarMenu));
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('abierta') && !e.target.closest('.nav-wrap')) cerrarMenu();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarMenu(); });
  window.addEventListener('scroll', () => {
    $('#siteHeader').classList.toggle('con-scrolled', window.scrollY > 12);
  }, { passive: true });

  /* ---------------- Animaciones de entrada ---------------- */
  const revelables = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add('visible');
        obs.unobserve(entrada.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    revelables.forEach((n) => obs.observe(n));
  } else {
    revelables.forEach((n) => n.classList.add('visible'));
  }

  const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function animarConteos() {
    $$('[data-conteo]').forEach((n) => {
      const fin = Number(n.dataset.conteo);
      if (reducirMovimiento || !Number.isFinite(fin)) { n.textContent = fin; return; }
      const inicio = performance.now();
      const paso = (ahora) => {
        const t = Math.min((ahora - inicio) / 850, 1);
        n.textContent = Math.round(fin * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    });
  }
  const observaConteos = new IntersectionObserver((entradas) => {
    if (entradas.some((e) => e.isIntersecting)) { animarConteos(); observaConteos.disconnect(); }
  }, { threshold: 0.4 });
  observaConteos.observe($('.hero-stats'));

  /* ---------------- Accesos a la plataforma ---------------- */
  function actualizarEnlaces() {
    $$('[data-ruta]').forEach((enlace) => {
      enlace.href = urlCon(enlace.dataset.ruta);
    });
  }

  $('#urlForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const valor = inputUrl.value.trim();
    if (!/^(https?:\/\/)?[\w.-]+(:\d+)?/i.test(valor)) {
      toast('Ingresá una dirección válida, por ejemplo http://localhost:5173');
      return;
    }
    urlSistema = normalizarURL(valor);
    localStorage.setItem(CLAVE_URL, urlSistema);
    inputUrl.value = urlSistema;
    actualizarEnlaces();
    toast('Los enlaces al sistema fueron actualizados');
  });

  actualizarEnlaces();
  inputUrl.value = urlSistema;

  /* ---------------- Convocatorias ---------------- */
  const DEMO = [
    { titulo: 'Desarrollador Junior', estado: 'abierta', tipo: 'Pasantía', cupos: 3, contratados: 0, total_candidatos: 46, total_postulados: 8, kpi_minimo: 25, anios_min: 1, disponibilidad: 'Full time', requisitos: 'python, postgres, sql' },
    { titulo: 'Desarrollador Semi-senior', estado: 'abierta', tipo: 'Mensual', cupos: 2, contratados: 0, total_candidatos: 41, total_postulados: 6, kpi_minimo: 30, anios_min: 3, disponibilidad: 'Full time', requisitos: 'node, react, postgres' },
    { titulo: 'Analista de Datos', estado: 'abierta', tipo: 'Momentáneo', cupos: 2, contratados: 0, total_candidatos: 38, total_postulados: 5, kpi_minimo: 25, anios_min: 2, disponibilidad: 'Half time', requisitos: 'python, sql, power bi' },
    { titulo: 'Diseño UI', estado: 'abierta', tipo: 'Mensual', cupos: 1, contratados: 0, total_candidatos: 33, total_postulados: 4, kpi_minimo: 30, anios_min: 2, disponibilidad: 'Full time', requisitos: 'figma, css, html' },
    { titulo: 'Soporte TI', estado: 'abierta', tipo: 'De planta', cupos: 2, contratados: 0, total_candidatos: 29, total_postulados: 3, kpi_minimo: 25, anios_min: 1, disponibilidad: 'Full time', requisitos: 'soporte, redes, windows' },
    { titulo: 'QA Manual', estado: 'abierta', tipo: 'Momentáneo', cupos: 2, contratados: 1, total_candidatos: 27, total_postulados: 7, kpi_minimo: 25, anios_min: 1, disponibilidad: 'Half time', requisitos: 'qa, testing, jira' }
  ];

  function tarjetaConvocatoria(c) {
    const estado = c.estado || 'pendiente';
    const articulo = el('article', 'conv-card');

    const top = el('div', 'conv-top');
    top.append(el('h3', '', c.titulo || 'Sin título'));
    top.append(el('span', 'pill-estado pe-' + estado.replace(/[^a-z]/gi, '').toLowerCase(), estado));
    articulo.append(top);

    const tags = el('div', 'conv-tags');
    [c.tipo, c.anios_min !== undefined && c.anios_min !== null ? c.anios_min + ' años mín.' : null,
      c.disponibilidad, c.kpi_minimo !== undefined && c.kpi_minimo !== null ? 'umbral ' + c.kpi_minimo : null]
      .filter(Boolean).forEach((t) => tags.append(el('span', '', t)));
    articulo.append(tags);

    if (c.requisitos) articulo.append(el('p', 'conv-req', 'Requiere: ' + c.requisitos));

    const cupos = Number(c.cupos) || 0;
    const contratados = Number(c.contratados) || 0;
    const pct = cupos ? Math.min(100, Math.round((contratados / cupos) * 100)) : 0;
    const prog = el('div', 'conv-progress');
    prog.append(el('span', '', contratados + '/' + cupos + ' cupos'));
    const track = el('div', 'progress-track');
    const fill = el('i', 'progress-fill');
    fill.style.width = pct + '%';
    track.append(fill);
    prog.append(track);
    articulo.append(prog);

    const pie = el('div', 'conv-foot');
    const izq = el('span');
    izq.append(document.createTextNode(' '));
    izq.append(el('b', '', c.total_candidatos ?? 0));
    izq.append(document.createTextNode(' candidatos · '));
    izq.append(el('b', '', c.total_postulados ?? 0));
    izq.append(document.createTextNode(' en selección'));
    pie.append(izq);
    pie.append(el('span', '', c.estado === 'abierta' ? 'Abierta' : estado));
    articulo.append(pie);
    return articulo;
  }

  function pintarConvocatorias(lista) {
    listaConv.replaceChildren();
    lista.forEach((c) => listaConv.append(tarjetaConvocatoria(c)));
  }

  /* ---------------- Formulario de contacto ---------------- */
  const modal = $('#modalEnvio');
  const form = $('#formConvocatoria');
  let ultimoBoton = null;

  function abrirModal(contenido, mailto) {
    cuerpoPendiente = contenido;
    mailtoPendiente = mailto;
    $('#modalResumen').textContent = contenido;
    modal.hidden = false;
    ultimoBoton = document.activeElement;
    $('#abrirCorreoBtn').focus();
  }
  function cerrarModal() {
    modal.hidden = true;
    if (ultimoBoton) ultimoBoton.focus();
  }
  $$('[data-cerrar-modal]').forEach((n) => n.addEventListener('click', cerrarModal));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) cerrarModal();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const d = new FormData(form);
    const nombre = String(d.get('nombre') || '').trim();
    const empresa = String(d.get('empresa') || '').trim();
    const correo = String(d.get('correo') || '').trim();
    const puesto = String(d.get('puesto') || '').trim();
    const tipo = String(d.get('tipo') || '').trim();
    const detalle = String(d.get('detalle') || '').trim();

    const cuerpo = [
      'Hola equipo de la consultora:',
      '',
      'Quisiera registrar la siguiente convocatoria:',
      '',
      'Puesto: ' + puesto,
      'Tipo: ' + tipo,
      'Empresa: ' + empresa,
      'Detalle del perfil: ' + detalle,
      '',
      'Datos de contacto:',
      'Nombre: ' + nombre,
      'Correo: ' + correo,
      '',
      'Gracias.'
    ].join('\n');
    const asunto = 'Nueva convocatoria · ' + puesto + ' · ' + empresa;
    const mailto = 'mailto:' + CORREO + '?subject=' + encodeURIComponent(asunto) + '&body=' + encodeURIComponent(cuerpo);
    abrirModal(cuerpo, mailto);
  });

  $('#abrirCorreoBtn').addEventListener('click', () => {
    window.location.href = mailtoPendiente;
    cerrarModal();
    toast('Se abrió tu aplicación de correo');
  });
  $('#copiarBtn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(cuerpoPendiente);
      toast('Mensaje copiado al portapapeles');
    } catch (_) {
      const temporal = document.createElement('textarea');
      temporal.value = cuerpoPendiente;
      document.body.append(temporal);
      temporal.select();
      try { document.execCommand('copy'); toast('Mensaje copiado al portapapeles'); }
      catch (__) { toast('No se pudo copiar; seleccioná el texto manualmente'); }
      temporal.remove();
    }
  });

  /* ---------------- Arranque ---------------- */
  $('#anio').textContent = String(new Date().getFullYear());
  pintarConvocatorias(DEMO);
})();
