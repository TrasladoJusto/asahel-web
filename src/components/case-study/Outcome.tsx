'use client';

import { useInView } from '@/hooks/useInView';


interface OutcomeProps {
  outcome: {
    metrics: ReadonlyArray<{
      readonly label: string;
      readonly value: string;
      readonly description?: string;
    }>;
    testimonial?: string;
    client?: string;
  };
}

export function Outcome({ outcome }: OutcomeProps) {
  const [headerRef, headerInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });
  const [metricsRef, metricsInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });
  const [testimonialRef, testimonialInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });
  const [actionsRef, actionsInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });

  return (
    <section className="section">
      <div className="section-container">
        <div
          ref={headerRef}
          className={`${headerInView ? 'animate-in' : 'anim-ready'} anim-fade-in-up text-center mb-12`}
        >
          <p className="font-mono text-sm text-[var(--accent)] mb-4">{"// RESULTADOS"}</p>
          <h2 className="heading-1 mb-4">Resultados medibles</h2>
          <p className="body-text text-[var(--muted)] max-w-2xl mx-auto">
            Métricas reales, no vanidad. Lo que importa al negocio.
          </p>
        </div>

        {/* Metrics Grid */}
        <div
          ref={metricsRef}
          className={`${metricsInView ? 'animate-in' : 'anim-ready'} anim-fade-in-up grid md:grid-cols-3 gap-6 mb-16`}
        >
          {outcome.metrics.map((metric, index) => (
            <article
              key={metric.label}
              className={`${metricsInView ? 'animate-in' : 'anim-ready'} anim-fade-in-up card p-6 md:p-8 text-center`}
              style={{ animationDelay: `${0.6 + index * 0.1}s` }}
            >
              <p className="heading-1 text-[var(--accent)] mb-2">{metric.value}</p>
              <p className="font-mono text-sm text-[var(--accent)] uppercase tracking-wider mb-2">{metric.label}</p>
              {metric.description && (
                <p className="text-[var(--muted)] text-sm mt-2">{metric.description}</p>
              )}
            </article>
          ))}
        </div>

        {/* Testimonial */}
        {outcome.testimonial && (
          <div
            ref={testimonialRef}
            className={`${testimonialInView ? 'animate-in' : 'anim-ready'} anim-fade-in-up card p-8 md:p-12 mb-12`}
          >
            <div className="max-w-3xl mx-auto">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)] mx-auto mb-6" aria-hidden="true">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <blockquote className="text-[var(--fg)] text-lg leading-relaxed mb-6 text-center">
                {'\u201C'}{outcome.testimonial}{'\u201D'}
              </blockquote>
              {outcome.client && (
                <cite className="font-mono text-sm text-[var(--muted)]">{"— "}{outcome.client}</cite>
              )}
            </div>
          </div>
        )}

        {/* Action Links */}
        <div
          ref={actionsRef}
          className={`${actionsInView ? 'animate-in' : 'anim-ready'} anim-fade-in-up flex flex-col sm:flex-row items-center justify-center gap-4`}
        >
          <a href="/contact" className="btn-primary">
            Iniciar tu proyecto
          </a>
        </div>
      </div>
    </section>
  );
}