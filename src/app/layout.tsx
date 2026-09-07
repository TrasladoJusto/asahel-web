import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SkipLink } from '@/components/layout/SkipLink';
import { MascotWidget } from '@/components/mascot/MascotWidget';
import { PersonJsonLd, ProfessionalServiceJsonLd, WebsiteJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: {
    default: 'Asahel — Desarrollador Web Full-Stack en Lima, Perú',
    template: '%s | Asahel',
  },
  description:
    'Desarrollador web freelance en Lima, Perú. Creo páginas web, e-commerce y apps con Next.js, TypeScript y PostgreSQL. Desde $319. Cotiza tu proyecto.',
  keywords: [
    'desarrollador web Lima',
    'desarrollador web Perú',
    'creación de páginas web Lima',
    'agencia digital Perú',
    'desarrollo web freelance',
    'programador web Lima',
    'diseño de páginas web Perú',
    'Next.js developer Peru',
    'full-stack developer Lima',
    'creador de páginas web',
    'empresa desarrollo web Perú',
    'desarrollador web freelance Lima',
  ],
  authors: [{ name: 'Asahel', url: 'https://asaheldev.com' }],
  creator: 'Asahel',
  openGraph: {
    type: 'website',
    locale: 'es_PE',
    url: 'https://asaheldev.com',
    siteName: 'Asahel — Desarrollador Web Full-Stack',
    title: 'Asahel — Desarrollador Web Full-Stack en Lima, Perú',
    description:
      'Desarrollador web freelance en Lima, Perú. Páginas web, e-commerce y apps con Next.js. Desde $319.',
    images: [
      {
        url: 'https://asaheldev.com/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Asahel — Desarrollador Web Full-Stack en Lima, Perú',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Asahel — Desarrollador Web Full-Stack | Lima, Perú',
    description:
      'Desarrollador web full-stack: Next.js, TypeScript, PostgreSQL. Páginas web, e-commerce, SaaS.',
    images: ['https://asaheldev.com/images/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  metadataBase: new URL('https://asaheldev.com'),
};

export const viewport: Viewport = {
  themeColor: '#0a0a0b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="antialiased">
      <head>
        {/* Tipografías self-hosted (sin CDN de terceros): ver globals.css @font-face */}
        <link
          rel="preload"
          href="/fonts/HelveticaNowDisplay-Medium.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/HelveticaNowDisplay-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="canonical" href="https://asaheldev.com" />
      </head>
      <body className="antialiased">
        <PersonJsonLd />
        <ProfessionalServiceJsonLd />
        <WebsiteJsonLd />
        <SkipLink />
        {children}
        <MascotWidget />
      </body>
    </html>
  );
}
