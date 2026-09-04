// Sentry Server-side config — asahel-web
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn && !dsn.includes('dummy')) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? 'local-dev',
  });
}
