'use client';

import { Terminal } from 'lucide-react';

interface BlurLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function BlurLabel({ children, className = '' }: BlurLabelProps) {
  return (
    <div
      className={`anim-mount-blur-in anim-delay-20 inline-flex items-center gap-2 px-4 py-2 font-mono text-sm ${className}`}
    >
      <Terminal className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
