export function PersonJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Asahel',
    url: 'https://asaheldev.com',
    jobTitle: 'Desarrollador Web Full-Stack',
    description:
      'Desarrollador web full-stack en Lima, Perú. Especializado en Next.js, TypeScript, PostgreSQL y arquitecturas escalables.',
    image: 'https://asaheldev.com/images/profile.jpg',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Lima',
      addressRegion: 'Lima',
      addressCountry: 'PE',
    },
    knowsAbout: [
      'Desarrollo Web',
      'Next.js',
      'TypeScript',
      'PostgreSQL',
      'Node.js',
      'React',
      'Tailwind CSS',
      'Prisma ORM',
      'Stripe Connect',
      'REST API',
      'GraphQL',
      'Docker',
      'Vercel',
      'Cloudflare',
    ],
    email: 'asahel20tj@hotmail.com',
    worksFor: {
      '@type': 'Organization',
      name: 'Freelance',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function ProfessionalServiceJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Asahel — Desarrollador Web Full-Stack',
    description:
      'Servicios de desarrollo web full-stack: creación de páginas web, e-commerce, dashboards SaaS, APIs y aplicaciones web escalables con Next.js, TypeScript y PostgreSQL en Lima, Perú.',
    url: 'https://asaheldev.com',
    image: 'https://asaheldev.com/images/og-image.png',
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Lima',
      addressRegion: 'Lima',
      addressCountry: 'PE',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -12.0464,
      longitude: -77.0428,
    },
    areaServed: {
      '@type': 'Country',
      name: 'Perú',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Servicios de Desarrollo Web',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Creación de Páginas Web',
            description:
              'Diseño y desarrollo de páginas web profesionales con Next.js, optimizadas para SEO y conversión.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Desarrollo E-commerce',
            description:
              'Tiendas online con Stripe Connect, carritos de compra y pasarelas de pago seguras.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Dashboards SaaS',
            description:
              'Paneles de control en tiempo real con WebSockets, drag-and-drop y analytics.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'APIs y Integraciones',
            description: 'APIs REST/GraphQL, integración con ERPs, CRMs y servicios de terceros.',
          },
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function WebsiteJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Asahel — Desarrollador Web Full-Stack en Lima, Perú',
    url: 'https://asaheldev.com',
    description:
      'Portafolio y servicios de desarrollo web. Next.js, TypeScript, PostgreSQL. Lima, Perú.',
    inLanguage: 'es',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/** Preguntas frecuentes — deben coincidir EXACTO con el bloque visible de /contact */
export const FAQ_ITEMS = [
  {
    q: '¿Cuánto cuesta una página web?',
    a: 'Depende del alcance: una landing page profesional desde $319; e-commerce desde $599; sistemas a medida se cotizan según complejidad. Mantenimiento mensual desde $70/mes. Siempre recibes presupuesto cerrado antes de empezar.',
  },
  {
    q: '¿Cuánto demora un proyecto?',
    a: 'Una landing page: 5-7 días. E-commerce: 2-4 semanas. Sistema a medida: 4-8 semanas. Trabajo con entregas semanales para que veas avances desde el día uno.',
  },
  {
    q: '¿La web es mía? ¿Qué pasa si dejamos de trabajar juntos?',
    a: 'El código, el dominio y todo el contenido son 100% tuyos. Recibes el repositorio completo y documentación; puedes migrarlo con cualquier desarrollador cuando quieras.',
  },
  {
    q: '¿Por qué Next.js y no WordPress?',
    a: 'Next.js carga en menos de 1 segundo, escala sin plugins y es más seguro. WordPress lo uso solo cuando el proyecto realmente lo necesita.',
  },
];

export function FaqJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
