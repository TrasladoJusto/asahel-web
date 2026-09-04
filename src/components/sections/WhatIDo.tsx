'use client';

import Link from 'next/link';
import { useInView } from '@/hooks/useInView';
import { Code, Database, Globe, Zap } from 'lucide-react';

const services = [
  {
    id: 'webapp',
    title: 'Páginas Web & Landing Pages',
    price: 'Desde $159',
    description: 'Sitios web profesionales que convierten visitantes en clientes. Diseño responsive, SEO optimizado y carga ultrarrápida.',
    detail: 'Next.js + TypeScript para rendimiento y SEO. Hosting en Cloudflare Pages. Dominio y SSL incluidos.',
    techStack: ['Next.js', 'TypeScript', 'Tailwind', 'Cloudflare'],
    relatedCaseStudySlug: 'ecommerce-platform',
    icon: Globe,
  },
  {
    id: 'ecommerce',
    title: 'E-commerce & Tiendas Online',
    price: 'Desde $299',
    description: 'Tiendas online completas con pasarela de pago, catálogo de productos y panel de administración.',
    detail: 'Stripe para pagos seguros. Inventario, pedidos y facturación automatizada. Integración con WhatsApp Business.',
    techStack: ['Next.js', 'Stripe', 'PostgreSQL', 'Prisma'],
    relatedCaseStudySlug: 'ecommerce-platform',
    icon: Code,
  },
  {
    id: 'api',
    title: 'APIs & Sistemas a Medida',
    price: 'Cotizar',
    description: 'Dashboards SaaS, plataformas de integración y sistemas empresariales escalables.',
    detail: 'APIs REST/GraphQL, autenticación, bases de datos. Arquitectura que crece con tu negocio.',
    techStack: ['Node.js', 'TypeScript', 'PostgreSQL', 'Redis'],
    relatedCaseStudySlug: 'api-integration-platform',
    icon: Database,
  },
  {
    id: 'performance',
    title: 'SEO & Performance',
    price: 'Desde $99',
    description: 'Optimización de sitios existentes. Core Web Vitals, velocidad de carga y posicionamiento en Google.',
    detail: 'Auditoría técnica completa. Implementación de mejoras medibles. Reporte antes/después.',
    techStack: ['Lighthouse', 'Web Vitals', 'Analytics', 'Next.js'],
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
          <p className="font-mono text-sm text-[var(--accent)] mb-4">{"// SERVICIOS"}</p>
          <h2 className="heading-1 mb-6">
            ¿Qué puedo <span className="text-[var(--accent)]">hacer por ti?</span>
          </h2>
          <p className="body-text text-[var(--muted)] max-w-2xl mx-auto">
            Soluciones web claras, con precios transparentes y tecnología que escala.
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

              <div className="flex items-center justify-between mb-2 md:mb-3">
                <h3 className="text-lg md:heading-2">{service.title}</h3>
              </div>
              <span className="inline-block font-mono text-xs px-3 py-1 bg-[var(--accent)]/10 text-[var(--accent)] rounded-full mb-3 w-fit">
                {service.price}
              </span>
              <p className="text-sm md:body-text text-[var(--muted)] mb-4 flex-1">{service.description}</p>

              <div className="hidden md:block mb-4 p-4 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                <p className="font-mono text-xs text-[var(--accent)] uppercase tracking-wider mb-2">Incluye</p>
                <p className="text-sm text-[var(--muted)]">{service.detail}</p>
              </div>

              <div className="hidden md:flex flex-wrap gap-2 mb-6">
                {service.techStack.map((tech) => (
                  <span key={tech} className="font-mono text-xs px-3 py-1 bg-[var(--bg)] border border-[var(--border)] rounded-full text-[var(--muted)]">
                    {tech}
                  </span>
                ))}
              </div>

              <Link
                href="/contact"
                className="mt-auto inline-flex items-center gap-2 font-mono text-sm text-[var(--accent)] hover:opacity-80 transition-opacity"
              >
                Cotizar ahora
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
          <div className="inline-block card p-6 md:p-8">
            <p className="font-mono text-sm text-[var(--accent)] mb-2">Mantenimiento mensual</p>
            <p className="body-text text-[var(--muted)] mb-4">
              Actualizaciones, backups, monitoreo y soporte técnico continuo.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <span className="font-mono text-sm px-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
                Básico: <span className="text-[var(--accent)] font-bold">$35/mes</span>
              </span>
              <span className="font-mono text-sm px-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
                Pro: <span className="text-[var(--accent)] font-bold">$50/mes</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
