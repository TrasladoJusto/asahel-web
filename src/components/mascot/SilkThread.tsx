'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * SilkThread — Hilo de seda temporal que conecta el ancla superior con la araña.
 * SOLO visible durante la fase de entry (0-3.5s). Luego hace fade out.
 */
interface SilkThreadProps {
  spiderY: number;
  spiderX: number;
  color: string;
  visible: boolean;
}

export function SilkThread({ spiderY, spiderX, color, visible }: SilkThreadProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const posRef = useRef({ y: spiderY, x: spiderX });
  const colorRef = useRef(color);
  const timeRef = useRef(0);
  const rafRef = useRef(0);
  const [opacity, setOpacity] = useState(1);

  posRef.current = { y: spiderY, x: spiderX };
  colorRef.current = color;

  // Fade out when visible becomes false
  useEffect(() => {
    if (!visible) {
      // Start fade out
      let frame: number;
      let start: number | null = null;
      const duration = 800; // ms
      
      const fade = (now: number) => {
        if (!start) start = now;
        const progress = Math.min(1, (now - start) / duration);
        setOpacity(1 - progress);
        if (progress < 1) {
          frame = requestAnimationFrame(fade);
        }
      };
      
      frame = requestAnimationFrame(fade);
      return () => cancelAnimationFrame(frame);
    } else {
      setOpacity(1);
    }
  }, [visible]);

  const draw = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const paths = svg.querySelectorAll<SVGPathElement>('.silk-path');
    const anchorHalo = svg.querySelector<SVGCircleElement>('.anchor-halo');
    const anchorDot = svg.querySelector<SVGCircleElement>('.anchor-dot');
    const anchorGlow = svg.querySelector<SVGCircleElement>('.anchor-glow');

    const { y, x } = posRef.current;
    const col = colorRef.current;
    const w = window.innerWidth;
    const h = window.innerHeight;

    timeRef.current += 0.006;
    const t = timeRef.current;

    // Anclaje superior — misma X que el centro de la araña
    const spiderBtnSize = window.innerWidth >= 768 ? 120 : 96;
    const spiderCenterX = w - x - spiderBtnSize / 2;  // Centro real del botón
    const spiderCenterY = y * h + spiderBtnSize / 2;   // Centro real del botón
    
    const anchorX = spiderCenterX;  // Ancla arriba del centro de la araña
    const anchorY = 0;
    const spiderCX = anchorX + Math.sin(t * 0.4) * 2;  // Micro-movimiento
    const spiderCY = spiderCenterY;

    // Catenaria
    const threadLength = spiderCY - anchorY;
    const sagBase = Math.min(threadLength * 0.25, 120);

    const windSlow = Math.sin(t * 0.25) * sagBase * 1.0;
    const windMed  = Math.sin(t * 0.9) * sagBase * 0.3;
    const windFast = Math.sin(t * 2.8) * sagBase * 0.1;
    const windX = windSlow + windMed + windFast;

    const sagY = sagBase + Math.abs(windX) * 0.4;

    // Cubic bezier con 2 puntos de control
    const cp1x = anchorX + windX * 0.6;
    const cp1y = anchorY + (spiderCY - anchorY) * 0.3 + sagY * 0.7;
    const cp2x = spiderCX + windX * 0.2;
    const cp2y = anchorY + (spiderCY - anchorY) * 0.7 + sagY * 0.3;
    
    const d = `M ${anchorX} ${anchorY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${spiderCX} ${spiderCY}`;

    paths.forEach(p => p.setAttribute('d', d));

    // Ancla
    if (anchorHalo) { anchorHalo.setAttribute('cx', String(anchorX)); anchorHalo.setAttribute('cy', '0'); }
    if (anchorDot) { anchorDot.setAttribute('cx', String(anchorX)); anchorDot.setAttribute('cy', '0'); }
    if (anchorGlow) { anchorGlow.setAttribute('cx', String(anchorX)); anchorGlow.setAttribute('cy', '0'); }

    // Colores
    const stops = svg.querySelectorAll<SVGStopElement>('.silk-stop');
    stops.forEach(stop => stop.setAttribute('stop-color', col));
    const shadow = svg.querySelector<SVGPathElement>('.silk-shadow');
    if (shadow) shadow.setAttribute('stroke', col);

    // Fibras secundarias
    const fiber1 = svg.querySelector<SVGPathElement>('.silk-fiber-1');
    const fiber2 = svg.querySelector<SVGPathElement>('.silk-fiber-2');
    if (fiber1) {
      const off1 = Math.sin(t * 1.5) * 12 + 6;
      const d1 = `M ${anchorX + 3} ${anchorY} C ${cp1x + off1} ${cp1y - 3}, ${cp2x + off1 * 0.4} ${cp2y + 2}, ${spiderCX + 2} ${spiderCY - 2}`;
      fiber1.setAttribute('d', d1);
    }
    if (fiber2) {
      const off2 = Math.sin(t * 2.1 + 1.5) * 10 - 5;
      const d2 = `M ${anchorX - 2} ${anchorY} C ${cp1x + off2} ${cp1y + 3}, ${cp2x + off2 * 0.4} ${cp2y - 2}, ${spiderCX - 2} ${spiderCY + 1}`;
      fiber2.setAttribute('d', d2);
    }

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  // Don't render if fully faded out
  if (opacity <= 0) return null;

  const gradId = 'silk-grad';

  return (
    <svg
      ref={svgRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 45, width: '100vw', height: '100vh', opacity, transition: 'opacity 0.8s ease-out' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop className="silk-stop" offset="0%" stopColor={color} stopOpacity={0.5} />
          <stop className="silk-stop" offset="20%" stopColor={color} stopOpacity={0.85} />
          <stop className="silk-stop" offset="60%" stopColor={color} stopOpacity={1} />
          <stop className="silk-stop" offset="100%" stopColor={color} stopOpacity={0.9} />
        </linearGradient>
        <filter id="silk-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 1. Sombra */}
      <path className="silk-path silk-shadow" d="" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" opacity={0.2} />

      {/* 2. Hilo principal */}
      <path className="silk-path" d="" fill="none" stroke={`url(#${gradId})`} strokeWidth="4" strokeLinecap="round" filter="url(#silk-glow)" />

      {/* 3. Brillo central */}
      <path className="silk-path" d="" fill="none" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity={0.35} />

      {/* 4-5. Fibras secundarias */}
      <path className="silk-path silk-fiber-1" d="" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity={0.4} />
      <path className="silk-path silk-fiber-2" d="" fill="none" stroke={color} strokeWidth="1" strokeLinecap="round" opacity={0.25} />

      {/* Ancla superior */}
      <circle className="anchor-halo" cx="0" cy="0" r="18" fill={color} opacity={0.15} />
      <circle className="anchor-dot" cx="0" cy="0" r="7" fill={color} opacity={1} />
      <circle className="anchor-glow" cx="0" cy="0" r="3" fill="#ffffff" opacity={0.6} />
    </svg>
  );
}
