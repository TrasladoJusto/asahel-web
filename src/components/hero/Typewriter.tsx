'use client';

import { useState, useEffect, useRef } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number;
  startDelay?: number;
  className?: string;
}

export function Typewriter({
  text,
  speed = 38,
  startDelay = 600,
  className = '',
}: TypewriterProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    // Reset diferido al próximo frame (evita setState síncrono en effect)
    const resetId = requestAnimationFrame(() => {
      setDisplayed('');
      setDone(false);
    });

    const timer = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        if (indexRef.current < text.length) {
          indexRef.current++;
          setDisplayed(text.slice(0, indexRef.current));
        } else {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setDone(true);
        }
      }, speed);
    }, startDelay);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearTimeout(timer);
      cancelAnimationFrame(resetId);
    };
  }, [text, speed, startDelay]);

  return (
    <p
      className={`typewriter-text ${className}`}
      aria-live="polite"
      aria-atomic="true"
      role="status"
    >
      {displayed}
      {!done && <span className="typewriter-cursor" aria-hidden="true" />}
    </p>
  );
}
