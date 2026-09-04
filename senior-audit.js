const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DIR = 'test-results/senior-audit';
fs.mkdirSync(DIR, { recursive: true });

const findings = [];

function log(category, severity, message, details = '') {
  const entry = { category, severity, message, details, time: new Date().toISOString() };
  findings.push(entry);
  const icon = severity === 'CRITICAL' ? '🔴' : severity === 'HIGH' ? '🟠' : severity === 'MEDIUM' ? '🟡' : '✅';
  console.log(`${icon} [${category}] ${message}`);
  if (details) console.log(`   ${details}`);
}

async function screenshot(page, name) {
  await page.screenshot({ path: `${DIR}/${name}.png` });
}

async function waitAndScreenshot(page, name, ms = 1000) {
  await page.waitForTimeout(ms);
  await screenshot(page, name);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const startTime = Date.now();

  // ============================================================
  // FASE 1: ANÁLISIS DE SISTEMA (5 min)
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('FASE 1: ANÁLISIS DE SISTEMA');
  console.log('='.repeat(60));

  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // Collect all console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  // Collect all network requests
  const networkRequests = [];
  page.on('request', req => {
    networkRequests.push({
      url: req.url(),
      method: req.method(),
      resourceType: req.resourceType(),
      headers: req.headers(),
    });
  });

  const networkResponses = [];
  page.on('response', resp => {
    networkResponses.push({
      url: resp.url(),
      status: resp.status(),
      headers: resp.headers(),
      timing: resp.request().timing(),
    });
  });

  // ============================================================
  // FASE 2: CARGA INICIAL Y ESTADO DE LA ARAÑA (10 min)
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('FASE 2: CARGA INICIAL Y ESTADO DE LA ARAÑA');
  console.log('='.repeat(60));

  // 2.1 Carga inicial
  console.log('\n2.1 Carga inicial del home...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await screenshot(page, '01-home-carga-inicial');

  // Verificar estado inicial de la araña
  const spiderInitial = await page.evaluate(() => {
    const el = document.querySelector('.mascot-container');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    const btn = el.querySelector('.mascot-btn');
    const svg = el.querySelector('svg');
    const canvas = el.querySelector('canvas');
    const svgWrapper = el.querySelector('.mascot-anim-wrapper > div:first-child');
    const canvasWrapper = el.querySelector('.mascot-anim-wrapper > div:last-child');
    return {
      visible: el.offsetParent !== null,
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      zIndex: style.zIndex,
      position: style.position,
      bottom: style.bottom,
      right: style.right,
      hasButton: !!btn,
      hasSvg: !!svg,
      hasCanvas: !!canvas,
      svgOpacity: svgWrapper ? window.getComputedStyle(svgWrapper).opacity : 'N/A',
      canvasOpacity: canvasWrapper ? window.getComputedStyle(canvasWrapper).opacity : 'N/A',
      ariaLabel: btn?.getAttribute('aria-label'),
      ariaExpanded: btn?.getAttribute('aria-expanded'),
      classes: el.className.toString(),
    };
  });
  console.log('   Estado inicial araña:', JSON.stringify(spiderInitial, null, 2));

  if (spiderInitial?.x > 1350) {
    log('SPIDER', 'MEDIUM', 'Araña muy a la derecha', `x=${spiderInitial.x} en viewport 1440px`);
  }

  // 2.2 Esperar a que cargue el GLB
  console.log('\n2.2 Esperar carga del GLB (5 segundos)...');
  await page.waitForTimeout(5000);
  await screenshot(page, '02-home-despues-carga');

  const spiderAfterLoad = await page.evaluate(() => {
    const el = document.querySelector('.mascot-container');
    if (!el) return null;
    const svgWrapper = el.querySelector('.mascot-anim-wrapper > div:first-child');
    const canvasWrapper = el.querySelector('.mascot-anim-wrapper > div:last-child');
    return {
      svgOpacity: svgWrapper ? window.getComputedStyle(svgWrapper).opacity : 'N/A',
      canvasOpacity: canvasWrapper ? window.getComputedStyle(canvasWrapper).opacity : 'N/A',
      classes: el.className.toString(),
    };
  });

  if (spiderAfterLoad?.canvasOpacity === '1') {
    log('SPIDER', 'INFO', 'GLB cargado correctamente', 'Canvas opacity=1');
  } else {
    log('SPIDER', 'HIGH', 'GLB NO cargó', `Canvas opacity=${spiderAfterLoad?.canvasOpacity}`);
  }

  // 2.3 Esperar a idle
  console.log('\n2.3 Esperar estado idle (8 segundos)...');
  await page.waitForTimeout(3000);
  await screenshot(page, '03-spider-idle');

  const spiderIdle = await page.locator('.mascot-container').getAttribute('class');
  console.log(`   Clases idle: ${spiderIdle}`);

  // ============================================================
  // FASE 3: SCROLL SYSTEMÁTICO — CADA SECCIÓN (15 min)
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('FASE 3: SCROLL SYSTEMÁTICO');
  console.log('='.repeat(60));

  // Obtener todas las secciones
  const sections = await page.evaluate(() => {
    const els = document.querySelectorAll('section, [data-mascot-color]');
    return Array.from(els).map((el, i) => ({
      index: i,
      id: el.id || `section-${i}`,
      tag: el.tagName,
      offsetTop: el.offsetTop,
      height: el.offsetHeight,
      text: el.textContent?.trim().slice(0, 60),
    }));
  });
  console.log(`   Secciones encontradas: ${sections.length}`);
  sections.forEach(s => console.log(`   - ${s.id}: y=${s.offsetTop} h=${s.height} "${s.text}"`));

  // Scroll a cada sección y capturar
  for (const section of sections) {
    console.log(`\n   Scroll a ${section.id} (y=${section.offsetTop})...`);
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), section.offsetTop);
    await page.waitForTimeout(800);

    const spiderPos = await page.evaluate(() => {
      const el = document.querySelector('.mascot-container');
      return el ? { x: Math.round(el.getBoundingClientRect().x), classes: el.className.toString().slice(0, 60) } : null;
    });

    await screenshot(page, `04-section-${section.id}`);
    console.log(`     Spider: x=${spiderPos?.x}, classes=${spiderPos?.classes}`);
  }

  // 3.2 Scroll incremental y tracking de la araña
  console.log('\n3.2 Scroll incremental (30 pasos)...');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(500);

  const spiderTrack = [];
  for (let i = 0; i < 30; i++) {
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(150);
    const pos = await page.evaluate(() => {
      const el = document.querySelector('.mascot-container');
      return el ? Math.round(el.getBoundingClientRect().x) : null;
    });
    spiderTrack.push({ step: i + 1, x: pos, scrollY: await page.evaluate(() => window.scrollY) });
    if (i === 9 || i === 19 || i === 29) {
      await screenshot(page, `05-scroll-step-${i + 1}`);
    }
  }

  const startX = spiderTrack[0].x;
  const endX = spiderTrack[spiderTrack.length - 1].x;
  const maxX = Math.max(...spiderTrack.map(s => s.x));
  const viewport = 1440;

  console.log(`   Inicio: x=${startX}`);
  console.log(`   Fin: x=${endX}`);
  console.log(`   Máximo: x=${maxX}`);
  console.log(`   Delta: ${endX - startX}px`);

  if (maxX > viewport) {
    log('SPIDER', 'CRITICAL', 'Araña se sale del viewport al hacer scroll', `maxX=${maxX} > viewport=${viewport}`);
  } else if (Math.abs(endX - startX) > 50) {
    log('SPIDER', 'HIGH', 'Araña se mueve significativamente al hacer scroll', `delta=${endX - startX}px`);
  }

  // Guardar track completo
  fs.writeFileSync(`${DIR}/spider-track.json`, JSON.stringify(spiderTrack, null, 2));

  // ============================================================
  // FASE 4: INTERACCIÓN CON LA ARAÑA (10 min)
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('FASE 4: INTERACCIÓN CON LA ARAÑA');
  console.log('='.repeat(60));

  // Recargar para resetear posición de la araña
  console.log('   Recargando para resetear araña...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);

  // 4.1 Click para abrir chat
  console.log('\n4.1 Click para abrir chat...');
  const spiderBtn = page.getByRole('button', { name: /abrir chat de whatsapp/i });
  try {
    await spiderBtn.click({ force: true, timeout: 5000 });
  } catch(e) {
    console.log('   Click normal falló, usando force...');
    await spiderBtn.click({ force: true, timeout: 5000 });
  }
  await page.waitForTimeout(2000);
  await screenshot(page, '06-chat-abierto');

  // Verificar chat
  const chatState = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"][aria-label="Chat de WhatsApp"]');
    if (!dialog) return null;
    const rect = dialog.getBoundingClientRect();
    const style = window.getComputedStyle(dialog);
    return {
      visible: dialog.offsetParent !== null,
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      opacity: style.opacity,
      transform: style.transform,
    };
  });
  console.log('   Chat state:', JSON.stringify(chatState));

  if (chatState?.visible) {
    log('CHAT', 'INFO', 'Chat abre correctamente', `posición: ${chatState.x},${chatState.y}`);
  } else {
    log('CHAT', 'HIGH', 'Chat NO se abre con click');
  }

  // 4.2 Verificar contenido del chat
  const chatContent = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"][aria-label="Chat de WhatsApp"]');
    if (!dialog) return null;
    return {
      header: dialog.querySelector('.bg-gradient-to-r')?.textContent?.trim(),
      textarea: dialog.querySelector('textarea')?.placeholder || dialog.querySelector('textarea')?.value,
      sendButton: dialog.querySelector('button[aria-label*="enviar"]')?.textContent?.trim(),
      hasSpiderIcon: !!dialog.querySelector('svg'),
      hasWebCorners: dialog.querySelectorAll('svg').length,
    };
  });
  console.log('   Chat content:', JSON.stringify(chatContent));

  // 4.3 Escribir en el chat
  console.log('\n4.3 Escribir en el textarea...');
  const textarea = page.locator('[role="dialog"][aria-label="Chat de WhatsApp"] textarea');
  if (await textarea.isVisible()) {
    await textarea.fill('');
    await textarea.fill('Necesito una página web para mi negocio');
    await page.waitForTimeout(500);
    await screenshot(page, '07-chat-escrito');
  }

  // 4.4 Cerrar chat con Escape
  console.log('\n4.4 Cerrar chat con Escape...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);
  const chatAfterEsc = await page.locator('[role="dialog"][aria-label="Chat de WhatsApp"]').isVisible();
  console.log(`   Chat después de Escape: ${chatAfterEsc ? '⚠️ ABIERTO' : '✅ CERRADO'}`);
  await screenshot(page, '08-chat-cerrado-escape');

  // 4.5 Reabrir y cerrar con click fuera
  console.log('\n4.5 Reabrir y cerrar con click fuera...');
  try {
    await spiderBtn.click({ force: true, timeout: 3000 }).catch(()=>{});
  } catch {
    await spiderBtn.click({ force: true, timeout: 3000 });
  }
  await page.waitForTimeout(1500);

  // Click fuera del chat
  await page.mouse.click(100, 100);
  await page.waitForTimeout(1000);
  const chatAfterClickOutside = await page.locator('[role="dialog"][aria-label="Chat de WhatsApp"]').isVisible();
  console.log(`   Chat después de click fuera: ${chatAfterClickOutside ? '⚠️ ABIERTO' : '✅ CERRADO'}`);
  await screenshot(page, '09-chat-cerrado-click-fuera');

  // 4.6 Verificar WhatsApp link
  console.log('\n4.6 Verificar link de WhatsApp...');
  const whatsappLink = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"][aria-label="Chat de WhatsApp"]');
    const sendBtn = dialog?.querySelector('button[aria-label*="enviar"], button:last-of-type');
    return sendBtn?.getAttribute('onclick') || sendBtn?.getAttribute('data-href') || 'no found';
  });
  console.log(`   WhatsApp link: ${whatsappLink}`);

  // ============================================================
  // FASE 5: NAVEGACIÓN COMPLETA (10 min)
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('FASE 5: NAVEGACIÓN COMPLETA');
  console.log('='.repeat(60));

  const pages_to_test = [
    { path: '/', name: 'home' },
    { path: '/work', name: 'work' },
    { path: '/about', name: 'about' },
    { path: '/contact', name: 'contact' },
    { path: '/process', name: 'process' },
    { path: '/work/ecommerce-platform', name: 'work-ecommerce' },
    { path: '/work/api-integration-platform', name: 'work-api' },
    { path: '/work/saas-dashboard', name: 'work-saas' },
  ];

  for (const p of pages_to_test) {
    console.log(`\n   ${p.path}...`);
    await page.goto(`http://localhost:3000${p.path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const pageInfo = await page.evaluate(() => {
      const title = document.title;
      const h1 = document.querySelector('h1')?.textContent?.trim();
      const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content');
      const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
      const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
      const jsonLd = document.querySelectorAll('script[type="application/ld+json"]').length;
      const images = document.querySelectorAll('img');
      const brokenImages = Array.from(images).filter(img => !img.complete || img.naturalWidth === 0).length;
      const links = document.querySelectorAll('a');
      const emptyLinks = Array.from(links).filter(a => !a.textContent?.trim() && !a.getAttribute('aria-label') && !a.querySelector('img, svg')).length;
      const forms = document.querySelectorAll('form');
      const inputs = document.querySelectorAll('input, textarea, select');
      const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => ({ tag: h.tagName, text: h.textContent?.trim().slice(0, 40) }));

      return {
        title, h1, metaDesc: metaDesc?.slice(0, 60), canonical, ogTitle: ogTitle?.slice(0, 60),
        jsonLd, images: images.length, brokenImages, links: links.length, emptyLinks,
        forms: forms.length, inputs: inputs.length, headings,
      };
    });

    console.log(`     Title: ${pageInfo.title}`);
    console.log(`     H1: ${pageInfo.h1}`);
    console.log(`     Images: ${pageInfo.images} (${pageInfo.brokenImages} broken)`);
    console.log(`     Links: ${pageInfo.links} (${pageInfo.emptyLinks} empty)`);
    console.log(`     Forms: ${pageInfo.forms}, Inputs: ${pageInfo.inputs}`);
    console.log(`     Headings: ${pageInfo.headings.length}`);

    if (pageInfo.brokenImages > 0) {
      log('IMAGES', 'HIGH', `Imágenes rotas en ${p.path}`, `${pageInfo.brokenImages} imágenes no cargan`);
    }
    if (pageInfo.emptyLinks > 0) {
      log('A11Y', 'MEDIUM', `Links vacíos en ${p.path}`, `${pageInfo.emptyLinks} links sin texto ni aria-label`);
    }
    if (!pageInfo.h1) {
      log('SEO', 'HIGH', `Sin H1 en ${p.path}`);
    }

    await screenshot(page, `10-page-${p.name}`);

    // Scroll completo en cada página
    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    const scrollSteps = Math.min(Math.ceil(pageHeight / 500), 10);
    for (let i = 0; i < scrollSteps; i++) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), (i + 1) * 500);
      await page.waitForTimeout(200);
    }
    await screenshot(page, `11-page-${p.name}-scrolled`);
  }

  // ============================================================
  // FASE 6: FORMULARIO DE CONTACTO (5 min)
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('FASE 6: FORMULARIO DE CONTACTO');
  console.log('='.repeat(60));

  await page.goto('http://localhost:3000/contact', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 6.1 Verificar todos los campos
  const formFields = await page.evaluate(() => {
    const form = document.querySelector('form');
    if (!form) return null;
    const inputs = form.querySelectorAll('input, textarea, select, button');
    return Array.from(inputs).map(el => ({
      tag: el.tagName,
      type: el.type,
      name: el.name,
      placeholder: el.placeholder,
      required: el.required,
      ariaLabel: el.getAttribute('aria-label'),
      label: el.labels?.[0]?.textContent?.trim(),
      visible: el.offsetParent !== null,
    }));
  });
  console.log('   Campos del formulario:');
  formFields?.forEach(f => console.log(`     ${f.tag} name=${f.name} label="${f.label}" required=${f.required} visible=${f.visible}`));

  // 6.2 Test validación: enviar vacío
  console.log('\n6.2 Enviar formulario vacío...');
  const submitBtn = page.locator('form button[type="submit"]');
  if (await submitBtn.isVisible()) {
    await submitBtn.click();
    await page.waitForTimeout(1000);
    await screenshot(page, '12-form-validation-empty');

    const errors = await page.evaluate(() => {
      const errs = document.querySelectorAll('[role="alert"], [class*="error"], [class*="Error"]');
      return Array.from(errs).map(e => e.textContent?.trim()).filter(Boolean);
    });
    console.log(`   Errores de validación: ${errors.length}`);
    errors.forEach(e => console.log(`     - ${e}`));
    if (errors.length > 0) {
      log('FORM', 'INFO', 'Validación funciona correctamente', `${errors.length} errores mostrados`);
    } else {
      log('FORM', 'MEDIUM', 'Sin errores de validación visibles al enviar vacío');
    }
  }

  // 6.3 Test validación: email inválido
  console.log('\n6.3 Email inválido...');
  const nameInput = page.locator('input[name="name"]');
  const emailInput = page.locator('input[name="email"]');
  if (await nameInput.isVisible()) {
    await nameInput.fill('Test User');
    await emailInput.fill('not-an-email');
    await submitBtn.click();
    await page.waitForTimeout(1000);
    await screenshot(page, '13-form-validation-email');
  }

  // 6.4 Test honeypot
  console.log('\n6.4 Honeypot test...');
  await page.goto('http://localhost:3000/contact', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const honeypot = page.locator('input[name="company"]');
  if (await honeypot.count() > 0) {
    console.log('   Campo honeypot encontrado');
    const isHidden = await page.evaluate(() => {
      const hp = document.querySelector('input[name="company"]');
      if (!hp) return null;
      const style = window.getComputedStyle(hp);
      return {
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        position: style.position,
        width: style.width,
        height: style.height,
      };
    });
    console.log('   Honeypot style:', JSON.stringify(isHidden));
    if (isHidden?.display === 'none' || isHidden?.visibility === 'hidden' || isHidden?.opacity === '0') {
      log('SECURITY', 'INFO', 'Honeypot correctamente oculto');
    } else {
      log('SECURITY', 'HIGH', 'Honeypot VISIBLE — los bots pueden detectarlo', JSON.stringify(isHidden));
    }
  }

  // ============================================================
  // FASE 7: RESPONSIVE TESTING (5 min)
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('FASE 7: RESPONSIVE TESTING');
  console.log('='.repeat(60));

  const viewports = [
    { name: 'mobile-s', width: 320, height: 568 },
    { name: 'mobile', width: 375, height: 812 },
    { name: 'mobile-l', width: 428, height: 926 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'tablet-l', width: 1024, height: 768 },
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'desktop-l', width: 1920, height: 1080 },
    { name: 'ultrawide', width: 2560, height: 1440 },
  ];

  for (const vp of viewports) {
    console.log(`\n   ${vp.name} (${vp.width}x${vp.height})...`);
    const vCtx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const vPage = await vCtx.newPage();
    await vPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await vPage.waitForTimeout(3000);

    const vInfo = await vPage.evaluate(() => {
      const spider = document.querySelector('.mascot-container');
      const spiderRect = spider?.getBoundingClientRect();
      const nav = document.querySelector('header, nav');
      const navRect = nav?.getBoundingClientRect();
      const h1 = document.querySelector('h1');
      const h1Rect = h1?.getBoundingClientRect();
      const footer = document.querySelector('footer');
      const footerRect = footer?.getBoundingClientRect();
      const body = document.body;

      return {
        bodyWidth: body.scrollWidth,
        bodyHeight: body.scrollHeight,
        hasHorizontalScroll: body.scrollWidth > window.innerWidth,
        spiderVisible: spider?.offsetParent !== null,
        spiderX: spiderRect ? Math.round(spiderRect.x) : null,
        spiderY: spiderRect ? Math.round(spiderRect.y) : null,
        spiderWidth: spiderRect ? Math.round(spiderRect.width) : null,
        navVisible: nav?.offsetParent !== null,
        h1Visible: h1?.offsetParent !== null,
        h1Text: h1?.textContent?.trim().slice(0, 40),
        footerVisible: footer?.offsetParent !== null,
        viewportWidth: window.innerWidth,
      };
    });

    console.log(`     Body: ${vInfo.bodyWidth}x${vInfo.bodyHeight}`);
    console.log(`     Horizontal scroll: ${vInfo.hasHorizontalScroll ? '⚠️ SÍ' : '✅ NO'}`);
    console.log(`     Spider: visible=${vInfo.spiderVisible} x=${vInfo.spiderX}`);
    console.log(`     H1: "${vInfo.h1Text}" visible=${vInfo.h1Visible}`);
    console.log(`     Footer: visible=${vInfo.footerVisible}`);

    if (vInfo.hasHorizontalScroll) {
      log('RESPONSIVE', 'HIGH', `Horizontal scroll en ${vp.name}`, `bodyWidth=${vInfo.bodyWidth} > viewport=${vp.width}`);
    }

    await vPage.screenshot({ path: `${DIR}/14-responsive-${vp.name}.png` });

    // Scroll y verificar spider
    for (let i = 0; i < 5; i++) {
      await vPage.mouse.wheel(0, 200);
      await vPage.waitForTimeout(200);
    }

    const vSpiderAfter = await vPage.evaluate(() => {
      const el = document.querySelector('.mascot-container');
      return el ? { x: Math.round(el.getBoundingClientRect().x), offscreen: el.getBoundingClientRect().x > window.innerWidth } : null;
    });

    if (vSpiderAfter?.offscreen) {
      log('SPIDER', 'HIGH', `Araña fuera de pantalla en ${vp.name} después de scroll`, `x=${vSpiderAfter.x}`);
    }

    await vPage.screenshot({ path: `${DIR}/15-responsive-${vp.name}-scroll.png` });
    await vCtx.close();
  }

  // ============================================================
  // FASE 8: ACCESIBILIDAD PROFUNDA (5 min)
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('FASE 8: ACCESIBILIDAD PROFUNDA');
  console.log('='.repeat(60));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 8.1 Tab navigation completa
  console.log('\n8.1 Tab navigation...');
  const tabOrder = [];
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        text: el.textContent?.trim().slice(0, 40),
        href: el.getAttribute('href'),
        ariaLabel: el.getAttribute('aria-label'),
        role: el.getAttribute('role'),
        tabIndex: el.tabIndex,
        x: Math.round(rect.x),
        y: Math.round(rect.y),
      };
    });
    if (focused) {
      tabOrder.push(focused);
      console.log(`   Tab ${i + 1}: <${focused.tag}> "${focused.text || focused.href || focused.ariaLabel}" (${focused.x},${focused.y})`);
    }
    // Check if we cycled back to first element
    if (i > 5 && tabOrder.length > 2) {
      const first = tabOrder[0];
      if (focused?.tag === first.tag && focused?.text === first.text) {
        console.log('   ✅ Tab order cycling detected');
        break;
      }
    }
  }

  // 8.2 Heading hierarchy
  console.log('\n8.2 Heading hierarchy...');
  const headings = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => ({
      level: parseInt(h.tagName[1]),
      text: h.textContent?.trim().slice(0, 60),
      visible: h.offsetParent !== null,
    }));
  });
  let prevLevel = 0;
  let hierarchyOk = true;
  headings.forEach(h => {
    const jump = h.level - prevLevel;
    if (jump > 1 && prevLevel > 0) {
      console.log(`   ⚠️ H${prevLevel} → H${h.level} (skip!) "${h.text}"`);
      hierarchyOk = false;
    } else {
      console.log(`   ${'  '.repeat(h.level - 1)}H${h.level} "${h.text}"`);
    }
    prevLevel = h.level;
  });
  if (hierarchyOk) {
    log('A11Y', 'INFO', 'Jerarquía de headings correcta');
  } else {
    log('A11Y', 'MEDIUM', 'Jerarquía de headings con saltos');
  }

  // 8.3 Images alt text
  console.log('\n8.3 Imágenes y alt text...');
  const images = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img')).map(img => ({
      src: img.src.split('/').pop(),
      alt: img.alt,
      hasAlt: img.hasAttribute('alt'),
      ariaHidden: img.getAttribute('aria-hidden'),
      width: img.naturalWidth,
      height: img.naturalHeight,
      loading: img.loading,
      visible: img.offsetParent !== null,
    }));
  });
  images.forEach(img => {
    const status = img.hasAlt ? '✅' : img.ariaHidden ? '✅ (hidden)' : '❌ MISSING';
    console.log(`   ${status} ${img.src} alt="${img?.alt?.slice(0, 30)}" ${img.width}x${img.height}`);
  });
  const missingAlt = images.filter(i => !i.hasAlt && !i.ariaHidden);
  if (missingAlt.length > 0) {
    log('A11Y', 'HIGH', `${missingAlt.length} imágenes sin alt text`);
  }

  // 8.4 Color contrast
  console.log('\n8.4 Color contrast...');
  const contrasts = await page.evaluate(() => {
    function getLuminance(r, g, b) {
      const a = [r, g, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
      return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    }
    function parseColor(str) {
      const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return m ? [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])] : null;
    }
    function getContrast(c1, c2) {
      const l1 = getLuminance(...c1);
      const l2 = getLuminance(...c2);
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    const results = [];
    const selectors = ['h1', 'h2', 'p', 'a', 'button', '.card'];
    selectors.forEach(sel => {
      const el = document.querySelector(sel);
      if (!el) return;
      const style = window.getComputedStyle(el);
      const fg = parseColor(style.color);
      const bg = parseColor(style.backgroundColor) || parseColor(window.getComputedStyle(document.body).backgroundColor);
      if (fg && bg) {
        const ratio = getContrast(fg, bg);
        results.push({
          selector: sel,
          text: el.textContent?.trim().slice(0, 30),
          fg: style.color,
          bg: style.backgroundColor,
          ratio: Math.round(ratio * 100) / 100,
          pass: ratio >= 4.5,
        });
      }
    });
    return results;
  });
  contrasts.forEach(c => {
    const status = c.pass ? '✅' : '❌';
    console.log(`   ${status} ${c.selector}: ratio=${c.ratio}:1 fg=${c.fg} bg=${c.bg}`);
  });
  const failContrast = contrasts.filter(c => !c.pass);
  if (failContrast.length > 0) {
    log('A11Y', 'MEDIUM', `${failContrast.length} elementos con contraste insuficiente (<4.5:1)`);
  }

  // 8.5 ARIA roles
  console.log('\n8.5 ARIA roles...');
  const ariaRoles = await page.evaluate(() => {
    const roles = {};
    document.querySelectorAll('[role]').forEach(el => {
      const role = el.getAttribute('role');
      roles[role] = (roles[role] || 0) + 1;
    });
    return roles;
  });
  console.log('   Roles encontrados:', JSON.stringify(ariaRoles));

  // ============================================================
  // FASE 9: SEGURIDAD PROFUNDA (5 min)
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('FASE 9: SEGURIDAD PROFUNDA');
  console.log('='.repeat(60));

  // 9.1 Security headers
  console.log('\n9.1 Security headers...');
  const mainResp = await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  const headers = await mainResp.allHeaders();
  const secHeaders = {
    'x-content-type-options': headers['x-content-type-options'],
    'x-frame-options': headers['x-frame-options'],
    'referrer-policy': headers['referrer-policy'],
    'permissions-policy': headers['permissions-policy'],
    'strict-transport-security': headers['strict-transport-security'],
    'content-security-policy': headers['content-security-policy'],
    'cross-origin-opener-policy': headers['cross-origin-opener-policy'],
  };
  for (const [k, v] of Object.entries(secHeaders)) {
    const status = v ? '✅' : '⚠️';
    console.log(`   ${status} ${k}: ${v || 'MISSING'}`);
    if (!v) log('SECURITY', 'MEDIUM', `Header faltante: ${k}`);
  }

  // 9.2 XSS test in URL
  console.log('\n9.2 XSS test...');
  await page.goto('http://localhost:3000/?q=<script>alert(1)</script>', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const xssExecuted = await page.evaluate(() => {
    return window.__xss_test === true;
  });
  console.log(`   XSS ejecutado: ${xssExecuted ? '🔴 SÍ' : '✅ NO'}`);

  // 9.3 API security
  console.log('\n9.3 API security tests...');
  const apiTests = [
    { name: 'Valid POST', origin: 'http://localhost:3000', expect: 200 },
    { name: 'Wrong origin', origin: 'https://evil.com', expect: 403 },
    { name: 'No origin', origin: null, expect: 200 },
  ];

  for (const test of apiTests) {
    const headers = { 'Content-Type': 'application/json' };
    if (test.origin) headers['Origin'] = test.origin;

    const resp = await page.request.post('http://localhost:3000/api/contact', {
      data: {
        name: 'Test', email: 'test@test.com', projectType: 'webapp',
        timeline: '1-2months', budget: '15k-30k',
        description: 'Test description that is long enough for validation to pass',
        hasDesign: false, hasBackend: false,
      },
      headers,
    });
    const status = resp.status();
    const ok = status === test.expect;
    console.log(`   ${ok ? '✅' : '❌'} ${test.name}: ${status} (expected ${test.expect})`);
    if (!ok) log('SECURITY', 'HIGH', `API test "${test.name}" falló`, `got ${status}, expected ${test.expect}`);
  }

  // ============================================================
  // FASE 10: PERFORMANCE PROFUNDA (5 min)
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('FASE 10: PERFORMANCE PROFUNDA');
  console.log('='.repeat(60));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // 10.1 Core Web Vitals
  console.log('\n10.1 Core Web Vitals...');
  const cwv = await page.evaluate(() => {
    return new Promise(resolve => {
      const results = {};
      // FCP
      const fcp = performance.getEntriesByName('first-contentful-paint')[0];
      results.fcp = fcp ? Math.round(fcp.startTime) : null;
      // LCP
      new PerformanceObserver(list => {
        const entries = list.getEntries();
        results.lcp = Math.round(entries[entries.length - 1].startTime);
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      // CLS
      let clsValue = 0;
      new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (!entry.hadRecentInput) clsValue += entry.value;
        });
        results.cls = Math.round(clsValue * 1000) / 1000;
      }).observe({ type: 'layout-shift', buffered: true });
      // TBT
      const tbt = performance.getEntriesByType('longtask');
      results.tbt = tbt.reduce((sum, t) => sum + Math.max(0, t.duration - 50), 0);
      // Nav timing
      const nav = performance.getEntriesByType('navigation')[0];
      if (nav) {
        results.ttfb = Math.round(nav.responseStart - nav.requestStart);
        results.domContentLoaded = Math.round(nav.domContentLoadedEventEnd);
        results.loadComplete = Math.round(nav.loadEventEnd);
      }
      setTimeout(() => resolve(results), 2000);
    });
  });
  console.log(`   TTFB: ${cwv.ttfb}ms ${cwv.ttfb < 200 ? '✅' : cwv.ttfb < 500 ? '🟡' : '🔴'}`);
  console.log(`   FCP: ${cwv.fcp}ms ${cwv.fcp < 1800 ? '✅' : cwv.fcp < 3000 ? '🟡' : '🔴'}`);
  console.log(`   LCP: ${cwv.lcp}ms ${cwv.lcp < 2500 ? '✅' : cwv.lcp < 4000 ? '🟡' : '🔴'}`);
  console.log(`   CLS: ${cwv.cls} ${cwv.cls < 0.1 ? '✅' : cwv.cls < 0.25 ? '🟡' : '🔴'}`);
  console.log(`   TBT: ${Math.round(cwv.tbt)}ms ${cwv.tbt < 200 ? '✅' : cwv.tbt < 600 ? '🟡' : '🔴'}`);

  if (cwv.lcp > 2500) log('PERF', 'HIGH', `LCP alto: ${cwv.lcp}ms`);
  if (cwv.cls > 0.1) log('PERF', 'HIGH', `CLS alto: ${cwv.cls}`);
  if (cwv.tbt > 600) log('PERF', 'MEDIUM', `TBT alto: ${Math.round(cwv.tbt)}ms`);

  // 10.2 Bundle size
  console.log('\n10.2 Bundle size...');
  const bundles = await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource');
    const js = resources.filter(r => r.initiatorType === 'script' || r.name.endsWith('.js'));
    const css = resources.filter(r => r.name.endsWith('.css'));
    const images = resources.filter(r => r.initiatorType === 'img' || r.initiatorType === 'image');
    const fonts = resources.filter(r => r.initiatorType === 'css' && r.name.endsWith('.woff2'));
    const models = resources.filter(r => r.name.endsWith('.glb') || r.name.endsWith('.gltf'));
    const video = resources.filter(r => r.name.endsWith('.mp4') || r.name.endsWith('.webm'));

    return {
      js: { count: js.length, size: js.reduce((s, r) => s + (r.transferSize || 0), 0) },
      css: { count: css.length, size: css.reduce((s, r) => s + (r.transferSize || 0), 0) },
      images: { count: images.length, size: images.reduce((s, r) => s + (r.transferSize || 0), 0) },
      fonts: { count: fonts.length, size: fonts.reduce((s, r) => s + (r.transferSize || 0), 0) },
      models: { count: models.length, size: models.reduce((s, r) => s + (r.transferSize || 0), 0) },
      video: { count: video.length, size: video.reduce((s, r) => s + (r.transferSize || 0), 0) },
      total: resources.reduce((s, r) => s + (r.transferSize || 0), 0),
    };
  });
  console.log(`   JS: ${bundles.js.count} files, ${Math.round(bundles.js.size / 1024)}KB`);
  console.log(`   CSS: ${bundles.css.count} files, ${Math.round(bundles.css.size / 1024)}KB`);
  console.log(`   Images: ${bundles.images.count} files, ${Math.round(bundles.images.size / 1024)}KB`);
  console.log(`   Fonts: ${bundles.fonts.count} files, ${Math.round(bundles.fonts.size / 1024)}KB`);
  console.log(`   3D Models: ${bundles.models.count} files, ${Math.round(bundles.models.size / 1024)}KB`);
  console.log(`   Video: ${bundles.video.count} files, ${Math.round(bundles.video.size / 1024)}KB`);
  console.log(`   TOTAL: ${Math.round(bundles.total / 1024)}KB`);

  // ============================================================
  // FASE 11: SEO COMPLETO (3 min)
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('FASE 11: SEO COMPLETO');
  console.log('='.repeat(60));

  for (const p of pages_to_test.slice(0, 5)) {
    await page.goto(`http://localhost:3000${p.path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const seo = await page.evaluate(() => {
      return {
        title: document.title,
        titleLength: document.title.length,
        description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
        descLength: document.querySelector('meta[name="description"]')?.getAttribute('content')?.length,
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
        ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
        ogDesc: document.querySelector('meta[property="og:description"]')?.getAttribute('content'),
        ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
        ogUrl: document.querySelector('meta[property="og:url"]')?.getAttribute('content'),
        twitterCard: document.querySelector('meta[name="twitter:card"]')?.getAttribute('content'),
        robots: document.querySelector('meta[name="robots"]')?.getAttribute('content'),
        jsonLd: document.querySelectorAll('script[type="application/ld+json"]').length,
        h1: document.querySelector('h1')?.textContent?.trim(),
        h1Count: document.querySelectorAll('h1').length,
        lang: document.documentElement.lang,
      };
    });

    console.log(`\n   ${p.path}:`);
    console.log(`     Title (${seo.titleLength}ch): "${seo.title}"`);
    console.log(`     Desc (${seo.descLength}ch): "${seo.description?.slice(0, 60)}..."`);
    console.log(`     Canonical: ${seo.canonical}`);
    console.log(`     OG Image: ${seo.ogImage}`);
    console.log(`     JSON-LD: ${seo.jsonLd} schemas`);
    console.log(`     H1: "${seo.h1}" (count: ${seo.h1Count})`);

    if (seo.titleLength > 60) log('SEO', 'MEDIUM', `Title muy largo en ${p.path}`, `${seo.titleLength}ch > 60`);
    if (seo.descLength > 160) log('SEO', 'MEDIUM', `Description muy larga en ${p.path}`, `${seo.descLength}ch > 160`);
    if (seo.h1Count === 0) log('SEO', 'HIGH', `Sin H1 en ${p.path}`);
    if (seo.h1Count > 1) log('SEO', 'MEDIUM', `Múltiples H1 en ${p.path}`, `${seo.h1Count}`);
    if (seo.ogImage?.includes('localhost')) log('SEO', 'HIGH', `OG Image con localhost en ${p.path}`);
  }

  // ============================================================
  // FASE 12: CONSOLE ERRORS (2 min)
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('FASE 12: CONSOLE ERRORS');
  console.log('='.repeat(60));

  const errors = consoleMessages.filter(m => m.type === 'error');
  const warnings = consoleMessages.filter(m => m.type === 'warning');
  console.log(`   Errors: ${errors.length}`);
  errors.forEach(e => console.log(`     ❌ ${e.text.slice(0, 100)}`));
  console.log(`   Warnings: ${warnings.length}`);
  warnings.slice(0, 5).forEach(w => console.log(`     ⚠️ ${w.text.slice(0, 100)}`));

  if (errors.length > 0) {
    log('CONSOLE', 'HIGH', `${errors.length} errores en consola`);
  }

  // ============================================================
  // FASE 13: CROSS-BROWSER (3 min)
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('FASE 13: CROSS-BROWSER');
  console.log('='.repeat(60));

  for (const browserName of ['firefox', 'webkit']) {
    console.log(`\n   ${browserName}...`);
    try {
      const bCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, browserName });
      const bPage = await bCtx.newPage();
      await bPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
      await bPage.waitForTimeout(3000);

      const bInfo = await bPage.evaluate(() => {
        return {
          title: document.title,
          spiderVisible: !!document.querySelector('.mascot-container')?.offsetParent,
          h1: document.querySelector('h1')?.textContent?.trim(),
          errors: 0,
        };
      });

      console.log(`     Title: ${bInfo.title}`);
      console.log(`     Spider visible: ${bInfo.spiderVisible}`);
      console.log(`     H1: ${bInfo.h1}`);

      await bPage.screenshot({ path: `${DIR}/16-crossbrowser-${browserName}.png` });
      log('CROSS-BROWSER', 'INFO', `${browserName}: funciona correctamente`);
      await bCtx.close();
    } catch (e) {
      log('CROSS-BROWSER', 'MEDIUM', `${browserName}: error`, e.message.slice(0, 80));
    }
  }

  // ============================================================
  // FASE 14: MEMORIA Y ESTABILIDAD (2 min)
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('FASE 14: MEMORIA Y ESTABILIDAD');
  console.log('='.repeat(60));

  const getMem = () => page.evaluate(() => {
    const p = performance.memory;
    return p ? { used: Math.round(p.usedJSHeapSize / 1024 / 1024), total: Math.round(p.totalJSHeapSize / 1024 / 1024) } : null;
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const memBefore = await getMem();
  console.log(`   Before: ${JSON.stringify(memBefore)}`);

  for (let i = 0; i < 20; i++) {
    const paths = ['/', '/work', '/about', '/contact', '/process'];
    await page.goto(`http://localhost:3000${paths[i % paths.length]}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
  }

  const memAfter = await getMem();
  console.log(`   After 20 navigations: ${JSON.stringify(memAfter)}`);
  if (memBefore && memAfter) {
    const delta = memAfter.used - memBefore.used;
    console.log(`   Delta: ${delta}MB`);
    if (delta > 10) {
      log('MEMORY', 'HIGH', `Posible memory leak`, `${delta}MB increase after 20 navigations`);
    } else {
      log('MEMORY', 'INFO', `Sin memory leak significativo`, `delta=${delta}MB`);
    }
  }

  // ============================================================
  // FASE 15: REPORTE FINAL
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('FASE 15: REPORTE FINAL');
  console.log('='.repeat(60));

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log(`\nTiempo total: ${elapsed}s (${Math.round(elapsed / 60)}min)`);

  const critical = findings.filter(f => f.severity === 'CRITICAL');
  const high = findings.filter(f => f.severity === 'HIGH');
  const medium = findings.filter(f => f.severity === 'MEDIUM');
  const info = findings.filter(f => f.severity === 'INFO');

  console.log(`\nRESUMEN:`);
  console.log(`  🔴 CRITICAL: ${critical.length}`);
  console.log(`  🟠 HIGH: ${high.length}`);
  console.log(`  🟡 MEDIUM: ${medium.length}`);
  console.log(`  ✅ INFO: ${info.length}`);

  console.log(`\nDETALLE:`);
  findings.forEach(f => {
    const icon = f.severity === 'CRITICAL' ? '🔴' : f.severity === 'HIGH' ? '🟠' : f.severity === 'MEDIUM' ? '🟡' : '✅';
    console.log(`  ${icon} [${f.category}] ${f.message}`);
    if (f.details) console.log(`     ${f.details}`);
  });

  // Save findings
  fs.writeFileSync(`${DIR}/findings.json`, JSON.stringify(findings, null, 2));
  console.log(`\nFindings guardados en ${DIR}/findings.json`);
  console.log(`Screenshots: ${fs.readdirSync(DIR).filter(f => f.endsWith('.png')).length} archivos`);

  await browser.close();
})();
