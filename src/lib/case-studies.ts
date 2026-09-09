export const caseStudies = [
  {
    slug: 'ecommerce-platform',
    title: 'Plataforma E-commerce Multi-vendor',
    shortDescription:
      'Marketplace B2B para proveedores industriales con pagos Stripe Connect y panel de administración.',
    thumbnail: '/images/case-study-ecommerce.svg',
    tags: ['Next.js', 'PostgreSQL', 'Stripe Connect', 'TypeScript'],
    featured: true,
    demoUrl: 'https://marketplace-demo-4cn.pages.dev',
    problem:
      'Necesidad de migrar de WooCommerce a una solución headless que soportara múltiples vendedores, comisiones automáticas y escalabilidad a 10k+ productos.',
    approach:
      'Arquitectura headless con Next.js 14 (App Router) + PostgreSQL + Stripe Connect para marketplace. Separación clara entre frontend (Next.js) y backend (API Routes + Prisma). Diseño negro con neón cian para la industria pesada.',
    techStack: [
      'Next.js 14',
      'TypeScript',
      'PostgreSQL',
      'Prisma ORM',
      'Stripe Connect',
      'Tailwind CSS',
      'Cloudflare Workers',
    ],
    keyDecisions: [
      {
        title: 'Next.js App Router vs Pages Router',
        context: 'Necesidad de SEO fuerte y rendimiento en mobile.',
        decision: 'App Router con Server Components para SEO y RSC para datos estáticos.',
        tradeoffs: 'Curva de aprendizaje del equipo, pero mejor Core Web Vitals y SEO nativo.',
      },
      {
        title: 'Stripe Connect vs Custom Billing',
        context: 'Marketplace multi-vendor con comisiones variables.',
        decision: 'Stripe Connect Standard para onboarding rápido y compliance PCI.',
        tradeoffs: 'Comisiones de Stripe (2.9% + 30¢) vs desarrollo custom (6+ meses).',
      },
      {
        title: 'Prisma vs Raw SQL',
        context: 'Equipo pequeño, iteración rápida, tipado end-to-end.',
        decision: 'Prisma para type-safety end-to-end y migraciones versionadas.',
        tradeoffs: 'Overhead de 15-20ms por query vs raw SQL, pero cero runtime type errors.',
      },
    ],
    outcome: {
      metrics: [
        { label: 'Tiempo de carga', value: '< 1.2s', description: 'LCP en mobile' },
        { label: 'Conversión checkout', value: '+34%', description: 'vs WooCommerce anterior' },
        { label: 'Tiempo desarrollo', value: '3 meses', description: 'vs 6+ estimado custom' },
      ],
      testimonial: 'Demo de arquitectura headless con marketplace multi-vendor.',
      client: 'Demo conceptual — Sin cliente real',
    },
  },
  {
    slug: 'saas-dashboard',
    title: 'Dashboard SaaS para Gestión de Proyectos',
    shortDescription: 'Dashboard colaborativo en tiempo real con Kanban, Gantt, chat y analytics.',
    thumbnail: '/images/case-study-dashboard.svg',
    tags: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'dnd-kit', 'Cloudflare Workers'],
    featured: true,
    demoUrl: 'https://dashboard-demo-91d.pages.dev',
    problem:
      'Demo conceptual: dashboard para equipos remotos con colaboración en tiempo real, kanban interactivo, diagrama Gantt, chat de equipo y métricas de productividad.',
    approach:
      'Next.js 16 + React 19 + dnd-kit para drag-and-drop nativo + Tailwind CSS 4. Panel lateral colapsable, 4 vistas (Kanban, Gantt, Analytics, Chat), estado global con Context API. Todo implementado con inline styles para consistencia.',
    techStack: [
      'Next.js 16',
      'React 19',
      'TypeScript',
      'Tailwind CSS',
      'dnd-kit',
      'Context API',
      'Cloudflare Workers',
    ],
    keyDecisions: [
      {
        title: 'WebSockets vs Server-Sent Events',
        context: 'Bidireccionalidad necesaria para edición colaborativa.',
        decision: 'Socket.io con fallback automático a polling.',
        tradeoffs:
          'Más complejidad en servidor vs SSE simple, pero necesario para edición concurrente.',
      },
      {
        title: 'Arquitectura Monolito Modular vs Microservicios',
        context: 'Equipo pequeño, velocidad de iteración crítica.',
        decision:
          'Monolito modular con separación clara de dominios (auth, projects, realtime, analytics).',
        tradeoffs: 'Despliegue único simple vs escalabilidad independiente futura.',
      },
    ],
    outcome: {
      metrics: [
        { label: 'Vistas interactivas', value: '4', description: 'Kanban, Gantt, Analytics, Chat' },
        { label: 'Componentes', value: '12+', description: 'Sidebar, Cards, Modals, etc.' },
        { label: 'Tiempo carga', value: '< 2s', description: 'En mobile' },
      ],
      testimonial:
        'Demo de dashboard colaborativo con drag-and-drop, Gantt interactivo y chat en tiempo real.',
      client: 'Demo conceptual — Sin cliente real',
    },
  },
  {
    slug: 'api-integration-platform',
    title: 'Plataforma de Integración API Unificada',
    shortDescription:
      'Middleware para conectar ERPs, CRMs y e-commerces con cola de mensajes y retry automático.',
    thumbnail: '/images/case-study-api.svg',
    tags: ['Node.js', 'TypeScript', 'RabbitMQ', 'PostgreSQL', 'OpenAPI'],
    featured: true,
    demoUrl: undefined,
    problem:
      'Empresa con 5+ sistemas desconectados (ERP, CRM, Shopify, MercadoLibre, facturación) necesitaba sincronización bidireccional confiable.',
    approach:
      'Middleware Node.js + TypeScript + RabbitMQ para cola de mensajes + PostgreSQL para estado + OpenAPI spec generation. Circuit breaker + retry exponencial + dead letter queue.',
    techStack: [
      'Node.js',
      'TypeScript',
      'RabbitMQ',
      'PostgreSQL',
      'Prisma',
      'OpenAPI 3.1',
      'Docker',
      'Kubernetes',
    ],
    keyDecisions: [
      {
        title: 'RabbitMQ vs Kafka',
        context: 'Volumen moderado (<100k msgs/día), necesidad de routing complejo y dead letter.',
        decision: 'RabbitMQ por routing flexible, TTL, DLX nativo y management UI.',
        tradeoffs: 'Kafka mejor para alto throughput, pero overkill para este volumen.',
      },
      {
        title: 'OpenAPI Code Generation vs Manual Clients',
        context: '5+ APIs externas con specs cambiantes.',
        decision: 'Orval para generar clientes TypeScript + Zod schemas desde OpenAPI specs.',
        tradeoffs:
          'Setup inicial vs cero drift entre spec y cliente, regeneración automática en CI.',
      },
    ],
    outcome: {
      metrics: [
        { label: 'Uptime', value: '99.97%', description: 'Últimos 12 meses' },
        { label: 'Tiempo sync', value: '< 30s', description: 'End-to-end promedio' },
        { label: 'Errores manuales', value: '-95%', description: 'vs procesos manuales previos' },
      ],
      testimonial: 'Demo de middleware para integración de múltiples sistemas.',
      client: 'Demo conceptual — Sin cliente real',
    },
  },
  {
    slug: 'traslado-justo',
    title: 'Traslado Justo - Transporte Aeropuerto',
    shortDescription:
      'Demo de sitio web de servicios de traslado al aeropuerto con mapa interactivo, reserva por WhatsApp y perfiles de conductores.',
    thumbnail: '/images/case-study-traslado.svg',
    tags: ['HTML', 'CSS', 'JavaScript', 'Leaflet', 'WhatsApp API'],
    featured: true,
    demoUrl: undefined,
    problem:
      'Demo conceptual: negocio de transporte necesitaba presencia digital con mapa interactivo, reserva fácil y perfiles de conductores.',
    approach:
      'Sitio web estático con Leaflet + Nominatim (gratuito) + OSRM para rutas, integración WhatsApp, y diseño responsive mobile-first.',
    techStack: ['HTML5', 'CSS3', 'JavaScript', 'Leaflet.js', 'Nominatim', 'OSRM', 'WhatsApp API'],
    keyDecisions: [
      {
        title: 'Leaflet + Nominatim vs Mapbox',
        context: 'Mapa interactivo con geocodificación y rutas sin costo de API.',
        decision: 'Leaflet con Nominatim (gratuito) y OSRM para rutas.',
        tradeoffs: 'Menor personalización visual vs Mapbox, pero cero costo operativo.',
      },
      {
        title: 'WhatsApp como canal de reserva',
        context: 'Canal de comunicación directa sin sistema backend.',
        decision: 'Integración wa.me con mensaje predefinido.',
        tradeoffs: 'No hay persistencia de datos vs sistema propio, pero cero mantenimiento.',
      },
      {
        title: 'HTML/CSS/JS vs Framework',
        context: 'Sitio estático simple que no necesita SSR ni build step.',
        decision: 'HTML + CSS + JavaScript vanilla para máximo control y mínimo peso.',
        tradeoffs: 'No hay componentes reutilizables vs React, pero carga instantánea.',
      },
    ],
    outcome: {
      metrics: [
        { label: 'Peso total', value: '< 500KB', description: 'Sin imágenes' },
        {
          label: 'Páginas',
          value: '15',
          description: 'Home, Servicios, Precios, Contacto, 9 conductores, etc.',
        },
        { label: 'Mapa', value: 'Gratuito', description: 'Leaflet + Nominatim + OSRM' },
      ],
      testimonial: 'Demo de sitio estático con mapa interactivo y integración WhatsApp.',
      client: 'Demo conceptual — Sin cliente real',
    },
  },
  {
    slug: 'la-sazon-demo',
    title: 'La Sazón - Restaurante Fine Dining',
    shortDescription:
      'Plataforma web premium para restaurante de alta cocina con menú interactivo, reservas en línea, galería fotográfica y sistema de eventos.',
    thumbnail: '/images/case-study-lasazon.svg',
    tags: ['Next.js', 'React', 'Tailwind CSS', 'Framer Motion', 'Cloudflare Workers'],
    featured: true,
    demoUrl: 'https://la-sazon-demo.asahel.workers.dev',
    problem:
      'Restaurante fine dining necesitaba presencia digital premium con reservas en línea, menú interactivo, galería visual impactante y sistema de eventos corporativos.',
    approach:
      'Next.js 16 + React 19 + Tailwind CSS 4 + Framer Motion. Dark theme luxury con acentos dorados, glassmorphism, Ken Burns hero, scroll-reveal y masonry gallery.',
    techStack: [
      'Next.js 16',
      'React 19',
      'TypeScript',
      'Tailwind CSS 4',
      'Framer Motion',
      'React Hook Form',
      'Zod',
      'Cloudflare Workers',
    ],
    keyDecisions: [
      {
        title: 'Dark Luxury Theme vs Light Elegant',
        context: 'Identidad de marca oscura y dorada para fine dining.',
        decision:
          'Tema oscuro (#16130e) con acentos dorados (#e5c476) para transmitir exclusividad.',
        tradeoffs:
          'Mayor consumo de batería en mobile vs tema claro, pero identidad de marca más fuerte.',
      },
      {
        title: 'Framer Motion vs CSS Animations',
        context: 'Animaciones sofisticadas: Ken Burns hero, scroll-reveal, hover effects.',
        decision: 'Framer Motion para control fino con soporte prefers-reduced-motion.',
        tradeoffs: 'Bundle size +15KB vs CSS puro, pero animaciones más complejas y mantenibles.',
      },
      {
        title: 'Testing con Playwright',
        context: 'Necesidad de testing end-to-end para formulario de reservas y navegación.',
        decision: 'Playwright con 80 tests covering 4 rutas × 6 breakpoints.',
        tradeoffs: 'Setup inicial vs testing manual, pero regresiones detectadas automáticamente.',
      },
    ],
    outcome: {
      metrics: [
        { label: 'Tests passing', value: '80/80', description: 'Playwright E2E' },
        { label: 'Lighthouse', value: '98/100', description: 'Performance' },
        { label: 'Tiempo carga', value: '< 1.5s', description: 'Mobile LCP' },
      ],
      testimonial:
        'Demo de diseño luxury con stack moderno, testing completo y deployment en edge.',
      client: 'Demo conceptual — Sin cliente real',
    },
  },
  {
    slug: 'techpro-demo',
    title: 'TechPro - Servicio Técnico Médico',
    shortDescription:
      'Plataforma web para empresa de servicio técnico médico con catálogo de equipos, formulario de contacto, WhatsApp integrado y blog de testimonios.',
    thumbnail: '/images/case-study-techpro.svg',
    tags: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Cloudflare Workers'],
    featured: true,
    demoUrl: 'https://techpro-demo.asahel.workers.dev',
    problem:
      'Empresa de servicio técnico médico necesitaba presencia digital profesional con catálogo de equipos, canal de comunicación directa por WhatsApp y generación de leads qualificados.',
    approach:
      'Next.js 15 (App Router) + Tailwind CSS v4 + Cloudflare Workers para deployment edge de alto rendimiento. Integración WhatsApp con mensaje predefinido por tipo de consulta.',
    techStack: [
      'Next.js 15',
      'React 19',
      'TypeScript',
      'Tailwind CSS v4',
      'Cloudflare Workers',
      'Resend',
      'WhatsApp API',
    ],
    keyDecisions: [
      {
        title: 'Cloudflare Workers vs Vercel',
        context: 'Necesidad de hosting con costo mínimo para demo.',
        decision: 'Cloudflare Workers con OpenNext para serverless edge deployment.',
        tradeoffs:
          'Menor ecosistema que Vercel, pero costo operativo casi nulo y latencia global mínima.',
      },
      {
        title: 'WhatsApp como canal principal',
        context: 'Clientes de servicio técnico prefieren WhatsApp para consultas.',
        decision: 'Integración wa.me con mensaje predefinido por tipo de consulta.',
        tradeoffs: 'Dependencia de WhatsApp vs sistema de tickets, pero adopción instantánea.',
      },
      {
        title: 'Resend para emails transaccionales',
        context: 'Formulario de contacto necesitaba envío de emails confiable.',
        decision: 'Resend con template HTML personalizado para notificaciones.',
        tradeoffs:
          'Gratuito hasta 100 emails/día vs SendGrid, pero interfaz más limpia y setup más simple.',
      },
    ],
    outcome: {
      metrics: [
        { label: 'Tiempo de carga', value: '< 2s', description: 'En mobile' },
        { label: 'Uptime', value: '99.9%', description: 'Cloudflare edge' },
        { label: 'Costo', value: '$0', description: 'Hosting gratuito' },
      ],
      testimonial:
        'Demo de sitio full-stack con integración WhatsApp y emails transaccionales, desplegado en edge computing.',
      client: 'Demo conceptual — Sin cliente real',
    },
  },
] as const;
