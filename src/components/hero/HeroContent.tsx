'use client';

import { BlurLabel } from './BlurLabel';
import { Typewriter } from './Typewriter';
import { ActionPills } from './ActionPills';

export function HeroContent() {
  return (
    <div className="space-y-8">
      {/* H1 for SEO - visually styled to match design */}
      <h1 className="sr-only">
        Asahel — Desarrollador Web Full-Stack en Lima, Perú | Next.js, TypeScript, PostgreSQL
      </h1>

      {/* Staggered entrance: each element enters with increasing delay for drama */}
      <div className="anim-mount-blur-in anim-delay-30">
        <BlurLabel>
          Hey there, meet Asahel,<br />
          Full-Stack Developer from Lima
        </BlurLabel>
      </div>

      <div className="anim-mount-fade-up anim-delay-60">
        <Typewriter
          text="Glad you stopped in. Good code tends to find us. Now, what are we building?"
          speed={38}
          startDelay={1200}
        />
      </div>

      <div className="anim-delay-100">
        <ActionPills />
      </div>
    </div>
  );
}
