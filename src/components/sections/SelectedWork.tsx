'use client';

import { useInView } from '@/hooks/useInView';
import Link from 'next/link';
import Image from 'next/image';
import { caseStudies } from '@/lib/case-studies';

export function SelectedWork({ headingLevel: HeadingTag = 'h2' as const }: { headingLevel?: 'h1' | 'h2' }) {
  const featured = caseStudies.filter(cs => cs.featured);
  const others = caseStudies.filter(cs => !cs.featured);

  const [headerRef, headerInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });
  const [featuredRef, featuredInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });
  const [cardsRef, cardsInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });
  const [ctaRef, ctaInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });

  return (
    <section id="portfolio" className="section">
      <div className="section-container">
        {/* Section Header */}
        <div
          ref={headerRef}
          className={`text-center mb-16 ${headerInView ? 'animate-in' : 'anim-ready'} anim-fade-in-up`}
        >
          <HeadingTag className="heading-1 mb-6">
            Proyectos <span className="text-[var(--accent)]">destacados</span>
          </HeadingTag>
          <p className="body-text text-[var(--muted)] max-w-2xl mx-auto">
            Casos de estudio con criterio técnico, decisiones de arquitectura y resultados medibles.
          </p>
        </div>

        {/* Featured Project */}
        {featured.length > 0 && (
          <div
            ref={featuredRef}
            className={`mb-16 ${featuredInView ? 'animate-in' : 'anim-ready'} anim-fade-in-up`}
          >
            <Link href={`/work/${featured[0].slug}`} className="group block">
              <div className="card p-0 overflow-hidden relative">
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={featured[0].thumbnail}
                    alt={`${featured[0].title} - Project thumbnail`}
                    fill
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    priority
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-6 left-6 right-6 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 translate-y-0 md:translate-y-4 md:group-hover:translate-y-0">
                    <div className="flex items-center justify-center gap-4">
                      <span className="font-mono text-xs px-4 py-2 bg-[var(--bg)]/80 backdrop-blur-sm border border-[var(--border)] rounded-full text-[var(--fg)]">
                        Ver proyecto
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {featured[0].tags.map((tag) => (
                      <span key={tag} className="font-mono text-xs px-3 py-1 bg-[var(--bg)] border border-[var(--border)] rounded-full text-[var(--accent)]">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="heading-2 mb-3">{featured[0].title}</h3>
                  <p className="body-text text-[var(--muted)] mb-6">{featured[0].shortDescription}</p>
                  <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
                    <span className="font-mono">Leer caso completo</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Other Projects Grid */}
        <div className="grid md:grid-cols-2 gap-8" ref={cardsRef}>
          {others.map((project, index) => (
            <div
              key={project.slug}
              className={`${cardsInView ? 'animate-in' : 'anim-ready'} anim-fade-in-up`}
              style={{ animationDelay: `${0.1 + index * 0.1}s` }}
            >
              <Link href={`/work/${project.slug}`} className="group block">
                <div className="card p-0 overflow-hidden h-full">
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={project.thumbnail}
                      alt={`${project.title} - Project thumbnail`}
                      fill
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-4 left-4 right-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 translate-y-0 md:translate-y-4 md:group-hover:translate-y-0">
                      <div className="flex items-center justify-center gap-4">
                        <span className="font-mono text-xs px-3 py-1 bg-[var(--bg)]/80 backdrop-blur-sm border border-[var(--border)] rounded-full text-[var(--fg)]">
                          Ver proyecto
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {project.tags.map((tag) => (
                        <span key={tag} className="font-mono text-xs px-3 py-1 bg-[var(--bg)] border border-[var(--border)] rounded-full text-[var(--accent)]">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="heading-2 mb-3">{project.title}</h3>
                    <p className="body-text text-[var(--muted)] mb-4">{project.shortDescription}</p>
                    <div className="flex items-center gap-2 text-sm text-[var(--accent)] font-mono">
                      Ver caso de estudio
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
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
          className={`text-center mt-12 ${ctaInView ? 'animate-in' : 'anim-ready'} anim-fade-in-up`}
        >
          <Link href="/work" className="btn-outline">
            Ver todos los proyectos
          </Link>
        </div>
      </div>
    </section>
  );
}
