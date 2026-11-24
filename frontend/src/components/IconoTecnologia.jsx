// Iconografía visual de tecnologías: SVG limpio para las más comunes,
// fallback con insignia + color temático por categoría.

// ─── SVG paths (viewBox 0 0 24 24, stroke-based like lucide) ────────────────
// Cada entrada es un array de strings: cada string es un <path d="…" />.
// Se renderizan con stroke=currentColor, fill=none, strokeWidth=1.5.
const ICONOS_SVG = {
  // — Lenguajes —
  javascript: ['M3 3h18v18H3V3zm4.5 13.5V9h1.5v7.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5h1.5zm5-3c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v3c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5h-1.5c0 1.66 1.34 3 3 3s3-1.34 3-3v-3c0-1.66-1.34-3-3-3s-3 1.34-3 3h1.5z'],
  typescript: ['M3 3h18v18H3V3zm5.5 7H7v1.25h1.5V18h1.5v-6.75H11.5V10h-3zM14 14.5V18h1.5v-3.5c0-.28.22-.5.5-.5s.5.22.5.5V18h1.5v-3.5a2 2 0 0 0-4 0z'],
  python: ['M12 2c-1.67 0-3 .67-3 2v2h6v1H8C6.34 7 5 8.34 5 10v3c0 1.66 1.34 3 3 3h1v-2.5C9 12.12 10.12 11 11.5 11h5c.83 0 1.5-.67 1.5-1.5V4c0-1.33-1.33-2-3-2h-3zm-1.5 1.5a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5z', 'M12 22c1.67 0 3-.67 3-2v-2h-6v-1h7c1.66 0 3-1.34 3-3v-3c0-1.66-1.34-3-3-3h-1v2.5c0 1.38-1.12 2.5-2.5 2.5h-5c-.83 0-1.5.67-1.5 1.5V20c0 1.33 1.33 2 3 2h3zm1.5-1.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z'],
  java: ['M9 22s-1-1 1-3c0 0-3 0-3-3 0 0 5 1 7-1', 'M15 22s1-1-1-3c0 0 3 0 3-3 0 0-5 1-7-1', 'M8 7c0-3 4-5 4-5s4 2 4 5-2 4-4 5-4 2-4 5', 'M12 12c2-1 4-2 4-5'],
  html: ['M4 2l1.5 18L12 22l6.5-2L20 2H4zm3.5 5h9l-.3 3H8.3l.3 3h7l-.4 4.5L12 18.5l-3.2-1L8.5 14'],
  css: ['M4 2l1.5 18L12 22l6.5-2L20 2H4zm3.8 5h8.4l-.2 2.5H8.5l.2 2.5h6.8l-.5 5.5L12 18.5l-3-1-.2-2.5'],
  php: ['M4.5 12a7.5 4.5 0 1 0 15 0 7.5 4.5 0 1 0-15 0z', 'M7 10.5v3M7 10.5h1.5a1.5 1.5 0 0 1 0 3H7', 'M12 10.5v3m0-3h1.5a1.5 1.5 0 0 1 0 3H12', 'M17 10.5v3m0-3h1.5a1.5 1.5 0 0 1 0 3H17'],
  csharp: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M10 8v8M14 8v8M8 11h8M8 13h8'],
  kotlin: ['M3 3h18v18H3V3z', 'M3 3l9 9-9 9', 'M12 3l9 9-9 9'],
  ruby: ['M3 12l3 9h12l3-9-6-9H9L3 12z', 'M3 12h18M12 3v18M6 21l6-9M18 21l-6-9'],
  go: ['M2 10c0-2.5 2-4 4-4h2c2 0 4 1.5 4 4s-2 4-4 4H6c-2 0-4-1.5-4-4z', 'M14.5 6h4c2 0 3.5 1.5 3.5 4s-1.5 4-3.5 4h-4V6z', 'M14.5 10h4'],
  rust: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M12 7v5l3 3', 'M4.5 12h1M18.5 12h1M12 4.5v1M12 18.5v1'],
  swift: ['M20.3 7.2c.6 2 .2 4.5-1.5 6.5-2.5 3-6.5 4-10.5 3 3 1 6-1 7-3-3 2-7 2-9.5-1 2 2 5 3 7 2-3-1-5.5-3-6.5-6C8 10 10 12 13 12c-2-2-4-5-3.5-8C11.5 6 14 7.5 16 7c-1.5-2-1-4 0-5 1.5 1.5 3 3 4.3 5.2z'],
  c: ['M20 8.5a8 8 0 1 0 0 7', 'M20 8.5A8 8 0 0 0 12 4a8 8 0 0 0-8 8 8 8 0 0 0 8 8 8 8 0 0 0 8-4.5'],
  'c++': ['M17 8.5a7 7 0 1 0 0 7', 'M19 11h4M21 9v4M12 11h4M14 9v4'],

  // — Frameworks —
  react: ['M12 12m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0', 'M12 2C6.5 2 2 6 2 12s4.5 10 10 10', 'M12 22c5.5 0 10-4 10-10S17.5 2 12 2', 'M2 12c0-3 4.5-5.5 10-5.5S22 9 22 12s-4.5 5.5-10 5.5S2 15 2 12z', 'M12 6.5c5.5 0 10 2.5 10 5.5s-4.5 5.5-10 5.5S2 15 2 12s4.5-5.5 10-5.5z'],
  angular: ['M12 2L3 6.5l1.5 11L12 22l7.5-4.5 1.5-11L12 2z', 'M12 2v20M7.5 10h9L12 17l-4.5-7z'],
  vue: ['M2 3h4l6 10 6-10h4L12 21 2 3z', 'M6.5 3L12 12l5.5-9'],
  spring: ['M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10z', 'M15 7c-3-1-5 1-5 4s2 5 5 4', 'M9 17c3 1 5-1 5-4s-2-5-5-4', 'M12 7v0.01M12 17v0.01'],
  django: ['M4 3h5v14c0 2.5-2 4-4.5 4', 'M9 7h-2a3 3 0 0 0 0 6h2', 'M14 3v18M14 3h3.5c2 0 3.5 1.5 3.5 3.5S19.5 10 17.5 10H14'],
  flutter: ['M14 2l-9 9 3 3 12-12h-6z', 'M14 12l-5 5 3 3 8-8h-6z'],
  express: ['M3 12h18M3 12c0-5 4-9 9-9s9 4 9 9-4 9-9 9-9-4-9-9z', 'M12 3c-2.5 0-4.5 4-4.5 9s2 9 4.5 9 4.5-4 4.5-9-2-9-4.5-9z'],
  laravel: ['M4 16l4-12h2l4 12', 'M6.5 10h7', 'M16 4l4 12M14 16h6'],
  tailwind: ['M4 12c2-4 5-6 8-6 4 0 5 3 8 3s3-1 4-3', 'M4 18c2-4 5-6 8-6 4 0 5 3 8 3s3-1 4-3'],
  nextjs: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M8 8v8M8 8h4l5 8V8'],
  svelte: ['M15.5 2.4c-2.9-1.4-6.4-.3-7.9 2.5L5 10.1c-1.4 2.9-.3 6.4 2.5 7.9', 'M8.5 21.6c2.9 1.4 6.4.3 7.9-2.5L19 13.9c1.4-2.9.3-6.4-2.5-7.9', 'M8 14l8-4'],

  // — Bases de datos —
  postgres: ['M5 5c0 1.5 3.1 3 7 3s7-1.5 7-3-3.1-3-7-3-7 1.5-7 3z', 'M5 5v14c0 1.5 3.1 3 7 3s7-1.5 7-3V5', 'M5 12c0 1.5 3.1 3 7 3s7-1.5 7-3'],
  mysql: ['M4 5c0 1.5 3.6 3 8 3s8-1.5 8-3-3.6-3-8-3-8 1.5-8 3z', 'M4 5v14c0 1.5 3.6 3 8 3s8-1.5 8-3V5', 'M4 12c0 1.5 3.6 3 8 3s8-1.5 8-3', 'M4 8.5c0 1.5 3.6 3 8 3s8-1.5 8-3', 'M4 15.5c0 1.5 3.6 3 8 3s8-1.5 8-3'],
  mongodb: ['M12 2v20', 'M12 2c-2.5 2-5 5-5 10s2.5 8 5 10', 'M12 2c2.5 2 5 5 5 10s-2.5 8-5 10'],
  sql: ['M4 6c0 1.5 3.6 3 8 3s8-1.5 8-3-3.6-3-8-3-8 1.5-8 3z', 'M4 6v12c0 1.5 3.6 3 8 3s8-1.5 8-3V6', 'M4 12c0 1.5 3.6 3 8 3s8-1.5 8-3'],
  redis: ['M3 12l9 5 9-5-9-5-9 5z', 'M3 12v4l9 5 9-5v-4', 'M3 8v4l9 5 9-5V8', 'M3 8l9 5 9-5-9-5-9 5z'],
  sqlite: ['M5 6c0 1.5 3.1 3 7 3s7-1.5 7-3-3.1-3-7-3-7 1.5-7 3z', 'M5 6v12c0 1.5 3.1 3 7 3s7-1.5 7-3V6', 'M5 12c0 1.5 3.1 3 7 3s7-1.5 7-3'],

  // — DevOps / Herramientas —
  docker: ['M2 12.5h2.5v-3h3v-3h3v3h3v3h3v-3h3v-3', 'M2 12.5c0 4 3 7 7.5 7s8-2.5 8.5-4', 'M13 3s1.5 1 1.5 3', 'M2 12.5h20'],
  git: ['M12 2v20', 'M5 7l7 5 7-5', 'M12 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M12 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M5 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M19 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
  nodejs: ['M12 2l9 5v10l-9 5-9-5V7l9-5z', 'M12 7v10M8 9.5l4 2.5M16 9.5l-4 2.5'],
  kubernetes: ['M12 2l9 5.5v9L12 22l-9-5.5v-9L12 2z', 'M12 2v20M3 7.5l9 5.5M21 7.5l-9 5.5'],
  linux: ['M12 2C9 2 8 5 8 7c0 1.5.5 3 0 5S6 15 6 17c0 3 3 5 6 5s6-2 6-5c0-2-1.5-3-2-5s0-3.5 0-5c0-2-1-5-4-5z', 'M10 10h.01M14 10h.01', 'M10 14c.5.5 1.5 1 2 1s1.5-.5 2-1'],
  aws: ['M5 15l3-10h2l3 10', 'M6.5 11h5', 'M15 5l1.5 10L18 10l1.5 5L21 5', 'M12.5 10h2a1.5 1.5 0 0 1 0 3h-1.5a1.5 1.5 0 0 0 0 3h2'],
  azure: ['M6 18h12L12 4 6 18z', 'M14 18l6-6h-8l4-8-10 14h8z'],
  gcp: ['M14.5 4L7 18h3l2-4h4l2 4h3L14.5 4z', 'M5 10h14M8 14h8'],
  jira: ['M12 2l-5 5 5 5 5-5-5-5z', 'M2 12l5 5 5-5', 'M17 7l5 5-5 5'],
  figma: ['M8 2h4v6H8a3 3 0 0 1 0-6z', 'M12 2h4a3 3 0 0 1 0 6h-4V2z', 'M8 8h4v6H8a3 3 0 0 1 0-6z', 'M12 14h4a3 3 0 0 1 0 6 3 3 0 0 1-3-3V8', 'M8 14h4v3a3 3 0 0 1-3 3 3 3 0 0 1-3-3v0a3 3 0 0 1 3-3z'],
  photoshop: ['M3 3h18v18H3V3z', 'M6.5 9v6M6.5 9h2a1.5 1.5 0 0 1 0 3h-2', 'M13 12.5c0-.83.67-1.5 1.5-1.5h1c.83 0 1.5.67 1.5 1.5v.5c0 .83-.67 1.5-1.5 1.5h-1c-.83 0-1.5.67-1.5 1.5v0c0 .28.22.5.5.5h3'],
  terraform: ['M9 2v7l6 3.5V5.5L9 2z', 'M15 5.5v7l6 3.5V9l-6-3.5z', 'M3 5.5v7l6 3.5v-7L3 5.5z', 'M9 16v7l6-3.5v-7L9 16z'],
  vscode: ['M17 3l-10 9 10 9V3z', 'M7 12l-4 3V9l4 3z', 'M17 3l4 2v14l-4 2'],
};

// ─── Colores temáticos por categoría ────────────────────────────────────────
const COLORES_CATEGORIA = {
  // DB categories (backend: singular, frontend: plural)
  lenguaje:    { bg: 'bg-blue-100 dark:bg-blue-950/50',    text: 'text-blue-700 dark:text-blue-300',    letra: 'L' },
  lenguajes:   { bg: 'bg-blue-100 dark:bg-blue-950/50',    text: 'text-blue-700 dark:text-blue-300',    letra: 'L' },
  framework:   { bg: 'bg-violet-100 dark:bg-violet-950/50', text: 'text-violet-700 dark:text-violet-300', letra: 'F' },
  frameworks:  { bg: 'bg-violet-100 dark:bg-violet-950/50', text: 'text-violet-700 dark:text-violet-300', letra: 'F' },
  base_datos:  { bg: 'bg-emerald-100 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-300', letra: 'B' },
  bases_datos: { bg: 'bg-emerald-100 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-300', letra: 'B' },
  herramienta: { bg: 'bg-amber-100 dark:bg-amber-950/50',  text: 'text-amber-700 dark:text-amber-300',  letra: 'H' },
  devops:      { bg: 'bg-amber-100 dark:bg-amber-950/50',  text: 'text-amber-700 dark:text-amber-300',  letra: 'D' },
  diseno:      { bg: 'bg-pink-100 dark:bg-pink-950/50',    text: 'text-pink-700 dark:text-pink-300',    letra: 'D' },
  cloud:       { bg: 'bg-cyan-100 dark:bg-cyan-950/50',    text: 'text-cyan-700 dark:text-cyan-300',    letra: 'C' },
  otro:        { bg: 'bg-slate-100 dark:bg-slate-800',     text: 'text-slate-600 dark:text-slate-300',  letra: '?' },
};

// Normaliza el nombre para buscar el SVG (lowercase, sin espacios, alias comunes)
const ALIAS = {
  'c#': 'csharp', 'c sharp': 'csharp',
  postgresql: 'postgres', pg: 'postgres',
  node: 'nodejs', 'node.js': 'nodejs',
  js: 'javascript', ts: 'typescript',
  'react.js': 'react', reactjs: 'react',
  'vue.js': 'vue', vuejs: 'vue',
  'angular.js': 'angular', angularjs: 'angular',
  'next.js': 'nextjs', 'next': 'nextjs',
  'svelte.js': 'svelte', sveltejs: 'svelte',
  'express.js': 'express', expressjs: 'express',
  'tailwindcss': 'tailwind', 'tailwind css': 'tailwind',
  'amazon web services': 'aws',
  'google cloud': 'gcp', 'google cloud platform': 'gcp',
  'microsoft azure': 'azure',
  'visual studio code': 'vscode',
  '.net': 'csharp', dotnet: 'csharp',
  'c plus plus': 'c++', cpp: 'c++',
};

function normalizar(nombre) {
  const n = (nombre || '').trim().toLowerCase();
  return ALIAS[n] || n;
}

/**
 * Componente visual de tecnología: muestra un SVG si es conocida, o un
 * fallback con la inicial y color temático de la categoría.
 *
 * @param {{ nombre: string, categoria?: string, tamano?: 'xs'|'sm'|'md'|'lg', className?: string }} props
 */
export function IconoTecnologia({ nombre, categoria, tamano = 'sm', className = '' }) {
  const clave = normalizar(nombre);
  const paths = ICONOS_SVG[clave];
  const cat = COLORES_CATEGORIA[categoria] || COLORES_CATEGORIA.otro;

  const tamanos = {
    xs: 'h-5 w-5',
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };
  const fuentesFallback = {
    xs: 'text-[10px]',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const size = tamanos[tamano] || tamanos.sm;

  if (paths) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${size} shrink-0 ${cat.text} ${className}`}
        aria-hidden="true"
      >
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </svg>
    );
  }

  // Fallback: insignia con la inicial y color de la categoría
  const inicial = (nombre || '?').charAt(0).toUpperCase();
  return (
    <span
      className={`${size} shrink-0 inline-flex items-center justify-center rounded-md font-bold ${fuentesFallback[tamano]} ${cat.bg} ${cat.text} ${className}`}
      title={nombre}
      aria-hidden="true"
    >
      {inicial}
    </span>
  );
}
