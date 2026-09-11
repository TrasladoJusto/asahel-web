import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { WorkIndex } from '@/components/sections/WorkIndex';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Trabajos y Portafolio',
  description:
    'Portafolio de proyectos: e-commerce con Stripe, dashboards SaaS, plataformas de integración API, restaurantes, transporte. Desarrollador web freelance en Lima, Perú.',
  openGraph: {
    title: 'Portafolio | Asahel — Desarrollador Web Lima Perú',
    description:
      'Casos de estudio reales: e-commerce, SaaS, APIs, fine dining, transporte. Código limpio, arquitectura escalable, resultados medibles.',
    images: [{ url: 'https://asahel.pages.dev/images/og-image.png', width: 1200, height: 630 }],
  },
};

export default function WorkIndexPage() {
  return (
    <main id="main-content" className="min-h-screen bg-[var(--bg)]">
      <Navbar />
      <WorkIndex />
      <Footer />
    </main>
  );
}
