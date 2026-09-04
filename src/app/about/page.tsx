import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { WhoIAm } from '@/components/sections/WhoIAm';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Sobre Mí',
  description: 'Conoce a Asahel, desarrollador web full-stack con 5+ años de experiencia en Next.js, TypeScript y PostgreSQL. Especialista en arquitecturas escalables para startups y empresas en Lima, Perú.',
  openGraph: {
    title: 'Sobre Mí | Asahel — Desarrollador Web Full-Stack Lima',
    description: 'Desarrollador web full-stack con 5+ años. Next.js, TypeScript, PostgreSQL. Lima, Perú.',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630 }],
  },
};

export default function AboutPage() {
  return (
    <main id="main-content" className="min-h-screen bg-[var(--bg)]">
      <Navbar />
      <WhoIAm headingLevel="h1" />
      <Footer />
    </main>
  );
}