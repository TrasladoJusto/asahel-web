'use client';

import { Navbar } from '@/components/layout/Navbar';
import Link from 'next/link';

interface CaseStudyHeroProps {
  study: {
    title: string;
    shortDescription: string;
    thumbnail: string;
    tags: readonly string[];
    demoUrl?: string;
  };
}

export function CaseStudyHero({ study }: CaseStudyHeroProps) {
  return (
    <section className="relative flex min-h-[80vh] items-center overflow-hidden">
      <div className="grid-bg absolute inset-0 -z-10 opacity-50" aria-hidden="true" />

      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[var(--bg)]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={study.thumbnail}
          alt={study.title}
          className="h-full w-full object-cover opacity-15"
        />
      </div>

      <Navbar />

      <div className="container relative z-10 mx-auto flex flex-1 items-center px-5 sm:px-8 md:px-10">
        <div className="w-full max-w-4xl">
          <div className="anim-mount-fade-up mb-8">
            <div className="mb-4 flex flex-wrap gap-2">
              {study.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-1 font-mono text-xs text-[var(--accent)]"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="heading-1 anim-mount-fade-up anim-delay-20 mb-6">{study.title}</h1>
            <p className="body-text anim-mount-fade-up anim-delay-40 mb-8 max-w-2xl text-[var(--muted)]">
              {study.shortDescription}
            </p>

            {/* Demo CTA Buttons */}
            <div className="anim-mount-fade-up anim-delay-60 flex flex-wrap gap-4">
              {study.demoUrl && (
                <a
                  href={study.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  <span>Ver Demo en Vivo</span>
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
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                  </svg>
                </a>
              )}
              <Link href="/work" className="btn-outline">
                <span>Ver Otros Proyectos</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
