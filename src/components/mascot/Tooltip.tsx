'use client';

import { useState, useEffect } from 'react';

interface TooltipProps {
  text: string;
  onClose: () => void;
}

export function Tooltip({ text, onClose }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  return (
    <div 
      className={`
        absolute bottom-full right-0 mb-3 w-56
        bg-[var(--fg)] text-[var(--bg)] text-sm rounded-lg p-3
        transform transition-all duration-300
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
      `}
      role="tooltip"
    >
      <p>{text}</p>
      
      {/* Flecha */}
      <div className="absolute top-full right-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-[var(--fg)]" />
      
      {/* Botón cerrar */}
      <button
        onClick={onClose}
        className="absolute top-1 right-1 text-[var(--bg)]/60 hover:text-[var(--bg)] w-5 h-5 flex items-center justify-center"
        aria-label="Cerrar tooltip"
      >
        ×
      </button>
    </div>
  );
}
