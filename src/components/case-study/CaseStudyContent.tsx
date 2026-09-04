'use client';

import { useInView } from '@/hooks/useInView';

interface CaseStudyContentProps {
  study: {
    problem: string;
    approach: string;
  };
}

export function CaseStudyContent({ study }: CaseStudyContentProps) {
  const [problemRef, problemInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });
  const [approachRef, approachInView] = useInView<HTMLDivElement>({ threshold: 0.1, once: true });

  return (
    <section className="section bg-[var(--bg-elevated)]">
      <div className="section-container">
        <div className="grid lg:grid-cols-2 gap-12">
          <div
            ref={problemRef}
            className={`${problemInView ? 'animate-in' : 'anim-ready'} anim-fade-in-left`}
          >
            <h2 className="heading-2 mb-4">El Problema</h2>
            <p className="body-text text-[var(--muted)]">{study.problem}</p>
          </div>
          
          <div
            ref={approachRef}
            className={`${approachInView ? 'animate-in' : 'anim-ready'} anim-fade-in-right anim-delay-20`}
          >
            <h2 className="heading-2 mb-4">El Enfoque</h2>
            <p className="body-text text-[var(--muted)]">{study.approach}</p>
          </div>
        </div>
      </div>
    </section>
  );
}