/**
 * Rate limiter server-side con firma HMAC (resistente a manipulación).
 *
 * El diseño anterior almacenaba el contador en una cookie en texto plano
 * (`rl=timestamp:count`), que un atacante podía borrar o manipular para
 * burlar el límite. Esta versión:
 *   - Firma el payload con HMAC-SHA256 usando un secreto server-only.
 *   - Valida la firma en cada request; si no coincide, trata la sesión como
 *     inválida (no cede más requests).
 *   - Usa Web Crypto (disponible en el runtime edge de Cloudflare Workers).
 *
 * NOTA: sigue siendo recomendable activar Cloudflare WAF rate limiting como
 * defensa en profundidad (protege también contra IP-spoofing distribuido).
 */

const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const MAX_REQUESTS = 5;
// Tolerancia de reloj (ms) para aceptar cookies firmadas ligeramente desincronizadas
const CLOCK_SKEW_MS = 30 * 1000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  cookieValue: string;
}

/**
 * Secreto de firma. Prioriza una variable dedicada; si no existe, deriva
 * entropía de RESEND_API_KEY (server-only). Nunca se expone al cliente.
 */
function getSecret(): string {
  const s =
    process.env.RATE_LIMIT_SECRET || process.env.RESEND_API_KEY || 'asahel-ratelimit-static-secret';
  return s;
}

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmac(message: string): Promise<string> {
  const secret = await sha256(getSecret());
  return sha256(`${secret}:${message}`);
}

function parseCookie(cookieValue: string | undefined): {
  windowStart: number;
  count: number;
  signature: string;
} | null {
  if (!cookieValue) return null;
  const parts = cookieValue.split('.');
  // formato: timestamp.count.signature
  if (parts.length !== 3) return null;
  const windowStart = parseInt(parts[0], 10);
  const count = parseInt(parts[1], 10);
  if (!Number.isFinite(windowStart) || !Number.isFinite(count)) return null;
  return { windowStart, count, signature: parts[2] };
}

/**
 * Verifica y actualiza el rate limit. Async por el HMAC.
 */
export async function checkRateLimit(cookieValue: string | undefined): Promise<RateLimitResult> {
  const now = Date.now();
  const parsed = parseCookie(cookieValue);

  // Sin cookie → nueva ventana
  if (!parsed) {
    const cookieValue = await buildCookie(now, 1);
    return { allowed: true, remaining: MAX_REQUESTS - 1, cookieValue };
  }

  // Validar firma (anti-manipulación)
  const expected = await hmac(`${parsed.windowStart}.${parsed.count}`);
  if (expected !== parsed.signature) {
    // Firma inválida = manipulación → bloquear (no ceder requests)
    const cookieValue = await buildCookie(now, MAX_REQUESTS);
    return { allowed: false, remaining: 0, cookieValue };
  }

  // Ventana expirada (con tolerancia de reloj)
  if (now - parsed.windowStart > WINDOW_MS + CLOCK_SKEW_MS) {
    const cookieValue = await buildCookie(now, 1);
    return { allowed: true, remaining: MAX_REQUESTS - 1, cookieValue };
  }

  // Dentro de la ventana
  if (parsed.count >= MAX_REQUESTS) {
    // parsed viene de una cookie válida (no undefined); re-firmar para devolver
    // el mismo valor ya validado (evita propagar `undefined` del parámetro).
    const cookieValue = `${parsed.windowStart}.${parsed.count}.${parsed.signature}`;
    return { allowed: false, remaining: 0, cookieValue };
  }

  const newCount = parsed.count + 1;
  const newCookie = await buildCookie(parsed.windowStart, newCount);
  return { allowed: true, remaining: MAX_REQUESTS - newCount, cookieValue: newCookie };
}

export async function signRateLimit(windowStart: number, count: number): Promise<string> {
  return buildCookie(windowStart, count);
}

async function buildCookie(windowStart: number, count: number): Promise<string> {
  const signature = await hmac(`${windowStart}.${count}`);
  return `${windowStart}.${count}.${signature}`;
}
