import { Metadata } from 'next';
import { Hero } from '@/components/hero/Hero';
import { WhoIAm } from '@/components/sections/WhoIAm';
import { WhatIDo } from '@/components/sections/WhatIDo';
import { SelectedWork } from '@/components/sections/SelectedWork';
import { HowIWork } from '@/components/sections/HowIWork';
import { CTASection } from '@/components/sections/CTASection';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Desarrollador Web Full-Stack en Lima, Perú | Asahel',
  description: 'Desarrollador web full-stack en Lima, Perú. Especializado en Next.js, TypeScript, PostgreSQL. Creo páginas web, e-commerce, dashboards SaaS y APIs que escalan.',
};

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen bg-[var(--bg)]">
      <div data-mascot-color="#1d4ed8">
        <Hero />
      </div>
      <div data-mascot-color="#b91c1c">
        <WhoIAm />
      </div>
      <div data-mascot-color="#7c3aed">
        <WhatIDo />
      </div>
      <div data-mascot-color="#1e40af">
        <SelectedWork />
      </div>
      <div data-mascot-color="#991b1b">
        <HowIWork />
      </div>
      <div data-mascot-color="#6d28d9">
        <CTASection />
      </div>
      <Footer />
    </main>
  );
}