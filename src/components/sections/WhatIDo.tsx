'use client';

import Link from 'next/link';
import { useInView } from '@/hooks/useInView';
import { Code, Database, Globe, Zap } from 'lucide-react';

const services = [
  {
    id: 'webapp',
    title: 'Páginas Web & Landing Pages',
    price: 'Desde $319',
    description:
      'Sitios web profesionales que convierten visitantes en clientes. Diseño responsive, SEO optimizado y carga ultrarrápida.',
    detail:
      'Next.js + TypeScript para rendimiento y SEO. Hosting en Cloudflare Pages. Dominio y SSL incluidos.',
    techStack: ['Next.js', 'TypeScript', 'Tailwind', 'Cloudflare'],
    relatedCaseStudySlug: undefined as string | undefined,
    icon: Globe,
  },
  {
    id: 'ecommerce',
    title: 'E-commerce & Tiendas Online',
    price: 'Desde $599',
    description:
      'Tiendas online completas con pasarela de pago, catálogo de productos y panel de administración.',
    detail:
      'Stripe para pagos seguros. Inventario, pedidos y facturación automatizada. Integración con WhatsApp Business.',
    techStack: ['Next.js', 'Stripe', 'PostgreSQL', 'Prisma'],
    relatedCaseStudySlug: 'ecommerce-platform',
    icon: Code,
  },
  {
    id: 'api',
    title: 'APIs & Sistemas a Medida',
    price: 'Cotizar',
    description: 'Dashboards SaaS, plataformas de integración y sistemas empresariales escalables.',
    detail:
      'APIs REST/GraphQL, autenticación, bases de datos. Arquitectura que crece con tu negocio.',
    techStack: ['Node.js', 'TypeScript', 'PostgreSQL', 'Redis'],
    relatedCaseStudySlug: 'api-integration-platform',
    icon: Database,
  },
  {
    id: 'performance',
    title: 'SEO & Performance',
    price: 'Desde $199',
    description:
      'Optimización de sitios existentes. Core Web Vitals, velocidad de carga y posicionamiento en Google.',
    detail:
      'Auditoría técnica completa. Implementación de mejoras medibles. Reporte antes/después.',
    techStack: ['Lighthouse', 'Web Vitals', 'Analytics', 'Next.js'],
    relatedCaseStudySlug: undefined as string | undefined,
    icon: Zap,
  },
];

export function WhatIDo() {
  const [headerRef, headerInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });
  const [cardsRef, cardsInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });

  return (
    <section id="servicios" className="section bg-[var(--bg-elevated)]">
      <div className="section-container">
        <div
          ref={headerRef}
          className={`mb-16 text-center ${headerInView ? 'animate-in' : 'anim-ready'} anim-fade-in-up`}
        >
          <p className="mb-4 font-mono text-sm text-[var(--accent)]">{'// SERVICIOS'}</p>
          <h2 className="heading-1 mb-6">
            ¿Qué puedo <span className="text-[var(--accent)]">hacer por ti?</span>
          </h2>
          <p className="body-text mx-auto max-w-2xl text-[var(--muted)]">
            Soluciones web claras, con precios transparentes y tecnología que escala.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4" ref={cardsRef}>
          {services.map((service, index) => (
            <article
              key={service.id}
              className={`card flex h-full flex-col p-4 md:p-6 lg:p-8 ${cardsInView ? 'animate-in' : 'anim-ready'} anim-fade-in-up`}
              style={{ animationDelay: `${0.1 + index * 0.1}s` }}
            >
              <div className="bg-[var(--accent)]/10 mb-4 flex h-10 w-10 items-center justify-center rounded-xl md:mb-6 md:h-12 md:w-12">
                <service.icon className="h-5 w-5 text-[var(--accent)] md:h-6 md:w-6" />
              </div>

              <div className="mb-2 flex items-center justify-between md:mb-3">
                <h3 className="md:heading-2 text-lg">{service.title}</h3>
              </div>
              <span className="bg-[var(--accent)]/10 mb-3 inline-block w-fit rounded-full px-3 py-1 font-mono text-xs text-[var(--accent)]">
                {service.price}
              </span>
              <p className="md:body-text mb-4 flex-1 text-sm text-[var(--muted)]">
                {service.description}
              </p>

              <div className="mb-4 hidden rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 md:block">
                <p className="mb-2 font-mono text-xs uppercase tracking-wider text-[var(--accent)]">
                  Incluye
                </p>
                <p className="text-sm text-[var(--muted)]">{service.detail}</p>
              </div>

              <div className="mb-6 hidden flex-wrap gap-2 md:flex">
                {service.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-1 font-mono text-xs text-[var(--muted)]"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <Link
                href="/contact"
                className="mt-auto inline-flex items-center gap-2 font-mono text-sm text-[var(--accent)] transition-opacity hover:opacity-80"
              >
                Cotizar ahora
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
              </Link>
            </article>
          ))}
        </div>

        {/* Mantenimiento */}
        <div
          className={`mt-12 text-center ${cardsInView ? 'animate-in' : 'anim-ready'} anim-fade-in-up`}
          style={{ animationDelay: '0.6s' }}
        >
          <div className="card inline-block p-6 md:p-8">
            <p className="mb-2 font-mono text-sm text-[var(--accent)]">Mantenimiento mensual</p>
            <p className="body-text mb-4 text-[var(--muted)]">
              Actualizaciones, backups, monitoreo y soporte técnico continuo.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <span className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2 font-mono text-sm">
                Básico: <span className="font-bold text-[var(--accent)]">$70/mes</span>
              </span>
              <span className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2 font-mono text-sm">
                Pro: <span className="font-bold text-[var(--accent)]">$100/mes</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
