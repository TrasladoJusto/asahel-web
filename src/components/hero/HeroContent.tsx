'use client';

import { BlurLabel } from './BlurLabel';
import { Typewriter } from './Typewriter';
import { ActionPills } from './ActionPills';

export function HeroContent() {
  return (
    <div className="space-y-8">
      {/* H1 for SEO - visually styled to match design */}
      <h1 className="sr-only" data-elementtiming="hero-h1">
        Asahel — Creo páginas web que generan clientes en Lima, Perú
      </h1>

      {/* Staggered entrance: each element enters with increasing delay for drama */}
      <div className="anim-mount-blur-in anim-delay-30">
        <BlurLabel>
          Hola, soy Asahel,<br />
          Desarrollador Full-Stack de Lima
        </BlurLabel>
      </div>

      <div className="anim-mount-fade-up anim-delay-60">
        <Typewriter
          text="Creo páginas web, e-commerce y apps que escalan. ¿Qué estamos construyendo?"
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