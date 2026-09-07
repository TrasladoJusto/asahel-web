'use client';

import { useInView } from '@/hooks/useInView';
import { Terminal, Database, Globe, Smartphone } from 'lucide-react';

const skills = [
  { name: 'React / Next.js', level: 95 },
  { name: 'TypeScript', level: 90 },
  { name: 'Node.js', level: 85 },
  { name: 'Tailwind CSS', level: 95 },
  { name: 'PostgreSQL', level: 80 },
  { name: 'Three.js / WebGL', level: 70 },
];

const stats = [
  { icon: Terminal, value: '5+', label: 'Años Experiencia' },
  { icon: Globe, value: '6+', label: 'Tecnologías en Stack' },
  { icon: Database, value: '100%', label: 'Código Propio' },
  { icon: Smartphone, value: '100%', label: 'Tasa de Satisfacción' },
];

export function WhoIAm({
  headingLevel: HeadingTag = 'h2' as const,
}: {
  headingLevel?: 'h1' | 'h2';
}) {
  const [headerRef, headerInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });
  const [leftRef, leftInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });
  const [rightRef, rightInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });
  const [skillsRef, skillsInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });
  const [barsRef, barsInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });
  const [statsRef, statsInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });

  return (
    <section id="about" className="section">
      <div className="section-container">
        {/* Section Header */}
        <div
          ref={headerRef}
          className={`mb-16 text-center ${headerInView ? 'animate-in' : 'anim-ready'} anim-fade-in-up`}
        >
          <p className="mb-4 font-mono text-sm text-[var(--accent)]">{'// SOBRE MI'}</p>
          <HeadingTag className="heading-1 mb-6">
            Conoce al <span className="text-[var(--accent)]">desarrollador</span>
          </HeadingTag>
        </div>

        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left - Terminal Card */}
          <div
            ref={leftRef}
            className={`card p-8 ${leftInView ? 'animate-in' : 'anim-ready'} anim-fade-in-left`}
          >
            {/* Terminal Header */}
            <div className="mb-6 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[var(--accent)]" />
              <div className="bg-[var(--accent)]/60 h-3 w-3 rounded-full" />
              <div className="bg-[var(--accent)]/30 h-3 w-3 rounded-full" />
              <span className="ml-2 font-mono text-xs text-[var(--muted)]">about.ts</span>
            </div>

            {/* Terminal Content */}
            <div className="space-y-4 font-mono text-sm">
              <p>
                <span className="text-[var(--accent)]">const</span>{' '}
                <span className="text-[var(--accent)]">aboutMe</span> = {'{'}
              </p>
              <p className="pl-4">
                <span className="text-[var(--accent)]">name</span>: "Asahel",
              </p>
              <p className="pl-4">
                <span className="text-[var(--accent)]">role</span>: "Full-Stack Developer",
              </p>
              <p className="pl-4">
                <span className="text-[var(--accent)]">location</span>: "Lima, Perú",
              </p>
              <p className="pl-4">
                <span className="text-[var(--accent)]">focus</span>: "Clean code, scalable
                architecture, shipping products",
              </p>
              <p className="pl-4">
                <span className="text-[var(--accent)]">stack</span>: ["Next.js", "TypeScript",
                "PostgreSQL", "Three.js"],
              </p>
              <p className="pl-4">
                <span className="text-[var(--accent)]">values</span>: ["Ship fast", "Boring tech
                wins", "Own the outcome"],
              </p>
              <p>{'};'}</p>
            </div>

            {/* Description */}
            <div className="mt-8 space-y-4 text-[var(--muted)]">
              <p>
                Desarrollador full-stack con más de 5 años de experiencia construyendo productos
                digitales para startups y empresas en Perú y Latam.
              </p>
              <p>
                Mi enfoque: código limpio, arquitectura escalable y tecnologías probadas para
                entregar productos que no solo funcionan, sino que escalan.
              </p>
              <p>
                Next.js, TypeScript, PostgreSQL: herramientas que escalan sin sorpresas. Technology
                aburrida y probada {'>'} lo último de moda.
              </p>
            </div>
          </div>

          {/* Right - Skills & Stats */}
          <div
            ref={rightRef}
            className={`space-y-12 ${rightInView ? 'animate-in' : 'anim-ready'} anim-fade-in-right`}
          >
            {/* Skills */}
            <div>
              <h3 className="heading-2 mb-6">Stack Técnico</h3>
              <div className="space-y-4" ref={skillsRef}>
                {skills.map((skill, index) => (
                  <div
                    key={skill.name}
                    className={`${skillsInView ? 'animate-in' : 'anim-ready'} anim-fade-in-right-sm`}
                    style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                  >
                    <div className="mb-2 flex justify-between">
                      <span className="font-mono text-sm text-[var(--muted)]">{skill.name}</span>
                      <span className="font-mono text-sm text-[var(--accent)]">{skill.level}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--bg)]">
                      <div
                        ref={index === 0 ? barsRef : undefined}
                        className={`to-[var(--accent)]/60 progress-bar-fill h-full bg-gradient-to-r from-[var(--accent)] ${barsInView ? 'animate-in' : ''}`}
                        style={{ '--target-width': `${skill.level}%` } as React.CSSProperties}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4" ref={statsRef}>
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className={`card p-6 text-center ${statsInView ? 'animate-in' : 'anim-ready'} anim-fade-in-up`}
                    style={{ animationDelay: `${0.1 + index * 0.1}s` }}
                  >
                    <Icon className="mx-auto mb-3 h-6 w-6 text-[var(--accent)]" />
                    <p className="text-3xl font-bold text-[var(--accent)]">{stat.value}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
