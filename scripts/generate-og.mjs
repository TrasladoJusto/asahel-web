// Generador de og-image.png (1200×630) — paleta exacta del sitio
// Uso: node scripts/generate-og.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'images', 'og-image.png');

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px;
    background: #0a0a0b;
    font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
    overflow: hidden;
    position: relative;
  }
  /* Grid decorativo idéntico al hero */
  .grid-bg {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
    background-size: 44px 44px;
  }
  /* Glow cian ambiente */
  .glow {
    position: absolute;
    width: 700px; height: 700px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(6,182,212,0.14) 0%, transparent 65%);
    top: -180px; right: -140px;
  }
  .glow2 {
    position: absolute;
    width: 520px; height: 520px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 60%);
    bottom: -220px; left: -120px;
  }
  .scanline {
    position: absolute; inset: 0;
    background: repeating-linear-gradient(
      to bottom,
      transparent 0px, transparent 3px,
      rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px
    );
  }
  .wrap {
    position: relative;
    width: 100%; height: 100%;
    display: flex; align-items: center;
    padding: 0 84px;
    gap: 70px;
  }
  /* Columna izquierda */
  .left { flex: 1.15; }
  .kicker {
    color: #06b6d4;
    font-size: 22px;
    letter-spacing: 1px;
    margin-bottom: 18px;
  }
  h1 {
    color: #f4f4f5;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 72px;
    line-height: 1.04;
    font-weight: 700;
    letter-spacing: -3px;
    margin-bottom: 22px;
  }
  h1 .accent { color: #06b6d4; }
  .sub {
    color: #a1a1aa;
    font-size: 27px;
    line-height: 1.45;
    max-width: 560px;
    margin-bottom: 26px;
  }
  .chips { display: flex; gap: 12px; flex-wrap: wrap; }
  .chip {
    border: 1px solid rgba(6,182,212,0.35);
    color: #67e8f9;
    background: rgba(6,182,212,0.06);
    font-size: 17px;
    padding: 8px 16px;
    border-radius: 999px;
  }
  /* Terminal derecha */
  .terminal {
    flex: 0.85;
    background: #101113;
    border: 1px solid #27272a;
    border-radius: 14px;
    box-shadow: 0 24px 70px rgba(0,0,0,0.55), 0 0 40px rgba(6,182,212,0.07);
    overflow: hidden;
  }
  .term-head {
    display: flex; align-items: center; gap: 8px;
    padding: 13px 16px;
    border-bottom: 1px solid #1f1f23;
    background: #131417;
  }
  .dot { width: 12px; height: 12px; border-radius: 50%; }
  .d1 { background: #ff5f57; } .d2 { background: #febc2e; } .d3 { background: #28c840; }
  .term-title { color: #71717a; font-size: 13px; margin-left: 10px; letter-spacing: 0.5px; }
  .term-body { padding: 24px 22px; font-size: 17.5px; line-height: 1.85; white-space: nowrap; }
  .p { color: #71717a; }
  .c  { color: #06b6d4; }
  .w  { color: #f4f4f5; }
  .g  { color: #22c55e; }
  .cursor {
    display: inline-block; width: 10px; height: 20px;
    background: #06b6d4; vertical-align: -3px;
    animation: none;
  }
  .url {
    position: absolute;
    bottom: 38px; right: 84px;
    color: #52525b;
    font-size: 19px;
    letter-spacing: 1.5px;
  }
  .spider {
    position: absolute;
    top: 46px; right: 88px;
    opacity: 0.9;
  }
</style>
</head>
<body>
  <div class="grid-bg"></div>
  <div class="glow"></div>
  <div class="glow2"></div>
  <div class="scanline"></div>

  <svg class="spider" width="92" height="92" viewBox="0 0 80 80">
    <defs>
      <radialGradient id="ab" cx="35%" cy="30%" r="75%">
        <stop offset="0%" stop-color="#4ee0f0"/>
        <stop offset="55%" stop-color="#06b6d4"/>
        <stop offset="100%" stop-color="#0e5c68"/>
      </radialGradient>
      <filter id="eg" x="-80%" y="-80%" width="260%" height="260%">
        <feDropShadow dx="0" dy="0" stdDeviation="1.4" flood-color="#06b6d4" flood-opacity="0.85"/>
      </filter>
    </defs>
    <line x1="40" y1="0" x2="40" y2="24" stroke="#06b6d4" stroke-width="0.9" stroke-dasharray="2.5 3" opacity="0.65"/>
    <g>
      <g transform="translate(47 27)"><path d="M0 0 Q13 -11 23 -13 Q27 -4 21 5" fill="none" stroke="#06b6d4" stroke-width="2.1" stroke-linecap="round"/></g>
      <g transform="translate(49 31)"><path d="M0 0 Q15 -3 26 -5 Q29 4 23 9" fill="none" stroke="#06b6d4" stroke-width="2.1" stroke-linecap="round"/></g>
      <g transform="translate(49 36)"><path d="M0 0 Q15 3 25 7 Q25 15 19 15" fill="none" stroke="#06b6d4" stroke-width="2.1" stroke-linecap="round"/></g>
      <g transform="translate(47 40)"><path d="M0 0 Q11 7 17 15 Q15 21 9 19" fill="none" stroke="#06b6d4" stroke-width="2.1" stroke-linecap="round"/></g>
      <g transform="translate(33 27) scale(-1 1)"><path d="M0 0 Q13 -11 23 -13 Q27 -4 21 5" fill="none" stroke="#06b6d4" stroke-width="2.1" stroke-linecap="round"/></g>
      <g transform="translate(31 31) scale(-1 1)"><path d="M0 0 Q15 -3 26 -5 Q29 4 23 9" fill="none" stroke="#06b6d4" stroke-width="2.1" stroke-linecap="round"/></g>
      <g transform="translate(31 36) scale(-1 1)"><path d="M0 0 Q15 3 25 7 Q25 15 19 15" fill="none" stroke="#06b6d4" stroke-width="2.1" stroke-linecap="round"/></g>
      <g transform="translate(33 40) scale(-1 1)"><path d="M0 0 Q11 7 17 15 Q15 21 9 19" fill="none" stroke="#06b6d4" stroke-width="2.1" stroke-linecap="round"/></g>
      <ellipse cx="40" cy="54" rx="14.5" ry="12.5" fill="url(#ab)"/>
      <ellipse cx="34.5" cy="48.5" rx="5.5" ry="3.4" fill="#ffffff" opacity="0.14" transform="rotate(-18 34.5 48.5)"/>
      <rect x="38.4" y="39.5" width="3.2" height="5" rx="1.4" fill="#0b7f91"/>
      <circle cx="40" cy="33" r="9.5" fill="url(#ab)"/>
      <ellipse cx="36.8" cy="29.6" rx="3.6" ry="2.2" fill="#ffffff" opacity="0.16" transform="rotate(-20 36.8 29.6)"/>
      <circle cx="33.2" cy="26.4" r="0.85" fill="#fff" filter="url(#eg)"/>
      <circle cx="35.6" cy="24.9" r="0.85" fill="#fff" filter="url(#eg)"/>
      <circle cx="44.4" cy="24.9" r="0.85" fill="#fff" filter="url(#eg)"/>
      <circle cx="46.8" cy="26.4" r="0.85" fill="#fff" filter="url(#eg)"/>
      <circle cx="36.2" cy="31.4" r="3.1" fill="#0d1117" stroke="#06b6d4" stroke-width="0.7" filter="url(#eg)"/>
      <circle cx="36.2" cy="31.4" r="1.7" fill="#eaf6ff"/>
      <circle cx="43.8" cy="31.4" r="3.1" fill="#0d1117" stroke="#06b6d4" stroke-width="0.7" filter="url(#eg)"/>
      <circle cx="43.8" cy="31.4" r="1.7" fill="#eaf6ff"/>
      <path d="M37.4 40.5 Q36.6 43 38.2 44.2" fill="none" stroke="#0b7f91" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M42.6 40.5 Q43.4 43 41.8 44.2" fill="none" stroke="#0b7f91" stroke-width="1.4" stroke-linecap="round"/>
    </g>
  </svg>

  <div class="wrap">
    <div class="left">
      <div class="kicker">// DESARROLLADOR WEB FULL-STACK</div>
      <h1>Asahel<br><span class="accent">Tejemos tu web.</span></h1>
      <p class="sub">Páginas web, e-commerce y SaaS con Next.js, TypeScript y PostgreSQL. Código propio, velocidad real, Lima&nbsp;—&nbsp;Perú.</p>
      <div class="chips">
        <span class="chip">Next.js</span>
        <span class="chip">TypeScript</span>
        <span class="chip">PostgreSQL</span>
      </div>
    </div>

    <div class="terminal">
      <div class="term-head">
        <span class="dot d1"></span><span class="dot d2"></span><span class="dot d3"></span>
        <span class="term-title">asahel@dev — zsh</span>
      </div>
      <div class="term-body">
        <div><span class="c">$</span> <span class="w">whoami</span></div>
        <div><span class="g">→ Asahel · Full-Stack Developer</span></div>
        <div style="height:10px"></div>
        <div><span class="c">$</span> <span class="w">npm run crear-tu-web</span></div>
        <div><span class="g">✓ diseño</span> <span class="p">···</span> <span class="g">✓ código</span> <span class="p">···</span> <span class="g">✓ SEO</span></div>
        <div><span class="g">✓ desplegado en producción</span> <span class="cursor"></span></div>
      </div>
    </div>
  </div>

  <div class="url">asaheldev.com</div>
</body>
</html>`;

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'networkidle' });
mkdirSync(dirname(OUT), { recursive: true });
await page.screenshot({ path: OUT });
await browser.close();
console.log(`✅ OG image generada: ${OUT}`);
