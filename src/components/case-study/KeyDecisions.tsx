'use client';

import { useInView } from '@/hooks/useInView';

interface KeyDecision {
  readonly title: string;
  readonly context: string;
  readonly decision: string;
  readonly tradeoffs: string;
}

interface KeyDecisionsProps {
  decisions: ReadonlyArray<KeyDecision>;
}

export function KeyDecisions({ decisions }: KeyDecisionsProps) {
  const [headerRef, headerInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });
  const [cardsRef, cardsInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });

  return (
    <section className="section bg-[var(--bg-elevated)]">
      <div className="section-container">
        <div
          ref={headerRef}
          className={`${headerInView ? 'animate-in' : 'anim-ready'} anim-fade-in-up text-center mb-12`}
        >
          <p className="font-mono text-sm text-[var(--accent)] mb-4">{"// DECISIONES CLAVE"}</p>
          <h2 className="heading-1 mb-4">Decisiones de arquitectura con trade-offs reales</h2>
          <p className="body-text text-[var(--muted)] max-w-2xl mx-auto">
            Cada decisión técnica tiene un costo. Aquí documentamos el porqué y el trade-off.
          </p>
        </div>

        <div ref={cardsRef} className="space-y-6">
          {decisions.map((decision, index) => (
            <article
              key={decision.title}
              className={`${cardsInView ? 'animate-in' : 'anim-ready'} anim-fade-in-up card p-6 md:p-8`}
              style={{ animationDelay: `${0.6 + index * 0.1}s` }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-[var(--accent)]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]" aria-hidden="true">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
                  </svg>
                </div>
                <div>
                  <h3 className="heading-2">{decision.title}</h3>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 text-sm">
                <div>
                  <p className="font-mono text-xs text-[var(--accent)] uppercase tracking-wider mb-2">{"Contexto"}</p>
                  <p className="text-[var(--muted)]">{decision.context}</p>
                </div>
                <div>
                  <p className="font-mono text-xs text-[var(--accent)] uppercase tracking-wider mb-2">{"Decisión"}</p>
                  <p className="text-[var(--fg)] font-medium">{decision.decision}</p>
                </div>
                <div>
                  <p className="font-mono text-xs text-[var(--accent)] uppercase tracking-wider mb-2">{"Trade-offs"}</p>
                  <p className="text-[var(--muted)]">{decision.tradeoffs}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}