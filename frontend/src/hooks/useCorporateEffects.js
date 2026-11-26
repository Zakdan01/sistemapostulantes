// Efectos del sitio corporativo: reveal, contadores, sombra del header y salto
// a las secciones con hash. Se reobserva al cambiar de ruta porque el <Outlet>
// cambia sin desmontar el marco.
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useCorporateEffects() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const observador = !reducir && 'IntersectionObserver' in window
      ? new IntersectionObserver((entradas) => {
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting) return;
          entrada.target.classList.add('visible');
          observador.unobserve(entrada.target);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' })
      : null;

    const registrarRevelables = () => {
      const revelables = Array.from(document.querySelectorAll('.reveal:not(.visible)'));
      if (observador) revelables.forEach((n) => observador.observe(n));
      else revelables.forEach((n) => n.classList.add('visible'));
    };

    registrarRevelables();

    let observadorMutaciones = null;
    if ('MutationObserver' in window) {
      observadorMutaciones = new MutationObserver(() => {
        registrarRevelables();
      });
      const objetivo = document.getElementById('main') || document.body;
      observadorMutaciones.observe(objetivo, { childList: true, subtree: true });
    }

    const header = document.querySelector('.site-header');
    const progreso = document.querySelector('.scroll-progress');
    const alScroll = () => {
      header?.classList.toggle('con-scrolled', window.scrollY > 12);
      if (!progreso) return;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const avance = total > 0 ? Math.min(Math.max(window.scrollY / total, 0), 1) : 0;
      progreso.style.transform = `scaleX(${avance})`;
    };
    alScroll();
    window.addEventListener('scroll', alScroll, { passive: true });
    window.addEventListener('resize', alScroll, { passive: true });

    const stats = document.querySelector('.hero-stats');
    const conteos = stats ? Array.from(stats.querySelectorAll('[data-conteo]')) : [];
    const frames = [];
    let observadorConteos = null;

    if (conteos.length && !reducir) {
      const animar = () => {
        const inicio = performance.now();
        conteos.forEach((n) => {
          const fin = Number(n.dataset.conteo);
          // Mientras carga, el texto es "…" o "—": no lo sobrescribimos con 0.
          if (!Number.isFinite(fin) || !/^\d+$/.test(String(n.textContent).trim())) return;
          const paso = (ahora) => {
            const t = Math.min((ahora - inicio) / 850, 1);
            n.textContent = String(Math.round(fin * (1 - Math.pow(1 - t, 3))));
            if (t < 1) frames.push(requestAnimationFrame(paso));
          };
          frames.push(requestAnimationFrame(paso));
        });
      };
      if ('IntersectionObserver' in window) {
        observadorConteos = new IntersectionObserver((entradas) => {
          if (!entradas.some((e) => e.isIntersecting)) return;
          animar();
          observadorConteos.disconnect();
        }, { threshold: 0.4 });
        observadorConteos.observe(stats);
      } else {
        animar();
      }
    }

    let salto = null;
    if (hash) {
      salto = requestAnimationFrame(() => {
        document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({
          behavior: reducir ? 'auto' : 'smooth',
          block: 'start'
        });
      });
    }

    return () => {
      observador?.disconnect();
      observadorMutaciones?.disconnect();
      observadorConteos?.disconnect();
      frames.forEach(cancelAnimationFrame);
      if (salto !== null) cancelAnimationFrame(salto);
      window.removeEventListener('scroll', alScroll);
      window.removeEventListener('resize', alScroll);
    };
  }, [pathname, hash]);
}
