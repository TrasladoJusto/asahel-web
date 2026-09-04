'use client';

import Link from 'next/link';
import { useInView } from '@/hooks/useInView';
import { Code, Database, Globe, Zap } from 'lucide-react';

const services = [
  {
    id: 'webapp',
    title: 'Aplicaciones Web Full-Stack',
    description: 'Next.js + TypeScript + PostgreSQL. Arquitectura escalable, SSR/SSG, SEO nativo, Core Web Vitals optimizados.',
    criterion: 'Next.js App Router para SEO y rendimiento. TypeScript end-to-end. PostgreSQL para datos relacionales complejos.',
    techStack: ['Next.js 14', 'TypeScript', 'PostgreSQL', 'Prisma', 'Tailwind'],
    relatedCaseStudySlug: 'ecommerce-platform',
    icon: Code,
  },
  {
    id: 'ecommerce',
    title: 'E-commerce & Marketplaces',
    description: 'Stripe Connect para marketplaces multi-vendor, carritos complejos, suscripciones, webhooks, PCI compliance.',
    criterion: 'Stripe Connect para marketplaces multi-vendor. Prisma para transacciones ACID. Webhooks idempotentes.',
    techStack: ['Next.js', 'Stripe Connect', 'PostgreSQL', 'Prisma', 'Webhooks'],
    relatedCaseStudySlug: 'ecommerce-platform',
    icon: Globe,
  },
  {
    id: 'api',
    title: 'APIs & Integraciones',
    description: 'REST/GraphQL APIs, webhooks idempotentes, cola de mensajes (RabbitMQ/BullMQ), rate limiting, OpenAPI specs.',
    criterion: 'Node.js + TypeScript para APIs. RabbitMQ/BullMQ para colas. OpenAPI + Orval para clientes tipados.',
    techStack: ['Node.js', 'TypeScript', 'RabbitMQ', 'BullMQ', 'OpenAPI', 'Zod'],
    relatedCaseStudySlug: 'api-integration-platform',
    icon: Database,
  },
  {
    id: 'performance',
    title: 'Performance & SEO Tecnico',
    description: 'Core Web Vitals optimization, Technical SEO, Analytics, A/B testing, Real User Monitoring.',
    criterion: 'Next.js Image + Font optimization. Lighthouse CI en CI/CD. Web Vitals RUM. Next.js Middleware para A/B.',
    techStack: ['Next.js', 'Lighthouse CI', 'Web Vitals', 'Vercel Analytics', 'PostHog'],
    relatedCaseStudySlug: 'saas-dashboard',
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
          className={`text-center mb-16 ${headerInView ? 'animate-in' : 'anim-ready'} anim-fade-in-up`}
        >
          <h2 className="heading-1 mb-6">
            Soluciones <span className="text-[var(--accent)]">a tu medida</span>
          </h2>
          <p className="body-text text-[var(--muted)] max-w-2xl mx-auto">
            Cuatro capacidades tecnicas con criterio de decision claro. Cada stack se elige por una razon tecnica, no por moda.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6" ref={cardsRef}>
          {services.map((service, index) => (
            <article
              key={service.id}
              className={`card p-4 md:p-6 lg:p-8 flex flex-col h-full ${cardsInView ? 'animate-in' : 'anim-ready'} anim-fade-in-up`}
              style={{ animationDelay: `${0.1 + index * 0.1}s` }}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[var(--accent)]/10 rounded-xl flex items-center justify-center mb-4 md:mb-6">
                <service.icon className="w-5 h-5 md:w-6 md:h-6 text-[var(--accent)]" />
              </div>

              <h3 className="text-lg md:heading-2 mb-2 md:mb-3">{service.title}</h3>
              <p className="text-sm md:body-text text-[var(--muted)] mb-4 flex-1">{service.description}</p>

              <div className="hidden md:block mb-4 p-4 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                <p className="font-mono text-xs text-[var(--accent)] uppercase tracking-wider mb-2">Criterio</p>
                <p className="text-sm text-[var(--muted)]">{service.criterion}</p>
              </div>

              <div className="hidden md:flex flex-wrap gap-2 mb-6">
                {service.techStack.map((tech) => (
                  <span key={tech} className="font-mono text-xs px-3 py-1 bg-[var(--bg)] border border-[var(--border)] rounded-full text-[var(--muted)]">
                    {tech}
                  </span>
                ))}
              </div>

              <Link
                href={`/work/${service.relatedCaseStudySlug}`}
                className="mt-auto inline-flex items-center gap-2 font-mono text-sm text-[var(--accent)] hover:opacity-80 transition-opacity"
              >
                Ver caso de estudio
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
