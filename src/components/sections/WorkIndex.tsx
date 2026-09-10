'use client';

import { useInView } from '@/hooks/useInView';
import Link from 'next/link';
import Image from 'next/image';
import { caseStudies } from '@/lib/case-studies';

export function WorkIndex() {
  const [headerRef, headerInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });
  const [cardsRef, cardsInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });
  const [ctaRef, ctaInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });

  return (
    <section id="portfolio" className="section">
      <div className="section-container">
        {/* Section Header */}
        <div
          ref={headerRef}
          className={`mb-16 text-center ${headerInView ? 'animate-in' : 'anim-ready'} anim-fade-in-up`}
        >
          <h1 className="heading-1 mb-6">
            Proyectos <span className="text-[var(--accent)]">completos</span>
          </h1>
          <p className="body-text mx-auto max-w-2xl text-[var(--muted)]">
            Casos de estudio con criterio técnico, decisiones de arquitectura y resultados medibles.
          </p>
        </div>

        {/* All Projects Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" ref={cardsRef}>
          {caseStudies.map((project, index) => (
            <div
              key={project.slug}
              className={`${cardsInView ? 'animate-in' : 'anim-ready'} anim-fade-in-up`}
              style={{ animationDelay: `${0.1 + index * 0.1}s` }}
            >
              <Link href={`/work/${project.slug}`} className="group block">
                <div className="card h-full overflow-hidden p-0">
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={project.thumbnail}
                      alt={`${project.title} - Project thumbnail`}
                      fill
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100" />
                    <div className="absolute bottom-4 left-4 right-4 translate-y-0 opacity-100 transition-opacity duration-300 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
                      <div className="flex items-center justify-center gap-4">
                        <span className="bg-[var(--bg)]/80 rounded-full border border-[var(--border)] px-3 py-1 font-mono text-xs text-[var(--fg)] backdrop-blur-sm">
                          Ver proyecto
                        </span>
                      </div>
                    </div>
                    {project.demoUrl && (
                      <div className="absolute right-4 top-4">
                        <span className="flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 font-mono text-[10px] text-green-400 backdrop-blur-sm">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                          En vivo
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="mb-3 flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-1 font-mono text-xs text-[var(--accent)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="heading-2 mb-3">{project.title}</h3>
                    <p className="body-text mb-4 text-[var(--muted)]">{project.shortDescription}</p>
                    <div className="flex items-center gap-2 font-mono text-sm text-[var(--accent)]">
                      Ver caso de estudio
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                      {project.demoUrl && (
                        <a
                          href={project.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="bg-[var(--accent)]/10 border-[var(--accent)]/30 hover:bg-[var(--accent)]/20 ml-auto rounded-full border px-3 py-1 text-xs transition-colors"
                        >
                          Demo →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* View More CTA */}
        <div
          ref={ctaRef}
          className={`mt-12 text-center ${ctaInView ? 'animate-in' : 'anim-ready'} anim-fade-in-up`}
        >
          <Link href="/work" className="btn-outline">
            Ver todos los proyectos
          </Link>
        </div>
      </div>
    </section>
  );
}