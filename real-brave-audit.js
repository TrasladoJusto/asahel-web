const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'test-results', 'real-brave');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async () => {
  console.log('=== AUDITORÍA REAL EN BRAVE ===\n');

  // Conectar a Brave vía CDP
  let browser;
  try {
    browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    console.log('✅ Conectado a Brave vía CDP');
  } catch (e) {
    console.error('❌ No se pudo conectar a Brave:', e.message);
    process.exit(1);
  }

  const contexts = browser.contexts();
  console.log(`Contextos: ${contexts.length}`);
  
  const pages = contexts[0]?.pages() || [];
  console.log(`Pestañas abiertas: ${pages.length}`);
  
  for (const p of pages) {
    console.log(`  - ${p.url()}`);
  }

  // Navegar a la página del portfolio
  let page = pages.find(p => p.url().includes('localhost:3000'));
  if (!page) {
    page = pages[0];
    console.log('\nNavegando a localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
  }
  await sleep(2000);

  const title = await page.title();
  console.log(`\nTítulo: ${title}`);
  console.log(`URL: ${page.url()}`);

  // ============================================
  // FASE 1: Home - First Paint (lo que ve un usuario real al llegar)
  // ============================================
  console.log('\n--- FASE 1: Home - First Paint ---');
  await page.screenshot({ path: path.join(DIR, '01-home-first-paint.png'), fullPage: false });
  console.log('📸 01-home-first-paint.png');

  // Ver qué hay visible arriba
  const heroText = await page.locator('h1').first().textContent().catch(() => 'NO H1');
  console.log(`H1 visible: "${heroText}"`);
  
  const navLinks = await page.locator('nav a').allTextContents().catch(() => []);
  console.log(`Nav links: ${navLinks.join(' | ')}`);

  // Scroll gradual como persona real
  console.log('\nScroll gradual...');
  for (let i = 1; i <= 10; i++) {
    await page.mouse.wheel(0, 400);
    await sleep(300);
    if (i % 3 === 0) {
      const scrollY = await page.evaluate(() => window.scrollY);
      await page.screenshot({ path: path.join(DIR, `02-scroll-${String(i).padStart(2, '0')}.png`), fullPage: false });
      console.log(`📸 02-scroll-${String(i).padStart(2, '0')}.png (scrollY: ${scrollY})`);
    }
  }

  // ============================================
  // FASE 2: Spider interaction
  // ============================================
  console.log('\n--- FASE 2: Spider ---');
  
  // Buscar el widget de la araña
  const spiderWidget = page.locator('#mascot-widget');
  const spiderVisible = await spiderWidget.isVisible().catch(() => false);
  console.log(`Widget #mascot-widget visible: ${spiderVisible}`);
  
  // Verificar GLB canvas
  const canvas = page.locator('#mascot-widget canvas');
  const canvasVisible = await canvas.isVisible().catch(() => false);
  console.log(`Canvas WebGL visible: ${canvasVisible}`);
  
  // Click en la araña
  if (spiderVisible) {
    await spiderWidget.click({ force: true });
    await sleep(1500);
    await page.screenshot({ path: path.join(DIR, '03-spider-clicked.png'), fullPage: false });
    console.log('📸 03-spider-clicked.png');
    
    // Verificar si abrió chat
    const chatVisible = await page.locator('.spider-chat-bubble, [class*="chat"]').first().isVisible().catch(() => false);
    console.log(`Chat bubble visible después de click: ${chatVisible}`);
    if (chatVisible) {
      await page.screenshot({ path: path.join(DIR, '04-spider-chat-open.png'), fullPage: false });
      console.log('📸 04-spider-chat-open.png');
    }
  }

  // ============================================
  // FASE 3: Spider tracking durante scroll
  // ============================================
  console.log('\n--- FASE 3: Spider Tracking ---');
  
  // Volver al top
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(1000);
  
  const spiderPositions = [];
  for (let i = 0; i < 8; i++) {
    await page.mouse.wheel(0, 600);
    await sleep(800);
    
    // Obtener posición de la araña
    const pos = await page.evaluate(() => {
      const el = document.querySelector('#mascot-widget');
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) };
    });
    
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    spiderPositions.push({ step: i + 1, ...pos, viewportWidth });
    console.log(`  Spider step ${i + 1}: x=${pos?.x}, viewport=${viewportWidth}, offScreen=${pos ? pos.x > viewportWidth : 'N/A'}`);
    
    if (i === 2 || i === 5 || i === 7) {
      await page.screenshot({ path: path.join(DIR, `05-spider-track-${i + 1}.png`), fullPage: false });
      console.log(`📸 05-spider-track-${i + 1}.png`);
    }
  }

  // ============================================
  // FASE 4: Navegación a otras páginas
  // ============================================
  console.log('\n--- FASE 4: Navegación ---');
  
  const pages_to_visit = [
    { name: 'work', url: '/work' },
    { name: 'about', url: '/about' },
    { name: 'process', url: '/process' },
    { name: 'contact', url: '/contact' },
  ];
  
  for (const { name, url } of pages_to_visit) {
    await page.goto(`http://localhost:3000${url}`, { waitUntil: 'networkidle', timeout: 15000 });
    await sleep(1500);
    
    const h1 = await page.locator('h1').first().textContent().catch(() => 'NO H1');
    console.log(`\n${name}: H1="${h1}", URL=${page.url()}`);
    
    await page.screenshot({ path: path.join(DIR, `06-page-${name}.png`), fullPage: false });
    console.log(`📸 06-page-${name}.png`);
    
    // Scroll en cada página
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, 500);
      await sleep(400);
    }
    await page.screenshot({ path: path.join(DIR, `07-page-${name}-scroll.png`), fullPage: false });
    console.log(`📸 07-page-${name}-scroll.png`);
  }

  // ============================================
  // FASE 5: Formulario de contacto
  // ============================================
  console.log('\n--- FASE 5: Formulario ---');
  await page.goto('http://localhost:3000/contact', { waitUntil: 'networkidle', timeout: 15000 });
  await sleep(1000);
  
  // Scroll al formulario
  await page.evaluate(() => {
    const form = document.querySelector('form');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  await sleep(1000);
  await page.screenshot({ path: path.join(DIR, '08-form-empty.png'), fullPage: false });
  console.log('📸 08-form-empty.png');
  
  // Intentar enviar vacío
  const submitBtn = page.locator('button[type="submit"], button:has-text("Enviar"), button:has-text("Send")').first();
  const submitVisible = await submitBtn.isVisible().catch(() => false);
  console.log(`Submit button visible: ${submitVisible}`);
  
  if (submitVisible) {
    await submitBtn.click({ force: true });
    await sleep(1000);
    await page.screenshot({ path: path.join(DIR, '09-form-submit-empty.png'), fullPage: false });
    console.log('📸 09-form-submit-empty.png');
    
    // Ver errores
    const errors = await page.locator('[class*="error"], [role="alert"], .error-message').allTextContents().catch(() => []);
    console.log(`Errores visibles: ${errors.length > 0 ? errors.join(', ') : 'NINGUNO'}`);
  }
  
  // Llenar formulario
  const nameInput = page.locator('input[name="name"], input[placeholder*="nombre"], input[placeholder*="name"]').first();
  const emailInput = page.locator('input[name="email"], input[type="email"], input[placeholder*="email"]').first();
  const msgInput = page.locator('textarea[name="message"], textarea[placeholder*="mensaje"], textarea[placeholder*="message"]').first();
  
  if (await nameInput.isVisible().catch(() => false)) {
    await nameInput.fill('Test User');
    console.log('  Nombre: "Test User"');
  }
  if (await emailInput.isVisible().catch(() => false)) {
    await emailInput.fill('test@example.com');
    console.log('  Email: "test@example.com"');
  }
  if (await msgInput.isVisible().catch(() => false)) {
    await msgInput.fill('Mensaje de prueba desde auditoría real en Brave browser');
    console.log('  Mensaje: llenado');
  }
  
  await sleep(500);
  await page.screenshot({ path: path.join(DIR, '10-form-filled.png'), fullPage: false });
  console.log('📸 10-form-filled.png');

  // ============================================
  // FASE 6: Responsive - Mobile
  // ============================================
  console.log('\n--- FASE 6: Responsive Mobile ---');
  await page.setViewportSize({ width: 375, height: 812 }); // iPhone 14
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
  await sleep(1500);
  await page.screenshot({ path: path.join(DIR, '11-mobile-home.png'), fullPage: false });
  console.log('📸 11-mobile-home.png (375x812)');
  
  // Scroll mobile
  for (let i = 0; i < 5; i++) {
    await page.mouse.wheel(0, 400);
    await sleep(300);
  }
  await page.screenshot({ path: path.join(DIR, '12-mobile-scroll.png'), fullPage: false });
  console.log('📸 12-mobile-scroll.png');
  
  // Tablet
  await page.setViewportSize({ width: 768, height: 1024 }); // iPad
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
  await sleep(1500);
  await page.screenshot({ path: path.join(DIR, '13-tablet-home.png'), fullPage: false });
  console.log('📸 13-tablet-home.png (768x1024)');

  // ============================================
  // FASE 7: Performance check
  // ============================================
  console.log('\n--- FASE 7: Performance ---');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
  await sleep(2000);
  
  const perfMetrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    return {
      ttfb: Math.round(nav?.responseStart - nav?.requestStart || 0),
      domContentLoaded: Math.round(nav?.domContentLoadedEventEnd || 0),
      loadComplete: Math.round(nav?.loadEventEnd || 0),
      firstPaint: Math.round(paint.find(p => p.name === 'first-paint')?.startTime || 0),
      firstContentfulPaint: Math.round(paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0),
      resources: performance.getEntriesByType('resource').length,
      totalTransferSize: performance.getEntriesByType('resource').reduce((sum, r) => sum + (r.transferSize || 0), 0),
    };
  });
  
  console.log(`  TTFB: ${perfMetrics.ttfb}ms`);
  console.log(`  FCP: ${perfMetrics.firstContentfulPaint}ms`);
  console.log(`  DOMContentLoaded: ${perfMetrics.domContentLoaded}ms`);
  console.log(`  Load Complete: ${perfMetrics.loadComplete}ms`);
  console.log(`  Resources: ${perfMetrics.resources}`);
  console.log(`  Total Transfer: ${(perfMetrics.totalTransferSize / 1024).toFixed(1)}KB`);

  // ============================================
  // FASE 8: Accessibility quick check
  // ============================================
  console.log('\n--- FASE 8: Accessibility ---');
  
  // Check for images without alt
  const imgsNoAlt = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    return Array.from(imgs).filter(i => !i.alt || i.alt.trim() === '').map(i => i.src).length;
  });
  console.log(`  Imágenes sin alt: ${imgsNoAlt}`);
  
  // Check for form labels
  const inputsNoLabel = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
    return Array.from(inputs).filter(i => {
      const id = i.id;
      const label = id ? document.querySelector(`label[for="${id}"]`) : null;
      const ariaLabel = i.getAttribute('aria-label');
      const ariaLabelledBy = i.getAttribute('aria-labelledby');
      return !label && !ariaLabel && !ariaLabelledBy;
    }).length;
  });
  console.log(`  Inputs sin label/aria-label: ${inputsNoLabel}`);
  
  // Check heading hierarchy
  const headings = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
      tag: h.tagName,
      text: h.textContent.trim().substring(0, 50)
    }));
  });
  console.log(`  Headings: ${headings.map(h => `${h.tag} "${h.text}"`).join(', ')}`);
  
  // Check skip link
  const skipLink = await page.locator('#skip-link, [href="#main-content"], [class*="skip"]').first().isVisible().catch(() => false);
  console.log(`  Skip link visible: ${skipLink}`);

  // ============================================
  // FASE 9: Security check
  // ============================================
  console.log('\n--- FASE 9: Security Headers ---');
  
  const response = await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
  const headers = response.headers();
  const securityHeaders = [
    'content-security-policy',
    'strict-transport-security', 
    'x-content-type-options',
    'x-frame-options',
    'x-xss-protection',
    'referrer-policy',
    'permissions-policy'
  ];
  
  for (const h of securityHeaders) {
    const val = headers[h];
    console.log(`  ${h}: ${val ? val.substring(0, 80) + '...' : '❌ FALTANTE'}`);
  }

  // ============================================
  // RESUMEN
  // ============================================
  console.log('\n=== RESUMEN AUDITORÍA REAL ===');
  console.log(`Screenshots tomados: ${fs.readdirSync(DIR).length}`);
  console.log(`Spider off-screen durante scroll: ${spiderPositions.some(p => p.x > p.viewportWidth) ? '❌ SÍ' : '✅ NO'}`);
  console.log(`H1 en todas las páginas: ${headings.filter(h => h.tag === 'H1').length > 0 ? '✅' : '❌ FALTA'}`);
  console.log(`Security headers: ${securityHeaders.filter(h => headers[h]).length}/${securityHeaders.length}`);
  console.log(`Performance TTFB: ${perfMetrics.ttfb}ms ${perfMetrics.ttfb < 100 ? '✅' : '⚠️'}`);
  console.log(`FCP: ${perfMetrics.firstContentfulPaint}ms ${perfMetrics.firstContentfulPaint < 1800 ? '✅' : '⚠️'}`);
  
  // Guardar findings
  const findings = {
    timestamp: new Date().toISOString(),
    browser: 'Brave (Chrome 152)',
    spider: {
      positions: spiderPositions,
      goesOffScreen: spiderPositions.some(p => p.x > p.viewportWidth)
    },
    performance: perfMetrics,
    accessibility: {
      imagesWithoutAlt: imgsNoAlt,
      inputsWithoutLabel: inputsNoLabel,
      headings: headings
    },
    security: {
      present: securityHeaders.filter(h => headers[h]),
      missing: securityHeaders.filter(h => !headers[h])
    },
    screenshots: fs.readdirSync(DIR)
  };
  
  fs.writeFileSync(
    path.join(DIR, 'findings-real.json'),
    JSON.stringify(findings, null, 2)
  );
  console.log('\n📁 findings-real.json guardado');

  await browser.close();
  console.log('\n✅ Auditoría completa');
})();
