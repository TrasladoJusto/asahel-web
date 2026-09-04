'use client';

import { useState, useEffect } from 'react';

const DEFAULT_COLOR = '#1d4ed8'; // azul oscuro — nunca verde

/** Color de la sección que cruza el punto medio del viewport (scroll-based, determinista) */
export function useSectionColor(): string {
  const [color, setColor] = useState(DEFAULT_COLOR);

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('[data-mascot-color]')
    );
    if (sections.length === 0) return;

    let ticking = false;

    const update = () => {
      ticking = false;
      const mid = window.scrollY + window.innerHeight * 0.5;
      let active = DEFAULT_COLOR;
      // La última sección cuyo top ya pasó el punto medio gana
      for (const s of sections) {
        if (s.offsetTop <= mid) {
          const c = s.getAttribute('data-mascot-color');
          if (c) active = c;
        }
      }
      setColor((prev) => (prev === active ? prev : active));
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return color;
}
