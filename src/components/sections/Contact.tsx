'use client';

import { useInView } from '@/hooks/useInView';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema, type ContactFormData } from '@/lib/validation';
import { projectTypeLabels, timelineLabels, budgetLabels } from '@/lib/validation';
import { Send, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';
import { useState } from 'react';

export function Contact({ headingLevel: HeadingTag = 'h2' as const }: { headingLevel?: 'h1' | 'h2' }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [headerRef, headerInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });
  const [leftRef, leftInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });
  const [infoRef, infoInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });
  const [rightRef, rightInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      hasDesign: false,
      hasBackend: false,
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitStatus('idle');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        reset();
        setSubmitStatus('success');
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      label: 'Email',
      value: 'asahel20tj@hotmail.com',
      href: 'mailto:asahel20tj@hotmail.com',
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      value: '+51 923 593 993',
      href: 'https://wa.me/51923593993?text=Hola%20Asahel%2C%20vi%20tu%20portafolio%20y%20quiero%20cotizar%20un%20proyecto',
    },
    {
      icon: MapPin,
      label: 'Ubicación',
      value: 'Lima, Perú',
      href: undefined,
    },
    {
      icon: Clock,
      label: 'Horario',
      value: 'Lun - Vie: 9:00 - 18:00',
      href: undefined,
    },
  ];

  return (
    <section id="contacto" className="section">
      <div className="section-container">
        {/* Section Header */}
        <div
          ref={headerRef}
          className={`text-center mb-16 ${headerInView ? 'animate-in' : 'anim-ready'} anim-fade-in-up`}
        >
          <p className="font-mono text-sm text-[var(--accent)] mb-4">{"// CONTACTO"}</p>
          <HeadingTag className="heading-1 mb-6">
            Hablemos de tu <span className="text-[var(--accent)]">proyecto</span>
          </HeadingTag>
          <p className="body-text text-[var(--muted)] max-w-2xl mx-auto">
            Completa el brief y te respondo en menos de 24h. Sin compromiso, solo una conversación técnica honesta.
          </p>
        </div>

        {submitStatus === 'success' && (
          <div
            className="card p-8 mb-12 text-center border-[var(--accent)] anim-mount-fade-up"
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--accent)] mx-auto mb-4" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11" />
            </svg>
            <h3 className="heading-2 mb-2">¡Mensaje enviado!</h3>
            <p className="text-[var(--muted)]">Te responderé en menos de 24h. Revisa tu email por si acaso.</p>
            <button
              onClick={() => setSubmitStatus('idle')}
              className="mt-4 btn-outline"
            >
              Enviar otro mensaje
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Left - Contact Info */}
          <div
            ref={leftRef}
            className={`space-y-8 ${leftInView ? 'animate-in' : 'anim-ready'} anim-fade-in-left`}
          >
            <div>
              <h3 className="heading-2 mb-4">Información de Contacto</h3>
              <p className="text-[var(--muted)]">
                Puedes contactarme a través de estos medios o simplemente completar el formulario.
              </p>
            </div>

            <div className="space-y-6" ref={infoRef}>
              {contactInfo.map((info, index) => {
                const Icon = info.icon;
                return (
                  <div
                    key={info.label}
                    className={`flex items-center gap-4 ${infoInView ? 'animate-in' : 'anim-ready'} anim-fade-in-left-sm`}
                    style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                  >
                    <div className="w-12 h-12 glass flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[var(--accent)]" />
                    </div>
                    <div>
                      <p className="font-mono text-xs text-[var(--muted)]">{info.label}</p>
                      {info.href ? (
                        <a
                          href={info.href}
                          target={info.href.startsWith('http') ? '_blank' : undefined}
                          rel={info.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                          className="text-[var(--fg)] hover:text-[var(--accent)] transition-colors"
                        >
                          {info.value}
                        </a>
                      ) : (
                        <p className="text-[var(--fg)]">{info.value}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Terminal Style Message */}
            <div className="glass-strong p-6 font-mono text-sm">
              <p className="text-[var(--accent)]">
                <span className="text-[var(--accent)]">$</span> echo "Gracias por tu interés"
              </p>
              <p className="text-[var(--muted)] mt-2">
                Tu proyecto es importante para mí. Respondo en menos de 24 horas.
              </p>
            </div>
          </div>

          {/* Right - Contact Form */}
          <div
            ref={rightRef}
            className={`${rightInView ? 'animate-in' : 'anim-ready'} anim-fade-in-right`}
          >            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="card p-8 space-y-6"
            >
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="label">NOMBRE</label>
                <input
                  id="name"
                  {...register("name")}
                  className="input"
                  placeholder="Tu nombre"
                />
                {errors.name && (
                  <p className="text-[var(--accent)] text-xs mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="label">EMAIL</label>
                <input
                  id="email"
                  {...register("email")}
                  type="email"
                  className="input"
                  placeholder="tu@email.com"
                />
                {errors.email && (
                  <p className="text-[var(--accent)] text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Project Type Field */}
              <div>
                <label htmlFor="projectType" className="label">TIPO DE PROYECTO</label>
                <select
                  id="projectType"
                  {...register("projectType")}
                  className="input"
                >
                  <option value="" disabled>Selecciona una opción</option>
                  {Object.entries(projectTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                {errors.projectType && (
                  <p className="text-[var(--accent)] text-xs mt-1">{errors.projectType.message}</p>
                )}
              </div>

              {/* Timeline Field */}
              <div>
                <label htmlFor="timeline" className="label">TIMELINE</label>
                <select
                  id="timeline"
                  {...register("timeline")}
                  className="input"
                >
                  <option value="" disabled>Selecciona una opción</option>
                  {Object.entries(timelineLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                {errors.timeline && (
                  <p className="text-[var(--accent)] text-xs mt-1">{errors.timeline.message}</p>
                )}
              </div>

              {/* Budget Field */}
              <div>
                <label htmlFor="budget" className="label">PRESUPUESTO (USD)</label>
                <select
                  id="budget"
                  {...register("budget")}
                  className="input"
                >
                  <option value="" disabled>Selecciona una opción</option>
                  {Object.entries(budgetLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                {errors.budget && (
                  <p className="text-[var(--accent)] text-xs mt-1">{errors.budget.message}</p>
                )}
              </div>

              {/* Has Design Field */}
              <div>
                <label className="label">{"¿TIENES DISEÑO?"}</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      {...register("hasDesign")}
                      value="true"
                      id="hasDesign-true"
                      aria-label="Sí, tengo diseños listos"
                      className="w-4 h-4 accent-[var(--accent)] border-[var(--border)]"
                    />
                    <span className="text-sm text-[var(--fg)]">Sí, tengo diseños listos</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      {...register("hasDesign")}
                      value="false"
                      id="hasDesign-false"
                      aria-label="No, necesito ayuda con diseño"
                      className="w-4 h-4 accent-[var(--accent)] border-[var(--border)]"
                    />
                    <span className="text-sm text-[var(--fg)]">No, necesito ayuda con diseño</span>
                  </label>
                </div>
                {errors.hasDesign && (
                  <p className="text-[var(--accent)] text-xs mt-1">{errors.hasDesign.message}</p>
                )}
              </div>

              {/* Has Backend Field */}
              <div>
                <label className="label">{"¿REQUIERE BACKEND/API?"}</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      {...register("hasBackend")}
                      value="true"
                      id="hasBackend-true"
                      aria-label="Sí, necesito API/Backend"
                      className="w-4 h-4 accent-[var(--accent)] border-[var(--border)]"
                    />
                    <span className="text-sm text-[var(--fg)]">Sí, necesito API/Backend</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      {...register("hasBackend")}
                      value="false"
                      id="hasBackend-false"
                      aria-label="Solo frontend"
                      className="w-4 h-4 accent-[var(--accent)] border-[var(--border)]"
                    />
                    <span className="text-sm text-[var(--fg)]">Solo frontend</span>
                  </label>
                </div>
                {errors.hasBackend && (
                  <p className="text-[var(--accent)] text-xs mt-1">{errors.hasBackend.message}</p>
                )}
              </div>

              {/* Message Field */}
              <div>
                <label htmlFor="description" className="label">{"DESCRIPCIÓN DEL PROYECTO"}</label>
                <textarea
                  id="description"
                  {...register("description")}
                  rows={5}
                  className="input resize-none"
                  placeholder="Cuéntame sobre tu proyecto: objetivos, usuarios, funcionalidades clave, retos técnicos..."
                />
                {errors.description && (
                  <p className="text-[var(--accent)] text-xs mt-1">{errors.description.message}</p>
                )}
              </div>

              {/* Honeypot anti-bot: invisible e inaccesible para humanos */}
              <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '0px', height: '0px', overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
                <label htmlFor="company">Company</label>
                <input id="company" type="text" tabIndex={-1} autoComplete="off" {...register('company')} style={{ position: 'absolute', left: '-9999px', opacity: 0, width: 0, height: 0 }} />
                <label htmlFor="website">Website</label>
                <input id="website" type="url" tabIndex={-1} autoComplete="off" {...register('website')} style={{ position: 'absolute', left: '-9999px', opacity: 0, width: 0, height: 0 }} />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 hover-lift"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>ENVIANDO...</span>
                  </>
                ) : (
                  <>
                    <span>ENVIAR BRIEF</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* FAQ — contenido + FAQPage schema (AEO/GEO) */}
        <div className="mt-24">
          <h3 className="heading-2 mb-8 text-center">
            Preguntas <span className="text-[var(--accent)]">frecuentes</span>
          </h3>
          <div className="grid md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
            {[
              ["¿Cuánto cuesta una página web?", "Depende del alcance: una landing page profesional desde $159; e-commerce desde $299; sistemas a medida se cotizan según complejidad. Mantenimiento mensual desde $35/mes. Siempre recibes presupuesto cerrado antes de empezar."],
              ["¿Cuánto demora un proyecto?", "Una landing page: 5-7 días. E-commerce: 2-4 semanas. Sistema a medida: 4-8 semanas. Trabajo con entregas semanales para que veas avances desde el día uno."],
              ["¿La web es mía? ¿Qué pasa si dejamos de trabajar juntos?", "El código, el dominio y todo el contenido son 100% tuyos. Recibes el repositorio completo y documentación; puedes migrarlo con cualquier desarrollador cuando quieras."],
              ["¿Por qué Next.js y no WordPress?", "Next.js carga en menos de 1 segundo, escala sin plugins y es más seguro. WordPress lo uso solo cuando el proyecto realmente lo necesita."],
            ].map(([q, a], i) => (
              <div key={i} className="card p-6">
                <p className="font-mono text-xs text-[var(--accent)] uppercase tracking-wider mb-3">{`PREGUNTA ${String(i + 1).padStart(2, '0')}`}</p>
                <h4 className="font-medium text-[var(--fg)] mb-2">{q}</h4>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
