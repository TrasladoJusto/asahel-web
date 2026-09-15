import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Solo /api/ — no listar /admin/ (fingerprinting innecesario; no existe esa ruta)
        disallow: ['/api/'],
      },
    ],
    sitemap: 'https://asahel.pages.dev/sitemap.xml',
    host: 'https://asahel.pages.dev',
  };
}
