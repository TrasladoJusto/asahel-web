import { Metadata } from 'next';
import { Contact } from '@/components/sections/Contact';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { FaqJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Contacto — Desarrollador Web en Lima',
  description:
    'Contacta a Asahel, desarrollador web freelance en Lima, Perú. Cotiza tu página web, e-commerce o app. Desde $319. Respondo en menos de 24h.',
  openGraph: {
    title: 'Contacto | Asahel — Desarrollador Web Lima Perú',
    description:
      'Cotiza tu proyecto de desarrollo web. Next.js, TypeScript, PostgreSQL. Respondo en menos de 24h.',
    images: [{ url: 'https://asahel.pages.dev/images/og-image.png', width: 1200, height: 630 }],
  },
};

export default function ContactPage() {
  return (
    <main id="main-content" className="min-h-screen bg-[var(--bg)]">
      <Navbar />
      <Contact headingLevel="h1" />
      <Footer />
      <FaqJsonLd />
    </main>
  );
}
