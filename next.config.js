/** @type {import('next').NextConfig} */

// Sentry: solo se envuelve si hay DSN configurado (evita build sin credenciales)
const hasSentry = !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
const { withSentryConfig } = require('@sentry/nextjs');

const sentryOptions = {
  // No bloquea el build por errores de sourcemaps
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  disableLogger: true,
  widenClientFileUpload: true,
};

const baseConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:all*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

const nextConfig = hasSentry ? withSentryConfig(baseConfig, sentryOptions) : baseConfig;

module.exports = nextConfig;