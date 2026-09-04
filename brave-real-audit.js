const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'test-results', 'real-brave');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const page = browser.contexts()[0].pages().find(p => p.url().includes('localhost:3000'));
  if (!page) { console.log('No hay pestaña localhost:3000'); return; }
  
  console.log('Conectado. Página:', await page.title());
  
  // Ir al home
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));
  
  // 1. Spider: ver por qué no aparece
  console.log('\n=== SPIDER CHECK ===');
  const spiderInfo = await page.evaluate(() => {
    const widget = document.querySelector('#mascot-widget');
    const chat = document.querySelector('.spider-chat-bubble');
    const canvas = document.querySelector('#mascot-widget canvas');
    return {
      widgetExists: !!widget,
      widgetDisplay: widget?.style?.display,
      widgetComputed: widget ? getComputedStyle(widget).display : 'N/A',
      widgetVisibility: widget ? getComputedStyle(widget).visibility : 'N/A',
      chatExists: !!chat,
      canvasExists: !!canvas,
      canvasOpacity: canvas ? getComputedStyle(canvas).opacity : 'N/A',
      allDivCount: document.querySelectorAll('div').length,
      bodyClasses: document.body.className,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
    };
  });
  console.log(JSON.stringify(spiderInfo, null, 2));
  
  // Forzar mostrar spider
  await page.evaluate(() => {
    const w = document.querySelector('#mascot-widget');
    if (w) { w.style.display = 'block'; w.style.opacity = '1'; }
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(DIR, 'spider-forced-visible.png') });
  console.log('📸 spider-forced-visible.png');
  
  // 2. Nav duplicate check
  console.log('\n=== NAV CHECK ===');
  const navInfo = await page.evaluate(() => {
    const navs = document.querySelectorAll('nav');
    return Array.from(navs).map((n, i) => ({
      index: i,
      visible: getComputedStyle(n).display !== 'none',
      links: n.querySelectorAll('a').length,
      position: getComputedStyle(n).position,
    }));
  });
  console.log(JSON.stringify(navInfo, null, 2));
  
  // 3. Honeypot visibility check
  console.log('\n=== HONEYPOT CHECK ===');
  await page.goto('http://localhost:3000/contact', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 1500));
  const honeypotInfo = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[name="website"], input[name="honeypot"]');
    return Array.from(inputs).map(i => ({
      name: i.name,
      type: i.type,
      display: getComputedStyle(i).display,
      visibility: getComputedStyle(i).visibility,
      opacity: getComputedStyle(i).opacity,
      width: getComputedStyle(i).width,
      height: getComputedStyle(i).height,
      position: getComputedStyle(i).position,
      tabIndex: i.tabIndex,
    }));
  });
  console.log(JSON.stringify(honeypotInfo, null, 2));
  await page.screenshot({ path: path.join(DIR, 'contact-honeypot.png') });
  console.log('📸 contact-honeypot.png');
  
  // 4. Form submit empty
  console.log('\n=== FORM TEST ===');
  await page.evaluate(() => {
    const form = document.querySelector('form');
    if (form) form.scrollIntoView({ block: 'center' });
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(DIR, 'form-before-submit.png') });
  
  const submitBtn = page.locator('button[type="submit"]').first();
  if (await submitBtn.isVisible()) {
    await submitBtn.click({ force: true });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(DIR, 'form-after-submit-empty.png') });
    console.log('📸 form-after-submit-empty.png');
    
    const errors = await page.evaluate(() => {
      const errEls = document.querySelectorAll('[class*="error"], [role="alert"], .text-red, [class*="red"]');
      return Array.from(errEls).map(e => e.textContent.trim()).filter(t => t.length > 0 && t.length < 200);
    });
    console.log('Errores:', errors.length > 0 ? errors : 'NINGUNO visible');
  }
  
  // Fill form
  const nameInput = page.locator('input[name="name"]').first();
  if (await nameInput.isVisible()) await nameInput.fill('Asahel Test');
  const emailInput = page.locator('input[name="email"]').first();
  if (await emailInput.isVisible()) await emailInput.fill('test@test.com');
  const msgInput = page.locator('textarea').first();
  if (await msgInput.isVisible()) await msgInput.fill('Mensaje de prueba');
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(DIR, 'form-filled.png') });
  console.log('📸 form-filled.png');
  
  // 5. OG Image check
  console.log('\n=== OG IMAGE ===');
  const ogInfo = await page.evaluate(() => {
    const og = document.querySelector('meta[property="og:image"]');
    return og?.content || 'NO OG:IMAGE';
  });
  console.log('og:image =', ogInfo);
  
  // 6. Full page screenshot
  console.log('\n=== FULL PAGE SCREENSHOTS ===');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(DIR, 'home-desktop-1440.png') });
  console.log('📸 home-desktop-1440.png');
  
  // Full page
  await page.screenshot({ path: path.join(DIR, 'home-fullpage.png'), fullPage: true });
  console.log('📸 home-fullpage.png (full page)');
  
  // 7. Mobile
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(DIR, 'home-mobile-375.png') });
  console.log('📸 home-mobile-375.png');
  
  // 8. All pages
  for (const p of ['work', 'about', 'process', 'contact']) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`http://localhost:3000/${p}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(DIR, `page-${p}-1440.png`) });
    console.log(`📸 page-${p}-1440.png`);
  }
  
  // 9. Security headers
  console.log('\n=== SECURITY HEADERS ===');
  const resp = await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 10000 });
  const headers = resp.headers();
  for (const h of ['content-security-policy', 'strict-transport-security', 'x-content-type-options', 'x-frame-options', 'permissions-policy', 'referrer-policy']) {
    console.log(`  ${h}: ${headers[h] ? '✅' : '❌ FALTANTE'}`);
  }
  
  // 10. Images check
  console.log('\n=== IMAGES ===');
  const imgInfo = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    return Array.from(imgs).map(i => ({
      src: i.src.substring(i.src.lastIndexOf('/') + 1),
      alt: i.alt || '(sin alt)',
      loaded: i.complete && i.naturalWidth > 0,
      size: `${i.naturalWidth}x${i.naturalHeight}`
    }));
  });
  imgInfo.forEach(i => console.log(`  ${i.src}: alt="${i.alt}" loaded=${i.loaded} size=${i.size}`));
  
  // 11. Console errors
  console.log('\n=== CONSOLE ERRORS ===');
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
  await new Promise(r => setTimeout(r, 3000));
  console.log(consoleErrors.length > 0 ? consoleErrors.join('\n') : 'Sin errores en consola');
  
  console.log('\n=== DONE ===');
  console.log(`Screenshots: ${fs.readdirSync(DIR).filter(f => f.endsWith('.png')).length}`);
  
  // No cerramos Brave, solo desconectamos
  browser.close();
})();
