// Rate limiter using cookies (works on Cloudflare Workers)
// For production, also enable Cloudflare WAF rate limiting rules

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5;

export function checkRateLimit(cookieValue: string | undefined): { allowed: boolean; remaining: number; cookieValue: string } {
  const now = Date.now();
  
  if (!cookieValue) {
    const newCookie = `${now}:${1}`;
    return { allowed: true, remaining: MAX_REQUESTS - 1, cookieValue: newCookie };
  }
  
  const parts = cookieValue.split(':');
  const windowStart = parseInt(parts[0]) || 0;
  const count = parseInt(parts[1]) || 0;
  
  // New window
  if (now - windowStart > WINDOW_MS) {
    const newCookie = `${now}:${1}`;
    return { allowed: true, remaining: MAX_REQUESTS - 1, cookieValue: newCookie };
  }
  
  // Within window
  if (count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, cookieValue };
  }
  
  const newCookie = `${windowStart}:${count + 1}`;
  return { allowed: true, remaining: MAX_REQUESTS - (count + 1), cookieValue: newCookie };
}
