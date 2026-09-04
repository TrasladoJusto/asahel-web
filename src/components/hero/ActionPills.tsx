'use client';

import { useState } from 'react';

interface OutlinePillProps {
  label: string;
  onClick?: () => void;
  className?: string;
}

function OutlinePill({ label, onClick, className = '' }: OutlinePillProps) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText('asahel20tj@hotmail.com');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onClick?.();
    } catch {
      // Fallback: select text for manual copy
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`pill-outline hover-lift anim-mount-fade-up ${className}`}
      type="button"
      style={{ animationDelay: '0.35s' }}
      aria-label={copied ? 'Copiado al portapapeles' : 'Copiar email'}
    >
      <span>{copied ? '¡Copiado!' : label}</span>
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {copied ? (
          <polyline points="20 6 9 17 4 12" />
        ) : (
          <>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </>
        )}
      </svg>
    </button>
  );
}

interface PillProps {
  label: string;
  href: string;
  delay: number;
}

function Pill({ label, href, delay }: PillProps) {
  const isLink = href.startsWith('/');
  
  if (isLink) {
    return (
      <a
        href={href}
        className="pill hover-lift anim-mount-fade-up focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
        style={{ animationDelay: `${delay}s` }}
      >
        {label}
      </a>
    );
  }
  
  return (
    <button
      className="pill hover-lift anim-mount-fade-up focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
      type="button"
      style={{ animationDelay: `${delay}s` }}
    >
      {label}
    </button>
  );
}

export function ActionPills() {
  const pills = [
    { label: 'Proponer una idea', href: '/contact?type=idea' },
    { label: 'Trabajar conmigo', href: '/contact?type=hire' },
    { label: 'Ver cómo trabajo', href: '/process' },
  ];

  return (
    <div className="pills-container flex-col sm:flex-row gap-2" role="group" aria-label="Acciones principales">
      {pills.map((pill, index) => (
        <Pill
          key={pill.label}
          label={pill.label}
          href={pill.href}
          delay={1.0 + index * 0.1}
        />
      ))}
      <OutlinePill
        label="asahel20tj@hotmail.com"
        className="sm:ml-auto"
      />
    </div>
  );
}
