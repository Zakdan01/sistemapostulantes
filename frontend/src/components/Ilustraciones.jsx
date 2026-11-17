// Ilustraciones del sitio publico, dibujadas en SVG (sin archivos ni dependencias).
// Son decorativas: el texto de al lado explica lo mismo.

function Marco({ children, etiqueta }) {
  return (
    <svg
      viewBox="0 0 520 400"
      className="h-auto w-full"
      role="img"
      aria-label={etiqueta}
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

export function IlustracionInicio() {
  return (
    <Marco etiqueta="Tu perfil conectado con una convocatoria que encaja">
      <circle cx="430" cy="62" r="92" fill="#8b5cf6" opacity="0.16" />
      <circle cx="62" cy="348" r="72" fill="#06b6d4" opacity="0.16" />

      {/* Ficha de perfil */}
      <g>
        <rect x="30" y="70" width="200" height="250" rx="26" fill="#ffffff" stroke="#e2e8f0" />
        <circle cx="130" cy="140" r="34" fill="#06b6d4" />
        <circle cx="130" cy="131" r="11" fill="#ffffff" opacity="0.9" />
        <path d="M113 157a17 17 0 0 1 34 0" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.9" />
        <rect x="72" y="190" width="116" height="10" rx="5" fill="#cbd5e1" />
        <rect x="92" y="208" width="76" height="8" rx="4" fill="#e2e8f0" />
        <rect x="60" y="234" width="60" height="18" rx="9" fill="#cffafe" />
        <rect x="126" y="234" width="50" height="18" rx="9" fill="#ede9fe" />
        <rect x="60" y="260" width="96" height="18" rx="9" fill="#f1f5f9" />
        <rect x="60" y="286" width="74" height="18" rx="9" fill="#f1f5f9" />

        {/* Sello de encaje */}
        <circle cx="200" cy="88" r="26" fill="#ffffff" stroke="#e2e8f0" />
        <circle cx="200" cy="88" r="17" fill="none" stroke="#8b5cf6" strokeWidth="5" strokeLinecap="round" strokeDasharray="76 32" transform="rotate(-90 200 88)" />
        <path d="M192 88l6 6 11-12" stroke="#8b5cf6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>

      {/* Conector */}
      <path d="M236 206h40" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" strokeDasharray="2 9" />

      {/* Ficha de convocatoria */}
      <g>
        <rect x="280" y="110" width="210" height="250" rx="26" fill="#ffffff" stroke="#e2e8f0" />
        <path d="M306 110h158a26 26 0 0 1 26 26v28H280v-28a26 26 0 0 1 26-26z" fill="#0891b2" />
        <circle cx="316" cy="144" r="13" fill="#ffffff" opacity="0.9" />
        <rect x="338" y="137" width="86" height="9" rx="4" fill="#ffffff" opacity="0.85" />
        <rect x="338" y="151" width="56" height="6" rx="3" fill="#ffffff" opacity="0.55" />
        <rect x="300" y="184" width="140" height="12" rx="6" fill="#cbd5e1" />
        <rect x="300" y="202" width="96" height="8" rx="4" fill="#e2e8f0" />

        <g>
          <circle cx="309" cy="236" r="9" fill="#cffafe" />
          <path d="M305 236l3 3 6-6" stroke="#0891b2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <rect x="326" y="232" width="120" height="9" rx="4" fill="#e2e8f0" />

          <circle cx="309" cy="264" r="9" fill="#cffafe" />
          <path d="M305 264l3 3 6-6" stroke="#0891b2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <rect x="326" y="260" width="96" height="9" rx="4" fill="#e2e8f0" />

          <circle cx="309" cy="292" r="9" fill="#cffafe" />
          <path d="M305 292l3 3 6-6" stroke="#0891b2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <rect x="326" y="288" width="72" height="9" rx="4" fill="#e2e8f0" />
        </g>

        <rect x="300" y="316" width="170" height="30" rx="15" fill="#8b5cf6" opacity="0.9" />
      </g>

      <path d="M262 60l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#22d3ee" opacity="0.8" />
      <path d="M470 300l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#a78bfa" opacity="0.8" />
    </Marco>
  );
}

export function IlustracionEmpresas() {
  return (
    <Marco etiqueta="Panel con candidatos ordenados por encaje">
      <circle cx="80" cy="70" r="84" fill="#06b6d4" opacity="0.16" />
      <circle cx="452" cy="330" r="80" fill="#8b5cf6" opacity="0.16" />

      <g>
        <rect x="40" y="50" width="440" height="272" rx="28" fill="#ffffff" stroke="#e2e8f0" />
        <path d="M74 70h372a14 14 0 0 1 14 14v18H60V84a14 14 0 0 1 14-14z" fill="#0e7490" />
        <circle cx="82" cy="86" r="5" fill="#ffffff" opacity="0.75" />
        <circle cx="98" cy="86" r="5" fill="#ffffff" opacity="0.55" />
        <circle cx="114" cy="86" r="5" fill="#ffffff" opacity="0.35" />
        <rect x="360" y="78" width="86" height="16" rx="8" fill="#ffffff" opacity="0.25" />

        {/* Filas del ranking */}
        <g>
          <circle cx="90" cy="136" r="18" fill="#22d3ee" />
          <rect x="120" y="126" width="86" height="10" rx="5" fill="#cbd5e1" />
          <rect x="120" y="143" width="58" height="7" rx="3.5" fill="#e2e8f0" />
          <rect x="240" y="132" width="190" height="13" rx="6.5" fill="#eef2f7" />
          <rect x="240" y="132" width="152" height="13" rx="6.5" fill="#06b6d4" />
        </g>
        <g>
          <circle cx="90" cy="190" r="18" fill="#a78bfa" />
          <rect x="120" y="180" width="72" height="10" rx="5" fill="#cbd5e1" />
          <rect x="120" y="197" width="48" height="7" rx="3.5" fill="#e2e8f0" />
          <rect x="240" y="186" width="190" height="13" rx="6.5" fill="#eef2f7" />
          <rect x="240" y="186" width="116" height="13" rx="6.5" fill="#8b5cf6" />
        </g>
        <g>
          <circle cx="90" cy="244" r="18" fill="#34d399" />
          <rect x="120" y="234" width="94" height="10" rx="5" fill="#cbd5e1" />
          <rect x="120" y="251" width="52" height="7" rx="3.5" fill="#e2e8f0" />
          <rect x="240" y="240" width="190" height="13" rx="6.5" fill="#eef2f7" />
          <rect x="240" y="240" width="86" height="13" rx="6.5" fill="#10b981" />
        </g>

        <rect x="60" y="284" width="130" height="18" rx="9" fill="#cffafe" />
        <rect x="200" y="284" width="96" height="18" rx="9" fill="#ede9fe" />
      </g>

      {/* Sello de mejor candidato */}
      <g>
        <circle cx="458" cy="58" r="30" fill="#ffffff" stroke="#e2e8f0" />
        <path d="M458 42l4.5 9.6 10.5 1.4-7.7 7.3 1.9 10.4-9.2-5.1-9.2 5.1 1.9-10.4-7.7-7.3 10.5-1.4z" fill="#f59e0b" />
      </g>

      <path d="M28 250l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#22d3ee" opacity="0.8" />
    </Marco>
  );
}
