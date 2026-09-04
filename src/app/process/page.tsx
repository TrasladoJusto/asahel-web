import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { HowIWork } from '@/components/sections/HowIWork';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Proceso de Desarrollo',
  description: 'Mi proceso de desarrollo web: Discovery, Design System, Desarrollo continuo y Lanzamiento. 4 fases con deliverables reales para tu proyecto en Lima, Perú.',
  openGraph: {
    title: 'Proceso | Asahel — Desarrollador Web Lima',
    description: 'Metodología de desarrollo web: Discovery → Design → Build → Launch. Transparente y medible.',
    images: [{ url: 'https://asaheldev.com/images/og-image.png', width: 1200, height: 630 }],
  },
};

export default function ProcessPage() {
  return (
    <main id="main-content" className="min-h-screen bg-[var(--bg)]">
      <Navbar />
      <HowIWork headingLevel="h1" />
      <Footer />
    </main>
  );
}