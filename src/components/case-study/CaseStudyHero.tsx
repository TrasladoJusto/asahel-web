'use client';

import { Navbar } from '@/components/layout/Navbar';

interface CaseStudyHeroProps {
  study: {
    title: string;
    shortDescription: string;
    thumbnail: string;
    tags: readonly string[];
  };
}

export function CaseStudyHero({ study }: CaseStudyHeroProps) {
  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 -z-10 grid-bg opacity-50" aria-hidden="true" />
      
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[var(--bg)]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={study.thumbnail}
          alt={study.title}
          className="w-full h-full object-cover opacity-15"
        />
      </div>

      <Navbar />
      
      <div className="container mx-auto px-5 sm:px-8 md:px-10 relative z-10 flex-1 flex items-center">
        <div className="max-w-4xl w-full">
          <div className="mb-8 anim-mount-fade-up">
            <div className="flex flex-wrap gap-2 mb-4">
              {study.tags.map((tag) => (
                <span key={tag} className="font-mono text-xs px-3 py-1 bg-[var(--bg)] border border-[var(--border)] rounded-full text-[var(--accent)]">
                  {tag}
                </span>
              ))}
            </div>
            <h1
              className="heading-1 mb-6 anim-mount-fade-up anim-delay-20"
            >
              {study.title}
            </h1>
            <p
              className="body-text text-[var(--muted)] max-w-2xl anim-mount-fade-up anim-delay-40"
            >
              {study.shortDescription}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}