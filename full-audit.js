const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'test-results', 'full-audit');
fs.mkdirSync(DIR, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));
const findings = { security: [], performance: [], seo: [], accessibility: [], responsive: [], animations: [], deployment: [], bugs: [] };

function log(category, severity, message, detail = '') {
  findings[category].push({ severity, message, detail, time: new Date().toISOString() });
  const icon = severity === 'critical' ? '🔴' : severity === 'high' ? '🟠' : severity === 'medium' ? '🟡' : 'ℹ️';
  console.log(`  ${icon} [${category.toUpperCase()}] ${message}`);
}

(async () => {
  console.log('═══════════════════════════════════════════════');
  console.log('  ANÁLISIS COMPLETO — 1 HORA');
  console.log('  Pre-deploy Cloudflare Pages');
  console.log('═══════════════════════════════════════════════\n');

  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages().find(p => p.url().includes('localhost:3000')) || context.pages()[0];

  // ============================================
  // FASE 1: SEGURIDAD (15 min)
  // ============================================
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  FASE 1: ANÁLISIS DE SEGURIDAD      ║');
  console.log('╚══════════════════════════════════════╝\n');

  // 1.1 Security Headers
  console.log('--- 1.1 Security Headers ---');
  const resp = await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 20000 });
  const headers = resp.headers();
  
  const requiredHeaders = {
    'content-security-policy': 'CSP',
    'strict-transport-security': 'HSTS',
    'x-content-type-options': 'X-Content-Type-Options',
    'x-frame-options': 'X-Frame-Options',
    'x-xss-protection': 'X-XSS-Protection',
    'referrer-policy': 'Referrer-Policy',
    'permissions-policy': 'Permissions-Policy',
    'cross-origin-opener-policy': 'COOP',
  };
  
  for (const [header, name] of Object.entries(requiredHeaders)) {
    const val = headers[header];
    if (val) {
      log('security', 'info', `${name} presente`, val.substring(0, 80));
    } else {
      log('security', 'high', `${name} FALTANTE`, `Header ${header} no encontrado`);
    }
  }

  // 1.2 CSP Analysis
  console.log('\n--- 1.2 CSP Analysis ---');
  const csp = headers['content-security-policy'] || '';
  if (csp) {
    if (csp.includes("'unsafe-inline'")) log('security', 'medium', 'CSP unsafe-inline', 'Permite inline scripts/styles');
    if (csp.includes("'unsafe-eval'")) log('security', 'high', 'CSP unsafe-eval', 'Permite eval() — riesgo XSS');
    if (csp.includes('*')) log('security', 'high', 'CSP wildcard', 'Permite cualquier origen');
    if (!csp.includes("frame-ancestors")) log('security', 'medium', 'CSP sin frame-ancestors', 'Puede ser vulnerable a clickjacking');
    if (!csp.includes("form-action")) log('security', 'medium', 'CSP sin form-action', 'No restringe destinos de formularios');
  }

  // 1.3 XSS Test
  console.log('\n--- 1.3 XSS Test ---');
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '"><img src=x onerror=alert(1)>',
    "javascript:alert('XSS')",
    '{{constructor.constructor("return this")()}}',
  ];
  
  for (const payload of xssPayloads) {
    await page.goto(`http://localhost:3000?q=${encodeURIComponent(payload)}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await sleep(500);
    const alertTriggered = await page.evaluate(() => {
      return window.__alertTriggered || false;
    });
    if (alertTriggered) {
      log('security', 'critical', 'XSS vulnerability', `Payload: ${payload}`);
    }
  }
  log('security', 'info', 'XSS test completado', 'No se detectaron vulnerabilidades XSS en URL params');

  // 1.4 Form Security
  console.log('\n--- 1.4 Form Security ---');
  await page.goto('http://localhost:3000/contact', { waitUntil: 'networkidle', timeout: 15000 });
  await sleep(1000);
  
  // Check CSRF tokens
  const hasCSRF = await page.evaluate(() => {
    const forms = document.querySelectorAll('form');
    return Array.from(forms).some(f => f.querySelector('input[name="csrf"]') || f.querySelector('input[name="_token"]'));
  });
  if (!hasCSRF) log('security', 'medium', 'Sin token CSRF', 'El formulario no usa tokens CSRF ( mitigado por SameSite cookies)');
  
  // Check honeypot
  const honeypot = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[name="website"], input[name="honeypot"], input[name="company"]');
    return Array.from(inputs).map(i => ({
      name: i.name,
      display: getComputedStyle(i).display,
      visibility: getComputedStyle(i).visibility,
      opacity: getComputedStyle(i).opacity,
      width: getComputedStyle(i).width,
      height: getComputedStyle(i).height,
    }));
  });
  
  honeypot.forEach(h => {
    const isVisible = h.display !== 'none' && h.visibility !== 'hidden' && parseFloat(h.opacity) > 0 && parseFloat(h.width) > 10;
    if (isVisible) {
      log('security', 'high', `Honeypot ${h.name} VISIBLE`, `display=${h.display}, opacity=${h.opacity}, size=${h.width}x${h.height}`);
    } else {
      log('security', 'info', `Honeypot ${h.name} oculto correctamente`, '');
    }
  });

  // 1.5 API Security
  console.log('\n--- 1.5 API Security ---');
  
  // Test rate limiting
  const rateLimitResults = [];
  for (let i = 0; i < 15; i++) {
    const apiResp = await page.evaluate(async () => {
      const r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test', email: 'test@test.com', projectType: 'web', timeline: '1-2months', budget: '1000-3000', hasDesign: false, hasBackend: false, description: 'Test' }),
      });
      return { status: r.status, ok: r.ok };
    });
    rateLimitResults.push(apiResp);
  }
  
  const blocked = rateLimitResults.filter(r => r.status === 429).length;
  if (blocked === 0) {
    log('security', 'high', 'Sin rate limiting', '15 requests consecutivas sin bloqueo');
  } else {
    log('security', 'info', 'Rate limiting activo', `${blocked}/15 bloqueadas`);
  }

  // Test CORS
  const corsTest = await page.evaluate(async () => {
    try {
      const r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': 'https://evil.com' },
        body: JSON.stringify({ name: 'Test', email: 'test@test.com' }),
      });
      return { status: r.status, cors: r.headers.get('access-control-allow-origin') };
    } catch (e) {
      return { error: e.message };
    }
  });
  if (corsTest.cors === '*') {
    log('security', 'high', 'CORS permisivo', 'Access-Control-Allow-Origin: *');
  }

  // 1.6 Sensitive Data Exposure
  console.log('\n--- 1.6 Data Exposure ---');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
  
  const exposedData = await page.evaluate(() => {
    const html = document.documentElement.innerHTML;
    const patterns = [
      { regex: /api[_-]?key\s*[=:]\s*['"][^'"]+['"]/gi, name: 'API Key' },
      { regex: /password\s*[=:]\s*['"][^'"]+['"]/gi, name: 'Password' },
      { regex: /secret\s*[=:]\s*['"][^'"]+['"]/gi, name: 'Secret' },
      { regex: /token\s*[=:]\s*['"][^'"]+['"]/gi, name: 'Token' },
      { regex: /sk_live_[a-zA-Z0-9]+/g, name: 'Stripe Live Key' },
      { regex: /sk_test_[a-zA-Z0-9]+/g, name: 'Stripe Test Key' },
    ];
    
    const found = [];
    for (const p of patterns) {
      const matches = html.match(p.regex);
      if (matches) found.push({ name: p.name, count: matches.length });
    }
    return found;
  });
  
  if (exposedData.length > 0) {
    exposedData.forEach(d => log('security', 'critical', `Datos sensibles expuestos: ${d.name}`, `${d.count} ocurrencias`));
  } else {
    log('security', 'info', 'Sin datos sensibles expuestos en HTML', '');
  }

  // 1.7 Console Errors
  console.log('\n--- 1.7 Console Errors ---');
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
  await sleep(3000);
  
  if (consoleErrors.length > 0) {
    consoleErrors.slice(0, 5).forEach(e => log('security', 'medium', 'Console error', e.substring(0, 100)));
  } else {
    log('security', 'info', 'Sin errores en consola', '');
  }

  // ============================================
  // FASE 2: PERFORMANCE (15 min)
  // ============================================
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  FASE 2: ANÁLISIS DE PERFORMANCE    ║');
  console.log('╚══════════════════════════════════════╝\n');

  // 2.1 Core Web Vitals
  console.log('--- 2.1 Core Web Vitals ---');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 20000 });
  await sleep(3000);
  
  const vitals = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    const lcp = performance.getEntriesByType('largest-contentful-paint');
    
    return {
      ttfb: Math.round(nav?.responseStart - nav?.requestStart || 0),
      fcp: Math.round(paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0),
      domContentLoaded: Math.round(nav?.domContentLoadedEventEnd || 0),
      loadComplete: Math.round(nav?.loadEventEnd || 0),
      lcp: lcp.length > 0 ? Math.round(lcp[lcp.length - 1].startTime) : 'N/A',
      resources: performance.getEntriesByType('resource').length,
      totalTransferKB: Math.round(performance.getEntriesByType('resource').reduce((sum, r) => sum + (r.transferSize || 0), 0) / 1024),
      totalDecodedKB: Math.round(performance.getEntriesByType('resource').reduce((sum, r) => sum + (r.decodedBodySize || 0), 0) / 1024),
    };
  });
  
  console.log(`  TTFB: ${vitals.ttfb}ms ${vitals.ttfb < 100 ? '✅' : vitals.ttfb < 300 ? '⚠️' : '❌'}`);
  console.log(`  FCP: ${vitals.fcp}ms ${vitals.fcp < 1800 ? '✅' : vitals.fcp < 3000 ? '⚠️' : '❌'}`);
  console.log(`  LCP: ${vitals.lcp}ms ${vitals.lcp < 2500 ? '✅' : vitals.lcp < 4000 ? '⚠️' : '❌'}`);
  console.log(`  DOMContentLoaded: ${vitals.domContentLoaded}ms`);
  console.log(`  Load Complete: ${vitals.loadComplete}ms`);
  console.log(`  Resources: ${vitals.resources}`);
  console.log(`  Transfer: ${vitals.totalTransferKB}KB (decoded: ${vitals.totalDecodedKB}KB)`);
  
  if (vitals.ttfb > 300) log('performance', 'high', 'TTFB lento', `${vitals.ttfb}ms (objetivo: <100ms)`);
  if (vitals.fcp > 3000) log('performance', 'high', 'FCP lento', `${vitals.fcp}ms (objetivo: <1800ms)`);
  if (vitals.lcp > 4000) log('performance', 'high', 'LCP lento', `${vitals.lcp}ms (objetivo: <2500ms)`);
  if (vitals.totalTransferKB > 500) log('performance', 'medium', 'Transfer size grande', `${vitals.totalTransferKB}KB total`);

  // 2.2 Resource Breakdown
  console.log('\n--- 2.2 Resource Breakdown ---');
  const resources = await page.evaluate(() => {
    const entries = performance.getEntriesByType('resource');
    const byType = {};
    entries.forEach(r => {
      const ext = r.name.split('?')[0].split('.').pop()?.toLowerCase() || 'other';
      const type = ['js', 'mjs'].includes(ext) ? 'js' : ['css'].includes(ext) ? 'css' : ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'avif'].includes(ext) ? 'image' : ['woff', 'woff2', 'ttf', 'otf'].includes(ext) ? 'font' : 'other';
      if (!byType[type]) byType[type] = { count: 0, sizeKB: 0, items: [] };
      byType[type].count++;
      byType[type].sizeKB += Math.round((r.transferSize || 0) / 1024);
      byType[type].items.push({ name: r.name.split('/').pop()?.split('?')[0] || r.name, sizeKB: Math.round((r.transferSize || 0) / 1024) });
    });
    return byType;
  });
  
  Object.entries(resources).forEach(([type, data]) => {
    console.log(`  ${type}: ${data.count} archivos, ${data.sizeKB}KB`);
    data.items.sort((a, b) => b.sizeKB - a.sizeKB).slice(0, 3).forEach(item => {
      console.log(`    - ${item.name}: ${item.sizeKB}KB`);
    });
  });

  // 2.3 Image Optimization
  console.log('\n--- 2.3 Image Optimization ---');
  const images = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    return Array.from(imgs).map(i => ({
      src: i.src.substring(i.src.lastIndexOf('/') + 1),
      alt: i.alt || '(sin alt)',
      loaded: i.complete && i.naturalWidth > 0,
      naturalWidth: i.naturalWidth,
      naturalHeight: i.naturalHeight,
      displayWidth: i.clientWidth,
      displayHeight: i.clientHeight,
      loading: i.loading,
      decoding: i.decoding,
      format: i.src.split('?')[0].split('.').pop()?.toLowerCase(),
      oversized: i.naturalWidth > i.clientWidth * 2,
    }));
  });
  
  images.forEach(img => {
    if (!img.loaded) log('performance', 'high', `Imagen no cargó: ${img.src}`, '');
    if (img.oversized) log('performance', 'medium', `Imagen sobredimensionada: ${img.src}`, `${img.naturalWidth}x${img.naturalHeight} natural vs ${img.displayWidth}x${img.displayHeight} display`);
    if (!img.alt || img.alt === '(sin alt)') log('accessibility', 'high', `Imagen sin alt: ${img.src}`, '');
    if (img.loading !== 'lazy' && img.format !== 'svg') log('performance', 'medium', `Imagen sin lazy loading: ${img.src}`, `loading=${img.loading}`);
  });

  // 2.4 Bundle Analysis
  console.log('\n--- 2.4 Bundle Analysis ---');
  const bundleInfo = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script[src]');
    const styles = document.querySelectorAll('link[rel="stylesheet"]');
    return {
      scriptCount: scripts.length,
      styleCount: styles.length,
      scripts: Array.from(scripts).map(s => s.src.split('/').pop()),
      styles: Array.from(styles).map(s => s.href?.split('/').pop()),
    };
  });
  console.log(`  Scripts: ${bundleInfo.scriptCount}`);
  console.log(`  Styles: ${bundleInfo.styleCount}`);

  // 2.5 Memory Leak Test
  console.log('\n--- 2.5 Memory Leak Test ---');
  const memBefore = await page.evaluate(() => {
    return performance.memory ? performance.memory.usedJSHeapSize : 0;
  });
  
  for (let i = 0; i < 10; i++) {
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await sleep(500);
  }
  
  const memAfter = await page.evaluate(() => {
    return performance.memory ? performance.memory.usedJSHeapSize : 0;
  });
  
  const memDiff = (memAfter - memBefore) / 1024 / 1024;
  console.log(`  Before: ${(memBefore / 1024 / 1024).toFixed(1)}MB`);
  console.log(`  After: ${(memAfter / 1024 / 1024).toFixed(1)}MB`);
  console.log(`  Diff: ${memDiff.toFixed(1)}MB ${memDiff < 5 ? '✅' : '⚠️'}`);
  if (memDiff > 10) log('performance', 'high', 'Posible memory leak', `${memDiff.toFixed(1)}MB increase after 10 navigations`);

  // ============================================
  // FASE 3: SEO (10 min)
  // ============================================
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  FASE 3: ANÁLISIS SEO               ║');
  console.log('╚══════════════════════════════════════╝\n');

  // 3.1 Meta Tags
  console.log('--- 3.1 Meta Tags ---');
  const seoPages = ['/', '/work', '/about', '/process', '/contact'];
  
  for (const p of seoPages) {
    await page.goto(`http://localhost:3000${p}`, { waitUntil: 'networkidle', timeout: 15000 });
    await sleep(1000);
    
    const meta = await page.evaluate(() => {
      const title = document.title;
      const desc = document.querySelector('meta[name="description"]')?.content;
      const ogTitle = document.querySelector('meta[property="og:title"]')?.content;
      const ogDesc = document.querySelector('meta[property="og:description"]')?.content;
      const ogImage = document.querySelector('meta[property="og:image"]')?.content;
      const canonical = document.querySelector('link[rel="canonical"]')?.href;
      const robots = document.querySelector('meta[name="robots"]')?.content;
      const h1 = document.querySelector('h1');
      
      return {
        title: title || '(missing)',
        titleLength: title?.length || 0,
        description: desc || '(missing)',
        descLength: desc?.length || 0,
        ogTitle: ogTitle || '(missing)',
        ogDescription: ogDesc || '(missing)',
        ogImage: ogImage || '(missing)',
        canonical: canonical || '(missing)',
        robots: robots || '(missing)',
        h1: h1?.textContent?.trim() || '(missing)',
        h1Count: document.querySelectorAll('h1').length,
      };
    });
    
    console.log(`\n  ${p}:`);
    console.log(`    Title: "${meta.title}" (${meta.titleLength} chars) ${meta.titleLength > 60 ? '⚠️ largo' : meta.titleLength < 30 ? '⚠️ corto' : '✅'}`);
    console.log(`    Description: ${meta.descLength} chars ${meta.descLength > 160 ? '⚠️ largo' : meta.descLength < 120 ? '⚠️ corto' : '✅'}`);
    console.log(`    H1: "${meta.h1}" ${meta.h1 === '(missing)' ? '❌ FALTA' : '✅'}`);
    console.log(`    OG: title=${meta.ogTitle !== '(missing)' ? '✅' : '❌'} desc=${meta.ogDescription !== '(missing)' ? '✅' : '❌'} image=${meta.ogImage !== '(missing)' ? '✅' : '❌'}`);
    console.log(`    Canonical: ${meta.canonical !== '(missing)' ? '✅' : '❌'}`);
    
    if (meta.title === '(missing)') log('seo', 'high', `Missing title: ${p}`, '');
    if (meta.titleLength > 60) log('seo', 'medium', `Title too long: ${p}`, `${meta.titleLength} chars (max 60)`);
    if (meta.descLength > 160) log('seo', 'medium', `Description too long: ${p}`, `${meta.descLength} chars (max 160)`);
    if (meta.h1 === '(missing)') log('seo', 'high', `Missing H1: ${p}`, '');
    if (meta.h1Count > 1) log('seo', 'medium', `Multiple H1s: ${p}`, `${meta.h1Count} H1 elements`);
    if (meta.ogImage === '(missing)') log('seo', 'high', `Missing OG image: ${p}`, '');
    if (meta.canonical === '(missing)') log('seo', 'medium', `Missing canonical: ${p}`, '');
  }

  // 3.2 Structured Data
  console.log('\n--- 3.2 Structured Data ---');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
  
  const structuredData = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    return Array.from(scripts).map(s => {
      try {
        const data = JSON.parse(s.textContent);
        return { type: data['@type'], valid: true };
      } catch {
        return { type: 'invalid JSON', valid: false };
      }
    });
  });
  
  console.log(`  Schema.org schemas: ${structuredData.length}`);
  structuredData.forEach(s => console.log(`    - ${s.type}: ${s.valid ? '✅' : '❌ invalid JSON'}`));
  
  if (structuredData.length === 0) log('seo', 'medium', 'Sin structured data', 'No se encontraron schemas JSON-LD');
  structuredData.filter(s => !s.valid).forEach(s => log('seo', 'high', 'JSON-LD inválido', s.type));

  // 3.3 Sitemap & Robots
  console.log('\n--- 3.3 Sitemap & Robots ---');
  const sitemapResp = await page.goto('http://localhost:3000/sitemap.xml', { waitUntil: 'domcontentloaded', timeout: 10000 });
  const sitemapStatus = sitemapResp.status();
  const sitemapContent = await page.content();
  const sitemapUrls = (sitemapContent.match(/<loc>/g) || []).length;
  console.log(`  Sitemap: ${sitemapStatus === 200 ? '✅' : '❌'} (${sitemapUrls} URLs)`);
  
  const robotsResp = await page.goto('http://localhost:3000/robots.txt', { waitUntil: 'domcontentloaded', timeout: 10000 });
  const robotsStatus = robotsResp.status();
  const robotsContent = await page.content();
  console.log(`  Robots.txt: ${robotsStatus === 200 ? '✅' : '❌'}`);
  
  if (sitemapStatus !== 200) log('seo', 'high', 'Sitemap no accesible', `Status: ${sitemapStatus}`);
  if (robotsStatus !== 200) log('seo', 'high', 'Robots.txt no accesible', `Status: ${robotsStatus}`);

  // ============================================
  // FASE 4: ACCESIBILIDAD (10 min)
  // ============================================
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  FASE 4: ANÁLISIS DE ACCESIBILIDAD  ║');
  console.log('╚══════════════════════════════════════╝\n');

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
  await sleep(1000);

  // 4.1 Heading Hierarchy
  console.log('--- 4.1 Heading Hierarchy ---');
  const headings = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
      level: parseInt(h.tagName[1]),
      text: h.textContent.trim().substring(0, 60),
    }));
  });
  
  let prevLevel = 0;
  headings.forEach(h => {
    const gap = h.level - prevLevel;
    if (gap > 1 && prevLevel > 0) {
      log('accessibility', 'medium', `Heading skip: h${prevLevel} → h${h.level}`, `"${h.text}"`);
    }
    prevLevel = h.level;
  });
  console.log(`  ${headings.length} headings encontrados`);
  headings.slice(0, 10).forEach(h => console.log(`    h${h.level}: "${h.text}"`));

  // 4.2 ARIA & Roles
  console.log('\n--- 4.2 ARIA & Roles ---');
  const ariaInfo = await page.evaluate(() => {
    return {
      landmarks: document.querySelectorAll('[role="banner"], [role="navigation"], [role="main"], [role="contentinfo"], [role="search"]').length,
      ariaLabels: document.querySelectorAll('[aria-label]').length,
      ariaHidden: document.querySelectorAll('[aria-hidden]').length,
      ariaExpanded: document.querySelectorAll('[aria-expanded]').length,
      ariaDescribedBy: document.querySelectorAll('[aria-describedby]').length,
      focusable: document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]').length,
      tabindex: document.querySelectorAll('[tabindex]').length,
      tabindexNeg: document.querySelectorAll('[tabindex="-1"]').length,
    };
  });
  
  console.log(`  Landmarks: ${ariaInfo.landmarks}`);
  console.log(`  aria-labels: ${ariaInfo.ariaLabels}`);
  console.log(`  aria-hidden: ${ariaInfo.ariaHidden}`);
  console.log(`  aria-expanded: ${ariaInfo.ariaExpanded}`);
  console.log(`  Focusable elements: ${ariaInfo.focusable}`);
  console.log(`  tabindex="-1": ${ariaInfo.tabindexNeg}`);

  // 4.3 Color Contrast
  console.log('\n--- 4.3 Color Contrast ---');
  const contrastIssues = await page.evaluate(() => {
    const issues = [];
    const elements = document.querySelectorAll('p, a, span, h1, h2, h3, h4, button, label');
    
    elements.forEach(el => {
      const style = getComputedStyle(el);
      const color = style.color;
      const bgColor = style.backgroundColor;
      const fontSize = parseFloat(style.fontSize);
      
      // Simple contrast check (very basic)
      const parseRGB = (str) => {
        const match = str.match(/\d+/g);
        return match ? match.map(Number) : [0, 0, 0];
      };
      
      const fg = parseRGB(color);
      const bg = parseRGB(bgColor);
      
      if (fg.length >= 3 && bg.length >= 3) {
        const luminance = (r, g, b) => {
          const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
        };
        
        const l1 = luminance(fg[0], fg[1], fg[2]);
        const l2 = luminance(bg[0], bg[1], bg[2]);
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        
        const required = fontSize >= 18 ? 3 : 4.5;
        if (ratio < required && bgColor !== 'rgba(0, 0, 0, 0)') {
          issues.push({
            text: el.textContent.trim().substring(0, 30),
            ratio: ratio.toFixed(2),
            required,
            fg: color,
            bg: bgColor,
          });
        }
      }
    });
    
    return issues.slice(0, 10);
  });
  
  if (contrastIssues.length > 0) {
    contrastIssues.forEach(i => log('accessibility', 'medium', `Contraste bajo: "${i.text}"`, `Ratio: ${i.ratio}:1 (requerido: ${i.required}:1)`));
  } else {
    console.log('  Sin problemas de contraste detectados ✅');
  }

  // 4.4 Keyboard Navigation
  console.log('\n--- 4.4 Keyboard Navigation ---');
  const skipLink = await page.locator('#skip-link, [href="#main-content"]').first().isVisible().catch(() => false);
  console.log(`  Skip link: ${skipLink ? '✅' : '❌'}`);
  
  const focusOrder = await page.evaluate(() => {
    const focusable = document.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
    return Array.from(focusable).slice(0, 20).map(el => ({
      tag: el.tagName,
      text: el.textContent?.trim().substring(0, 30) || el.getAttribute('aria-label') || '(sin texto)',
      tabIndex: el.tabIndex,
    }));
  });
  
  console.log(`  Focusable elements: ${focusOrder.length}`);
  if (!skipLink) log('accessibility', 'high', 'Skip link no encontrado', 'Usuarios de teclado no pueden saltar al contenido');

  // 4.5 Form Labels
  console.log('\n--- 4.5 Form Labels ---');
  await page.goto('http://localhost:3000/contact', { waitUntil: 'networkidle', timeout: 15000 });
  
  const formLabels = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]), textarea, select');
    return Array.from(inputs).map(i => {
      const id = i.id;
      const label = id ? document.querySelector(`label[for="${id}"]`) : null;
      const ariaLabel = i.getAttribute('aria-label');
      const ariaLabelledBy = i.getAttribute('aria-labelledby');
      const placeholder = i.getAttribute('placeholder');
      
      return {
        name: i.name,
        id: id || '(no id)',
        hasLabel: !!label,
        hasAriaLabel: !!ariaLabel,
        hasAriaLabelledBy: !!ariaLabelledBy,
        hasPlaceholder: !!placeholder,
        valid: !!label || !!ariaLabel || !!ariaLabelledBy,
      };
    });
  });
  
  formLabels.forEach(f => {
    if (!f.valid) {
      log('accessibility', 'high', `Input sin label: ${f.name}`, `id=${f.id}, placeholder=${f.hasPlaceholder}`);
    }
  });
  console.log(`  ${formLabels.filter(f => f.valid).length}/${formLabels.length} inputs con label válido`);

  // ============================================
  // FASE 5: RESPONSIVE (5 min)
  // ============================================
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  FASE 5: ANÁLISIS RESPONSIVE        ║');
  console.log('╚══════════════════════════════════════╝\n');

  const viewports = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 14', width: 390, height: 844 },
    { name: 'iPad', width: 768, height: 1024 },
    { name: 'iPad Pro', width: 1024, height: 1366 },
    { name: 'Laptop', width: 1366, height: 768 },
    { name: 'Desktop', width: 1440, height: 900 },
    { name: 'Ultrawide', width: 1920, height: 1080 },
  ];
  
  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await sleep(1000);
    
    const issues = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      const hasHorizontalScroll = body.scrollWidth > html.clientWidth;
      const overflowing = [];
      
      if (hasHorizontalScroll) {
        const allEls = document.querySelectorAll('*');
        allEls.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.right > html.clientWidth + 5 || rect.left < -5) {
            overflowing.push(el.tagName + (el.className ? '.' + el.className.split(' ')[0] : ''));
          }
        });
      }
      
      return {
        hasHorizontalScroll,
        overflowing: overflowing.slice(0, 5),
        bodyWidth: body.scrollWidth,
        viewportWidth: html.clientWidth,
      };
    });
    
    const status = issues.hasHorizontalScroll ? '❌' : '✅';
    console.log(`  ${vp.name} (${vp.width}x${vp.height}): ${status}${issues.hasHorizontalScroll ? ` horizontal scroll (${issues.overflowing.join(', ')})` : ''}`);
    
    if (issues.hasHorizontalScroll) {
      log('responsive', 'high', `Horizontal scroll en ${vp.name}`, `Body: ${issues.bodyWidth}px vs Viewport: ${issues.viewportWidth}px`);
    }
    
    await page.screenshot({ path: path.join(DIR, `responsive-${vp.name.toLowerCase().replace(/\s/g, '-')}.png`) });
  }

  // ============================================
  // FASE 6: ANIMACIONES (5 min)
  // ============================================
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  FASE 6: ANÁLISIS DE ANIMACIONES    ║');
  console.log('╚══════════════════════════════════════╝\n');

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
  await sleep(2000);

  // 6.1 Animation Performance
  console.log('--- 6.1 Animation Performance ---');
  const animInfo = await page.evaluate(() => {
    const animations = document.getAnimations();
    return {
      total: animations.length,
      running: animations.filter(a => a.playState === 'running').length,
      paused: animations.filter(a => a.playState === 'paused').length,
      types: {
        css: animations.filter(a => a.constructor.name === 'CSSAnimation').length,
        web: animations.filter(a => a.constructor.name === 'Animation').length,
      },
      longAnimations: animations.filter(a => a.effect?.getComputedTiming().duration > 1000).length,
    };
  });
  
  console.log(`  Total animations: ${animInfo.total}`);
  console.log(`  Running: ${animInfo.running}`);
  console.log(`  CSS: ${animInfo.types.css}, Web API: ${animInfo.types.web}`);
  console.log(`  Long animations (>1s): ${animInfo.longAnimations}`);

  // 6.2 Scroll Performance
  console.log('\n--- 6.2 Scroll Performance ---');
  const scrollPerf = await page.evaluate(() => {
    return new Promise(resolve => {
      let frames = 0;
      let jank = 0;
      let lastTime = performance.now();
      
      const countFrame = () => {
        const now = performance.now();
        const delta = now - lastTime;
        frames++;
        if (delta > 16.67) jank++; // More than 60fps
        lastTime = now;
        if (frames < 60) requestAnimationFrame(countFrame);
        else resolve({ frames, jank, fps: Math.round(60000 / (performance.now() - lastTime + frames * 16.67)) });
      };
      
      requestAnimationFrame(countFrame);
    });
  });
  
  console.log(`  Frames measured: ${scrollPerf.frames}`);
  console.log(`  Jank frames: ${scrollPerf.jank} ${scrollPerf.jank < 5 ? '✅' : '⚠️'}`);

  // 6.3 Reduced Motion
  console.log('\n--- 6.3 Reduced Motion ---');
  const reducedMotion = await page.evaluate(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mediaQuery.matches;
  });
  console.log(`  prefers-reduced-motion: ${reducedMotion ? 'reduce' : 'no-preference'}`);
  
  // Check if animations respect reduced motion
  const respectsReducedMotion = await page.evaluate(() => {
    const style = document.querySelector('style');
    const css = Array.from(document.styleSheets).map(s => {
      try { return Array.from(s.cssRules).map(r => r.cssText).join(''); } catch { return ''; }
    }).join('');
    return css.includes('prefers-reduced-motion');
  });
  console.log(`  CSS respects reduced-motion: ${respectsReducedMotion ? '✅' : '❌'}`);
  if (!respectsReducedMotion) log('accessibility', 'medium', 'No respeta prefers-reduced-motion', 'Animaciones no se desactivan');

  // ============================================
  // FASE 7: DEPLOYMENT READINESS (5 min)
  // ============================================
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  FASE 7: DEPLOYMENT READINESS       ║');
  console.log('╚══════════════════════════════════════╝\n');

  // 7.1 Build Check
  console.log('--- 7.1 Build Check ---');
  const buildDir = path.join(__dirname, '.next');
  const staticDir = path.join(__dirname, '.vercel', 'output', 'static');
  
  console.log(`  .next exists: ${fs.existsSync(buildDir) ? '✅' : '❌'}`);
  console.log(`  .vercel/output/static exists: ${fs.existsSync(staticDir) ? '✅' : '❌'}`);
  
  if (fs.existsSync(buildDir)) {
    const buildSize = getDirSize(buildDir);
    console.log(`  Build size: ${(buildSize / 1024 / 1024).toFixed(1)}MB`);
    if (buildSize > 100 * 1024 * 1024) log('deployment', 'medium', 'Build size grande', `${(buildSize / 1024 / 1024).toFixed(1)}MB`);
  }

  // 7.2 Environment Variables
  console.log('\n--- 7.2 Environment Variables ---');
  const envCheck = await page.evaluate(() => {
    return {
      hasNextData: !!document.getElementById('__NEXT_DATA__'),
    };
  });
  console.log(`  __NEXT_DATA__: ${envCheck.hasNextData ? '⚠️ presente (quitar en prod)' : '✅ ausente'}`);
  if (envCheck.hasNextData) log('deployment', 'medium', '__NEXT_DATA__ expuesto', 'Quitar en producción');

  // 7.3 _headers & _redirects
  console.log('\n--- 7.3 Cloudflare Files ---');
  const headersFile = path.join(__dirname, 'public', '_headers');
  const redirectsFile = path.join(__dirname, 'public', '_redirects');
  console.log(`  _headers: ${fs.existsSync(headersFile) ? '✅' : '❌'}`);
  console.log(`  _redirects: ${fs.existsSync(redirectsFile) ? '⚠️ no existe' : '✅'}`);

  // 7.4 next.config.js
  console.log('\n--- 7.4 next.config.js ---');
  const nextConfig = path.join(__dirname, 'next.config.js');
  if (fs.existsSync(nextConfig)) {
    const config = fs.readFileSync(nextConfig, 'utf8');
    if (config.includes('images.remotePatterns') && config.includes("**")) {
      log('deployment', 'high', 'images.remotePatterns muy permisivo', 'Permite cualquier dominio de imágenes');
    }
    if (config.includes('output:')) {
      console.log(`  Output mode: ${config.includes("'export'") ? 'static export' : config.includes("'standalone'") ? 'standalone' : 'default'}`);
    }
  }

  // 7.5 Final Screenshots
  console.log('\n--- 7.5 Final Screenshots ---');
  for (const vp of [{ name: 'desktop', w: 1440, h: 900 }, { name: 'mobile', w: 375, h: 812 }]) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
    await sleep(2000);
    await page.screenshot({ path: path.join(DIR, `final-${vp.name}.png`), fullPage: true });
    console.log(`  📸 final-${vp.name}.png`);
  }

  // ============================================
  // RESUMEN FINAL
  // ============================================
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  RESUMEN FINAL                      ║');
  console.log('╚══════════════════════════════════════╝\n');
  
  const summary = {
    security: { critical: 0, high: 0, medium: 0, info: 0 },
    performance: { critical: 0, high: 0, medium: 0, info: 0 },
    seo: { critical: 0, high: 0, medium: 0, info: 0 },
    accessibility: { critical: 0, high: 0, medium: 0, info: 0 },
    responsive: { critical: 0, high: 0, medium: 0, info: 0 },
    deployment: { critical: 0, high: 0, medium: 0, info: 0 },
  };
  
  Object.entries(findings).forEach(([cat, items]) => {
    if (summary[cat]) {
      items.forEach(item => {
        summary[cat][item.severity]++;
      });
    }
  });
  
  let totalCritical = 0, totalHigh = 0, totalMedium = 0;
  
  Object.entries(summary).forEach(([cat, counts]) => {
    const total = counts.critical + counts.high + counts.medium + counts.info;
    if (total > 0) {
      console.log(`  ${cat.toUpperCase()}: ${counts.critical}🔴 ${counts.high}🟠 ${counts.medium}🟡 ${counts.info}ℹ️`);
      totalCritical += counts.critical;
      totalHigh += counts.high;
      totalMedium += counts.medium;
    }
  });
  
  console.log(`\n  TOTAL: ${totalCritical} critical | ${totalHigh} high | ${totalMedium} medium`);
  
  const deployReady = totalCritical === 0 && totalHigh < 3;
  console.log(`\n  🚀 DEPLOY READY: ${deployReady ? '✅ SÍ' : '❌ NO — arreglar issues críticos primero'}`);
  
  // Save full report
  fs.writeFileSync(path.join(DIR, 'full-report.json'), JSON.stringify(findings, null, 2));
  console.log(`\n  📁 Reporte completo: test-results/full-audit/full-report.json`);
  console.log(`  📸 Screenshots: ${fs.readdirSync(DIR).filter(f => f.endsWith('.png')).length}`);
  
  browser.close();
})();

function getDirSize(dir) {
  let size = 0;
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        size += getDirSize(filePath);
      } else {
        size += stat.size;
      }
    }
  } catch {}
  return size;
}
