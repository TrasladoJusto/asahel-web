'use client';

import { useInView } from '@/hooks/useInView';
import { MessageSquare, Palette, Code, Rocket } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Discovery & Arquitectura',
    description: 'Brief técnico profundo, definición de arquitectura, stack, estimación realista y plan de entrega.',
    deliverables: ['Brief técnico detallado', 'Diagrama de arquitectura', 'Stack decision log', 'Estimación por hitos', 'Plan de riesgos'],
    icon: MessageSquare,
    color: 'text-[var(--accent)]',
    borderClass: 'bg-[var(--accent)]/10 border-[var(--accent)]',
  },
  {
    number: '02',
    title: 'Design System & Prototipo',
    description: 'Design system coherente, componentes reutilizables, prototipo interactivo validado con stakeholders.',
    deliverables: ['Design system (tokens, componentes)', 'Prototipo interactivo (Figma)', 'Especificaciones de componentes', 'Guía de accesibilidad', 'Handoff a desarrollo'],
    icon: Palette,
    color: 'text-[var(--accent)]',
    borderClass: 'bg-[var(--accent)]/10 border-[var(--accent)]',
  },
  {
    number: '03',
    title: 'Desarrollo & Entrega Continua',
    description: 'Sprints semanales, CI/CD automatizado, code reviews, staging environment, demos semanales.',
    deliverables: ['Repo configurado (CI/CD)', 'Entorno staging funcional', 'Demostraciones semanales', 'Documentación técnica', 'Métricas de calidad'],
    icon: Code,
    color: 'text-[var(--accent)]',
    borderClass: 'bg-[var(--accent)]/10 border-[var(--accent)]',
  },
  {
    number: '04',
    title: 'Lanzamiento & Soporte',
    description: 'Deploy a producción, monitoreo, handoff de docs, capacitación, 30 días de soporte incluido.',
    deliverables: ['Deploy a producción', 'Monitoreo + alertas', 'Documentación completa', 'Capacitación al equipo', '30 días soporte post-launch'],
    icon: Rocket,
    color: 'text-[var(--accent)]',
    borderClass: 'bg-[var(--accent)]/10 border-[var(--accent)]',
  },
];

export function HowIWork({ headingLevel: HeadingTag = 'h2' as const }: { headingLevel?: 'h1' | 'h2' }) {
  const [headerRef, headerInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });
  const [stepsRef, stepsInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });

  return (
    <section id="proceso" className="section bg-[var(--bg-elevated)]">
      <div className="section-container">
        {/* Section Header */}
        <div
          ref={headerRef}
          className={`text-center mb-16 ${headerInView ? 'animate-in' : 'anim-ready'} anim-fade-in-up`}
        >
          <p className="font-mono text-sm text-[var(--accent)] mb-4">{"// PROCESO"}</p>
          <HeadingTag className="heading-1 mb-6">
            De la <span className="text-[var(--accent)]">idea</span> al <span className="text-[var(--accent)]">producto</span>
          </HeadingTag>
          <p className="body-text text-[var(--muted)] max-w-2xl mx-auto">
            Un proceso probado que reduce riesgo, acelera entrega y asegura calidad técnica.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative max-w-4xl mx-auto">
          {/* Vertical Line - left on mobile, centered on desktop */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--accent)] via-[var(--accent)]/50 to-[var(--accent)]/20" />

          {/* Steps */}
          <div className="space-y-12 md:space-y-16" ref={stepsRef}>
            {steps.map((step, index) => {
              const isEven = index % 2 === 0;
              const Icon = step.icon;

              return (
                <div
                  key={step.number}
                  className={`relative ${stepsInView ? 'animate-in' : 'anim-ready'} anim-fade-in-up`}
                  style={{ animationDelay: `${0.1 + index * 0.1}s` }}
                >
                  {/* Mobile: Single column layout */}
                  <div className="md:hidden">
                    {/* Icon circle - sits on the line */}
                    <div className="absolute left-4 -translate-x-1/2 z-10">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step.borderClass} hover-scale-icon`}
                      >
                        <Icon className={`w-5 h-5 ${step.color}`} />
                      </div>
                    </div>

                    {/* Card - offset from the line */}
                    <div className="ml-10">
                      <div className="card p-5 hover:border-[var(--accent)] transition-colors duration-300">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-xs text-[var(--muted)]">STEP</span>
                          <span className={`font-[var(--font-heading)] text-xl font-bold ${step.color}`}>
                            {step.number}
                          </span>
                        </div>
                        <h3 className="heading-2 mb-2">{step.title}</h3>
                        <p className="text-[var(--muted)] text-sm mb-4 leading-relaxed">{step.description}</p>

                        <ul className="space-y-2 text-sm text-[var(--muted)]">
                          {step.deliverables.map((deliverable, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-1.5 shrink-0" />
                              <span>{deliverable}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Desktop: Alternating layout */}
                  <div className="hidden md:flex items-center">
                    {/* Left side */}
                    <div className={`w-5/12 ${isEven ? 'pr-12 text-right' : ''}`}>
                      {isEven && (
                        <div className="card p-6 hover:border-[var(--accent)] transition-colors duration-300">
                          <div className="flex items-center gap-3 mb-3 justify-end">
                            <span className="font-mono text-xs text-[var(--muted)]">STEP</span>
                            <span className={`font-[var(--font-heading)] text-2xl font-bold ${step.color}`}>
                              {step.number}
                            </span>
                          </div>
                          <h3 className="heading-2 mb-2">{step.title}</h3>
                          <p className="text-[var(--muted)] text-sm mb-4 leading-relaxed">{step.description}</p>

                          <ul className="space-y-2 text-sm text-[var(--muted)]">
                            {step.deliverables.map((deliverable, i) => (
                              <li key={i} className="flex items-center gap-2 justify-end">
                                <span>{deliverable}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Center Icon */}
                    <div className="w-2/12 flex justify-center">
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${step.borderClass} z-10 hover-scale-icon`}
                      >
                        <Icon className={`w-6 h-6 ${step.color}`} />
                      </div>
                    </div>

                    {/* Right side */}
                    <div className={`w-5/12 ${!isEven ? 'pl-12 text-left' : ''}`}>
                      {!isEven && (
                        <div className="card p-6 hover:border-[var(--accent)] transition-colors duration-300">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="font-mono text-xs text-[var(--muted)]">STEP</span>
                            <span className={`font-[var(--font-heading)] text-2xl font-bold ${step.color}`}>
                              {step.number}
                            </span>
                          </div>
                          <h3 className="heading-2 mb-2">{step.title}</h3>
                          <p className="text-[var(--muted)] text-sm mb-4 leading-relaxed">{step.description}</p>

                          <ul className="space-y-2 text-sm text-[var(--muted)]">
                            {step.deliverables.map((deliverable, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                                <span>{deliverable}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
