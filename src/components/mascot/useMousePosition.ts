'use client';

import { useState, useEffect, useRef } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

export function useMousePosition(): MousePosition {
  const [position, setPosition] = useState<MousePosition>({ x: 0, y: 0 });
  const rafRef = useRef<number | undefined>(undefined);
  const lastUpdate = useRef<number>(0);

  useEffect(() => {
    // Solo en desktop: en mobile no hay hover
    const isDesktop = window.matchMedia('(hover: hover)').matches;
    if (!isDesktop) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Throttle a 60fps usando RAF
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const now = performance.now();
        if (now - lastUpdate.current >= 16.67) {
          // ~60fps
          setPosition({ x: e.clientX, y: e.clientY });
          lastUpdate.current = now;
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return position;
}
