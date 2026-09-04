'use client';

import { useMemo } from 'react';

interface SpiderSVGProps {
  mousePos: { x: number; y: number };
  isOpen: boolean;
  mascotColor: string;
}

/**
 * ARAÑA DEV — Mascota Fase A (SVG 3D-fake, 0 dependencias)
 *
 * Anatomía:
 *  - Hilo de seda que se dibuja desde arriba durante la entrada
 *  - Abdomen con gradiente radial + brillo especular (volumen)
 *  - Cefalotórax con pedicelo
 *  - 8 patas articuladas (marcha alternada tipo tetrápodo)
 *  - 2 ojos grandes con pupila que sigue el cursor + halo del color de sección
 *  - 6 ocelos menores con pulso luminoso
 *  - Colmillos que "tipean" cuando el chat está abierto
 */

// Patas lado derecho (coords locales desde el punto de anclaje).
// El lado izquierdo reutiliza estas mismas rutas espejadas con scale(-1,1).
const LEG_PATHS = [
  // Pata 1 — frontal, larga hacia arriba/afuera
  'M0 0 Q13 -11 23 -13 Q27 -4 21 5',
  // Pata 2 — media superior
  'M0 0 Q15 -3 26 -5 Q29 4 23 9',
  // Pata 3 — media inferior
  'M0 0 Q15 3 25 7 Q25 15 19 15',
  // Pata 4 — trasera, hacia abajo
  'M0 0 Q11 7 17 15 Q15 21 9 19',
] as const;

// Puntos de anclaje sobre el cefalotórax (lado derecho), viewBox units
const ANCHORS_R: Array<[number, number]> = [
  [47, 27],
  [49, 31],
  [49, 36],
  [47, 40],
];

export function SpiderSVG({
  mousePos,
  isOpen,
  mascotColor,
}: SpiderSVGProps) {
  // Desplazamiento de la pupila hacia el cursor (máx ~1.6 unidades)
  const pupilShift = useMemo(() => {
    if (typeof window === 'undefined') return { x: 0, y: 0 };
    const mascotX = window.innerWidth - 72;
    const mascotY = window.innerHeight - 72;
    const dx = mousePos.x - mascotX;
    const dy = mousePos.y - mascotY;
    const dist = Math.hypot(dx, dy) || 1;
    const k = Math.min(1.6, dist / 160);
    return { x: (dx / dist) * k, y: (dy / dist) * k };
  }, [mousePos]);

  const hex = mascotColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const gradientId = `spiderBodyGrad-${hex}`;
  const glowId = `spiderEyeGlow-${hex}`;

  return (
    <svg
      viewBox="0 0 80 80"
      width="100%"
      height="100%"
      className={`spider-svg transition-transform duration-200 ${isOpen ? 'scale-110' : ''}`}
      aria-hidden="true"
    >
      <defs>
        {/* Volumen del cuerpo: luz superior-izquierda → sombra inferior-derecha */}
        <radialGradient id={gradientId} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={`rgb(${Math.min(255, r + 55)}, ${Math.min(255, g + 55)}, ${Math.min(255, b + 55)})`} />
          <stop offset="55%" stopColor={mascotColor} />
          <stop offset="100%" stopColor={`rgb(${Math.max(0, r - 45)}, ${Math.max(0, g - 45)}, ${Math.max(0, b - 45)})`} />
        </radialGradient>

        {/* Halo luminoso de los ojos mayores */}
        <filter id={glowId} x="-80%" y="-80%" width="260%" height="260%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.4" floodColor={mascotColor} floodOpacity="0.85" />
        </filter>
      </defs>

      {/* ══ HILO DE SEDA ══ */}
      <line
        className="spider-thread"
        x1="40"
        y1="0"
        x2="40"
        y2="24"
        stroke={mascotColor}
        strokeWidth="0.9"
        strokeDasharray="2.5 3"
        strokeLinecap="round"
        opacity="0.65"
      />

      <g className="spider-body-group">
        {/* ══ PATAS (detrás del cuerpo) ══
            Wrapper escala el abanico de patas hacia el cefalotórax.
            Externo: traslación/espejo por atributo (persiste).
            Interno: rotación CSS animada (pivot en anclaje, coords del viewBox). */}
        <g transform="translate(40 33) scale(0.86) translate(-40 -33)">
        {LEG_PATHS.map((d, i) => (
          <g key={`r${i}`} transform={`translate(${ANCHORS_R[i][0]} ${ANCHORS_R[i][1]})`}>
            <g
              className={`spider-leg ${i % 2 === 0 ? 'spider-phase-a' : 'spider-phase-b'} spider-leg-${i}`}
              style={{ transformOrigin: `${ANCHORS_R[i][0]}px ${ANCHORS_R[i][1]}px` }}
            >
              <path d={d} fill="none" stroke={mascotColor} strokeWidth="2.3" strokeLinecap="round" className="spider-leg-stroke" />
            </g>
          </g>
        ))}
        {/* Lado izquierdo (espejo) */}
        {LEG_PATHS.map((d, i) => (
          <g key={`l${i}`} transform={`translate(${80 - ANCHORS_R[i][0]} ${ANCHORS_R[i][1]}) scale(-1 1)`}>
            <g
              className={`spider-leg ${i % 2 === 0 ? 'spider-phase-b' : 'spider-phase-a'} spider-leg-mirror-${i}`}
              style={{ transformOrigin: `${80 - ANCHORS_R[i][0]}px ${ANCHORS_R[i][1]}px` }}
            >
              <path d={d} fill="none" stroke={mascotColor} strokeWidth="2.3" strokeLinecap="round" className="spider-leg-stroke" />
            </g>
          </g>
        ))}
        </g>

        {/* ══ ABDOMEN ══ */}
        <ellipse className="spider-abdomen" cx="40" cy="54" rx="14.5" ry="12.5" fill={`url(#${gradientId})`} />
        {/* Brillo especular (ilusión 3D) */}
        <ellipse cx="34.5" cy="48.5" rx="5.5" ry="3.4" fill="#ffffff" opacity="0.14" transform="rotate(-18 34.5 48.5)" />
        {/* Marca dorsal sutil */}
        <path d="M40 44 Q43 52 40 62 Q37 52 40 44 Z" fill="#000000" opacity="0.18" />
        {/* Hileras (spinnerets) */}
        <circle cx="37.6" cy="66.2" r="1.1" fill={`rgb(${Math.max(0, r - 60)}, ${Math.max(0, g - 60)}, ${Math.max(0, b - 60)})`} />
        <circle cx="42.4" cy="66.2" r="1.1" fill={`rgb(${Math.max(0, r - 60)}, ${Math.max(0, g - 60)}, ${Math.max(0, b - 60)})`} />

        {/* Pedicelo (une cefalotórax y abdomen) */}
        <rect x="38.4" y="39.5" width="3.2" height="5" rx="1.4" fill={`rgb(${Math.max(0, r - 25)}, ${Math.max(0, g - 25)}, ${Math.max(0, b - 25)})`} />

        {/* ══ CEFALOTÓRAX ══ */}
        <circle cx="40" cy="33" r="9.5" fill={`url(#${gradientId})`} />
        <ellipse cx="36.8" cy="29.6" rx="3.6" ry="2.2" fill="#ffffff" opacity="0.16" transform="rotate(-20 36.8 29.6)" />

        {/* Ocelos menores (6 puntos, arco superior) */}
        <g filter={`url(#${glowId})`} className="spider-minor-eyes">
          <circle cx="33.2" cy="26.4" r="0.6" fill="#ffffff" opacity="0.9" />
          <circle cx="35.6" cy="24.9" r="0.6" fill="#ffffff" opacity="0.9" />
          <circle cx="38.4" cy="24.2" r="0.6" fill="#ffffff" opacity="0.9" />
          <circle cx="41.6" cy="24.2" r="0.6" fill="#ffffff" opacity="0.9" />
          <circle cx="44.4" cy="24.9" r="0.6" fill="#ffffff" opacity="0.9" />
          <circle cx="46.8" cy="26.4" r="0.6" fill="#ffffff" opacity="0.9" />
        </g>

        {/* ══ OJOS MAYORES (siguen el cursor) ══ */}
        <g className="spider-eye-main">
          <circle cx="36.2" cy="31.4" r="2.6" fill="#0d1117" stroke={mascotColor} strokeWidth="0.7" strokeOpacity="0.55" filter={`url(#${glowId})`} />
          <circle className="spider-pupil" cx="36.2" cy="31.4" r="1.35" fill="#eaf6ff"
            style={{ transform: `translate(${pupilShift.x}px, ${pupilShift.y}px)`, transition: 'transform 0.09s ease-out' }}
          />
          <circle cx="35.5" cy="30.6" r="0.5" fill="#ffffff" opacity="0.95" />
        </g>
        <g className="spider-eye-main">
          <circle cx="43.8" cy="31.4" r="2.6" fill="#0d1117" stroke={mascotColor} strokeWidth="0.7" strokeOpacity="0.55" filter={`url(#${glowId})`} />
          <circle className="spider-pupil" cx="43.8" cy="31.4" r="1.35" fill="#eaf6ff"
            style={{ transform: `translate(${pupilShift.x}px, ${pupilShift.y}px)`, transition: 'transform 0.09s ease-out' }}
          />
          <circle cx="43.1" cy="30.6" r="0.5" fill="#ffffff" opacity="0.95" />
        </g>

        {/* ══ COLMILLOS (tipean con el chat abierto) ══ */}
        <g className="spider-fangs" style={{ transformOrigin: '40px 41px' }}>
          <path className="spider-fang spider-fang-l" d="M37.4 40.5 Q36.6 43 38.2 44.2" fill="none" stroke={`rgb(${Math.max(0, r - 35)}, ${Math.max(0, g - 35)}, ${Math.max(0, b - 35)})`} strokeWidth="1.4" strokeLinecap="round" />
          <path className="spider-fang spider-fang-r" d="M42.6 40.5 Q43.4 43 41.8 44.2" fill="none" stroke={`rgb(${Math.max(0, r - 35)}, ${Math.max(0, g - 35)}, ${Math.max(0, b - 35)})`} strokeWidth="1.4" strokeLinecap="round" />
        </g>

        {/* Pedipalpos (mini-brazos junto a los colmillos) */}
        <path d="M34.8 39.5 Q33.2 42 34.8 43.4" fill="none" stroke={mascotColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
        <path d="M45.2 39.5 Q46.8 42 45.2 43.4" fill="none" stroke={mascotColor} strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
      </g>
    </svg>
  );
}
