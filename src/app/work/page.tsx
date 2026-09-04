import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { SelectedWork } from '@/components/sections/SelectedWork';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Trabajos y Portafolio',
  description: 'Portafolio de proyectos reales: e-commerce con Stripe Connect, dashboards SaaS en tiempo real, plataformas de integración API. Desarrollador web full-stack en Lima, Perú.',
  openGraph: {
    title: 'Portafolio | Asahel — Desarrollador Web Lima Perú',
    description: 'Casos de estudio reales: e-commerce, SaaS, APIs. Código limpio, arquitectura escalable, resultados medibles.',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630 }],
  },
};

export default function WorkIndex() {
  return (
    <main id="main-content" className="min-h-screen bg-[var(--bg)]">
      <Navbar />
      <SelectedWork headingLevel="h1" />
      <Footer />
    </main>
  );
}