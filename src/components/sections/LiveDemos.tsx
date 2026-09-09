'use client';

import { useInView } from '@/hooks/useInView';
import Image from 'next/image';

const demos = [
  {
    title: 'TechPro',
    subtitle: 'Servicio Técnico Médico',
    description:
      'Plataforma web completa para empresa de servicio técnico con catálogo de equipos, WhatsApp integrado y emails transaccionales.',
    image: '/images/case-study-techpro.svg',
    demoUrl: 'https://techpro-demo.asahel.workers.dev',
    color: '#3b82f6',
    features: ['Next.js 15', 'Cloudflare Workers', 'WhatsApp API'],
  },
  {
    title: 'La Sazón',
    subtitle: 'Restaurante Fine Dining',
    description:
      'Sitio web premium para restaurante de alta cocina con menú interactivo, reservas y animaciones sofisticadas.',
    image: '/images/case-study-lasazon.svg',
    demoUrl: 'https://la-sazon-demo.asahel.workers.dev',
    color: '#e5c476',
    features: ['Next.js 16', 'Framer Motion', 'Playwright'],
  },
];

export function LiveDemos() {
  const [headerRef, headerInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });
  const [demosRef, demosInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });

  return (
    <section className="bg-gradient-to-b from-[var(--bg)] to-[var(--bg-secondary)] py-24">
      <div className="container mx-auto px-5 sm:px-8 md:px-10">
        {/* Header */}
        <div
          ref={headerRef}
          className={`mb-16 text-center ${headerInView ? 'animate-in' : 'anim-ready'} anim-fade-in-up`}
        >
          <h2 className="heading-1 mb-6">
            Demos <span className="text-[var(--accent)]">en vivo</span>
          </h2>
          <p className="body-text mx-auto max-w-2xl text-[var(--muted)]">
            Explora mis proyectos funcionales. Cada demo está desplegada en producción y lista para
            interactuar.
          </p>
        </div>

        {/* Demo Cards */}
        <div ref={demosRef} className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
          {demos.map((demo, index) => (
            <div
              key={demo.title}
              className={`${demosInView ? 'animate-in' : 'anim-ready'} anim-fade-in-up`}
              style={{ animationDelay: `${0.1 + index * 0.2}s` }}
            >
              <a
                href={demo.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className="card hover:border-[var(--accent)]/30 h-full overflow-hidden p-0 transition-all duration-300">
                  {/* Image */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-[var(--bg-secondary)]">
                    <Image
                      src={demo.image}
                      alt={`${demo.title} demo`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Live badge */}
                    <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 backdrop-blur-sm">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                      <span className="font-mono text-xs text-white">En vivo</span>
                    </div>

                    {/* CTA overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 font-mono text-sm text-white backdrop-blur-sm">
                        <span>Abrir demo</span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: demo.color }}
                      />
                      <span className="font-mono text-xs uppercase tracking-wider text-[var(--muted)]">
                        {demo.subtitle}
                      </span>
                    </div>
                    <h3 className="heading-2 mb-3 transition-colors group-hover:text-[var(--accent)]">
                      {demo.title}
                    </h3>
                    <p className="body-text mb-4 text-sm text-[var(--muted)]">{demo.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {demo.features.map((feature) => (
                        <span
                          key={feature}
                          className="rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1 font-mono text-xs text-[var(--muted)]"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
