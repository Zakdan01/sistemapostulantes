export function LogoHeartgold({ className = 'h-12 w-12', ariaLabel = 'Heartgold Inc.' }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        {/* Gradiente dorado de alto brillo */}
        <linearGradient id="hg-gold-shine" x1="16" y1="8" x2="48" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fffdf6" />
          <stop offset="25%" stopColor="#fef08a" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>

        {/* Gradiente dorado medio facetado */}
        <linearGradient id="hg-gold-facet-l" x1="16" y1="18" x2="32" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>

        {/* Gradiente dorado profundo para sombras y volumen */}
        <linearGradient id="hg-gold-facet-r" x1="48" y1="18" x2="32" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>

        {/* Base oscura institucional con reflejo de madera y bronce */}
        <linearGradient id="hg-container" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2c1a12" />
          <stop offset="50%" stopColor="#1a0e08" />
          <stop offset="100%" stopColor="#100805" />
        </linearGradient>

        {/* Resplandor sutil dorado para dar presencia sobre cualquier fondo */}
        <filter id="hg-glow-corp" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#f59e0b" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Contenedor biselado institucional */}
      <rect width="64" height="64" rx="16" fill="url(#hg-container)" stroke="#5a3a24" strokeWidth="1.2" />
      <rect x="2.5" y="2.5" width="59" height="59" rx="13.5" fill="none" stroke="url(#hg-gold-shine)" strokeWidth="0.8" strokeOpacity="0.4" />

      {/* Emblema Arquitectónico Monumental */}
      <g filter="url(#hg-glow-corp)">
        {/* Pilar izquierdo facetado */}
        <path
          d="M15 48V26L24 18V48H15Z"
          fill="url(#hg-gold-facet-l)"
        />

        {/* Pilar derecho facetado */}
        <path
          d="M49 48V26L40 18V48H49Z"
          fill="url(#hg-gold-facet-r)"
        />

        {/* Lintel de unión arquitectónica superior */}
        <path
          d="M24 23H40V27H24V23Z"
          fill="url(#hg-gold-shine)"
          fillOpacity="0.85"
        />

        {/* Prisma / Obelisco central ascendente (elevación y solidez) */}
        {/* Lado izquierdo del prisma */}
        <path
          d="M32 9L23 23L32 46V9Z"
          fill="url(#hg-gold-facet-l)"
        />
        {/* Lado derecho del prisma */}
        <path
          d="M32 9L41 23L32 46V9Z"
          fill="url(#hg-gold-facet-r)"
        />

        {/* Cúspide diamante facetada (punto focal de precisión) */}
        <path
          d="M32 9L36.5 15.5L32 22L27.5 15.5L32 9Z"
          fill="url(#hg-gold-shine)"
        />

        {/* Núcleo de luz central */}
        <path
          d="M32 12.5L34.5 15.5L32 18.5L29.5 15.5L32 12.5Z"
          fill="#ffffff"
        />

        {/* Pedestal / Cimiento horizontal de estabilidad */}
        <rect x="12" y="50" width="40" height="3.2" rx="1.6" fill="url(#hg-gold-shine)" />
      </g>
    </svg>
  );
}
