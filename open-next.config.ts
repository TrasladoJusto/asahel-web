import { defineCloudflareConfig } from '@opennextjs/cloudflare';

/**
 * Config OpenNext para Cloudflare Workers.
 * Asset serving estático + RSC through Workers incremental cache (default KV/R2 opcional).
 */
export default defineCloudflareConfig({
  // incrementalCache: usar KV si deseas ISR persistente (opcional)
  // import R2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';
});
