'use client';

import { useInView } from '@/hooks/useInView';
import Link from 'next/link';

export function CTASection() {
  const [contentRef, contentInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });
  const [footerRef, footerInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });

  return (
    <section className="section relative overflow-hidden">
      <div className="absolute inset-0 -z-10 grid-bg opacity-50" aria-hidden="true" />
      {/* Scanline removed */}
      
      <div className="section-container">
        <div
          ref={contentRef}
          className={`text-center max-w-3xl mx-auto ${contentInView ? 'animate-in' : 'anim-ready'} anim-fade-in-up`}
        >
          <h2 className="heading-1 mb-6">
            Hablemos de tu <span className="text-[var(--accent)]">próximo proyecto</span>
          </h2>
          <p className="body-text text-[var(--muted)] mb-10">
            Tienes la visión, yo la experiencia técnica. Construyamos algo que escale.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact" className="btn-primary">
              Hablemos
            </Link>
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
