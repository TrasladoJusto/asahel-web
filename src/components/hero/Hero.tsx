'use client';

import { useState, useEffect } from 'react';
import { HeroVideo } from './HeroVideo';
import { HeroContent } from './HeroContent';
import { Navbar } from '@/components/layout/Navbar';

export function Hero() {
  const videoSrc = '/video/hero-background.mp4';
  const videoPoster = '/video/hero-poster.jpg';
  const [videoExists, setVideoExists] = useState(false);

  useEffect(() => {
    fetch(videoSrc, { method: 'HEAD' })
      .then(r => { if (r.ok) setVideoExists(true); })
      .catch(() => {});
  }, [videoSrc]);

  return (
    <section className="relative min-h-[100dvh] flex flex-col overflow-hidden">
      {/* Background Video */}
      {videoExists && <HeroVideo src={videoSrc} poster={videoPoster} />}

      {/* Grid Decoration */}
      <div className="absolute inset-0 -z-10 pointer-events-none grid-bg" aria-hidden="true" />

      {/* Scanline removed — was a thin line cycling down the page */}

      {/* Navbar */}
      <Navbar />

      {/* Hero Content */}
      <div className="relative flex-1 flex items-center">
        <div className="container mx-auto px-5 sm:px-8 md:px-10 w-full">
          <div className="relative max-w-3xl mx-auto text-center">
            <HeroContent />
          </div>
        </div>
      </div>

      {/* Bottom Tagline */}
      <div
        className="anim-mount-fade-up anim-delay-150 absolute bottom-6 sm:bottom-12 left-0 right-0 px-5 sm:px-8 md:px-10"
      >
        <div className="hidden sm:flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-[var(--accent)]/50 to-transparent" />
          <p className="font-mono text-sm text-[var(--muted)]">
            {"Donde el "}
            <span className="text-[var(--accent)]">código</span>{" se encuentra con la "}
            <span className="text-[var(--accent)]">intención</span>
          </p>
          <div className="h-px flex-1 bg-gradient-to-l from-[var(--accent)]/50 to-transparent" />
        </div>
      </div>
    </section>
  );
}
