'use client';

import { useInView } from '@/hooks/useInView';
import Link from 'next/link';

export function CTASection() {
  const [contentRef, contentInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });
  const [footerRef, footerInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });

  return (
    <section className="section relative overflow-hidden">
      <div className="absolute inset-0 -z-10 grid-bg opacity-50" aria-hidden="true" />

      <div className="section-container">
        <div
          ref={contentRef}
          className={`text-center max-w-3xl mx-auto ${contentInView ? 'animate-in' : 'anim-ready'} anim-fade-in-up`}
        >
          <h2 className="heading-1 mb-6">
            ¿Listo para <span className="text-[var(--accent)]">tu proyecto?</span>
          </h2>
          <p className="body-text text-[var(--muted)] mb-4">
            Cuéntame qué necesitas. Sin compromiso, solo una conversación técnica honesta.
          </p>
          <p className="font-mono text-sm text-[var(--accent)] mb-10">
            Desde $159 · Mantenimiento desde $35/mes
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact" className="btn-primary">
              Cotizar mi proyecto
            </Link>
            <a
              href="https://wa.me/51923593993?text=Hola%20Asahel%2C%20vi%20tu%20portafolio%20y%20quiero%20cotizar%20un%20proyecto"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              WhatsApp
            </a>
          </div>

          <div
            ref={footerRef}
            className={`mt-10 pt-10 border-t border-[var(--border)] ${footerInView ? 'animate-in' : 'anim-ready'} anim-fade-in-up`}
            style={{ animationDelay: '0.4s' }}
          >
            <p className="font-mono text-xs text-[var(--muted)]">
              Generalmente respondo en <span className="text-[var(--accent)]">menos de 24h</span>.
              Sin compromiso, solo una conversación técnica honesta.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
