'use client';

import { useInView } from '@/hooks/useInView';

interface TechStackProps {
  techStack: readonly string[];
}

export function TechStack({ techStack }: TechStackProps) {
  const [headerRef, headerInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });
  const [pillsRef, pillsInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });

  return (
    <section className="section">
      <div className="section-container">
        <div
          ref={headerRef}
          className={`${headerInView ? 'animate-in' : 'anim-ready'} anim-fade-in-up text-center mb-12`}
        >
          <p className="font-mono text-sm text-[var(--accent)] mb-4">{"// STACK TECNOLÓGICO"}</p>
          <h2 className="heading-2 mb-4">Tecnologías elegidas con criterio</h2>
          <p className="body-text text-[var(--muted)] max-w-2xl mx-auto">
            Cada tecnología se elige por una razón técnica concreta, no por moda.
          </p>
        </div>

        <div ref={pillsRef} className="flex flex-wrap justify-center gap-3">
          {techStack.map((tech, index) => (
            <span
              key={tech}
              className={`${pillsInView ? 'animate-in' : 'anim-ready'} anim-scale-in font-mono text-sm px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-full text-[var(--fg)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors`}
              style={{ animationDelay: `${0.6 + index * 0.05}s` }}
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}