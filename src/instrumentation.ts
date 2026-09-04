// Instrumentación Sentry para runtimes server y edge (Next.js 14 App Router)
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Captura de errores de request en el servidor
export const onRequestError = async (...args: unknown[]) => {
  try {
    const { captureRequestError } = await import('@sentry/nextjs');
    // @ts-expect-error - firma variable según versión de Next
    captureRequestError(...args);
  } catch {
    // Sentry no inicializado (sin DSN) — ignorar silenciosamente
  }
};
