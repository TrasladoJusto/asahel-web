const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'test-results', 'spider-analysis');
fs.mkdirSync(DIR, { recursive: true });

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log('=== ANÁLISIS VISUAL DE LA ARAÑA ===\n');
  
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const page = browser.contexts()[0].pages().find(p => p.url().includes('localhost:3000'));
  if (!page) { console.log('No hay pestaña localhost:3000'); return; }
  
  // Ir al home
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 20000 });
  await sleep(3000);
  
  // ============================================
  // FASE 1: Spider initial state
  // ============================================
  console.log('--- FASE 1: Estado inicial de la araña ---');
  
  // Buscar el widget
  const widgetInfo = await page.evaluate(() => {
    // Buscar por diferentes selectores
    const selectors = ['#mascot-widget', '[id*="mascot"]', '[class*="mascot"]', '[class*="spider"]', 'canvas'];
    const results = {};
    for (const sel of selectors) {
      const els = document.querySelectorAll(sel);
      results[sel] = els.length;
    }
    
    // Buscar canvas específicamente
    const canvases = document.querySelectorAll('canvas');
    results.canvases = Array.from(canvases).map(c => ({
      id: c.id,
      width: c.width,
      height: c.height,
      opacity: getComputedStyle(c).opacity,
      display: getComputedStyle(c).display,
      position: getComputedStyle(c).position,
      rect: c.getBoundingClientRect()
    }));
    
    return results;
  });
  console.log(JSON.stringify(widgetInfo, null, 2));
  
  // Tomar screenshot del estado inicial
  await page.screenshot({ path: path.join(DIR, '01-spider-initial.png') });
  console.log('📸 01-spider-initial.png');
  
  // ============================================
  // FASE 2: Spider after scroll
  // ============================================
  console.log('\n--- FASE 2: Spider durante scroll ---');
  
  for (let i = 1; i <= 10; i++) {
    await page.mouse.wheel(0, 500);
    await sleep(800);
    
    const scrollY = await page.evaluate(() => window.scrollY);
    
    // Obtener posición de la araña
    const spiderPos = await page.evaluate(() => {
      const canvases = document.querySelectorAll('canvas');
      for (const c of canvases) {
        const rect = c.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          return {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            visible: getComputedStyle(c).opacity !== '0' && getComputedStyle(c).display !== 'none'
          };
        }
      }
      
      // Buscar por mascot widget
      const widget = document.querySelector('#mascot-widget');
      if (widget) {
        const rect = widget.getBoundingClientRect();
        return {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          visible: getComputedStyle(widget).display !== 'none'
        };
      }
      
      return null;
    });
    
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    const offScreen = spiderPos ? spiderPos.x > viewportWidth || spiderPos.x + spiderPos.width < 0 : 'N/A';
    
    console.log(`  Scroll ${i}: scrollY=${scrollY}, spider x=${spiderPos?.x}, viewport=${viewportWidth}, offScreen=${offScreen}`);
    
    if (i === 3 || i === 6 || i == 10) {
      await page.screenshot({ path: path.join(DIR, `02-spider-scroll-${i}.png`) });
      console.log(`  📸 02-spider-scroll-${i}.png`);
    }
  }
  
  // ============================================
  // FASE 3: Spider position analysis
  // ============================================
  console.log('\n--- FASE 3: Análisis de posición ---');
  
  // Volver al top
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(2000);
  
  const positions = [];
  for (let i = 0; i < 15; i++) {
    await page.mouse.wheel(0, 300);
    await sleep(500);
    
    const pos = await page.evaluate(() => {
      const canvases = document.querySelectorAll('canvas');
      for (const c of canvases) {
        const rect = c.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          return { x: Math.round(rect.x), y: Math.round(rect.y) };
        }
      }
      return null;
    });
    
    positions.push({ step: i + 1, ...pos });
  }
  
  console.log('Posiciones de la araña:');
  positions.forEach(p => console.log(`  Step ${p.step}: x=${p.x}, y=${p.y}`));
  
  // Verificar si se sale del viewport
  const viewportWidth = 1440;
  const offScreenSteps = positions.filter(p => p.x > viewportWidth || p.x < 0);
  console.log(`\nPasos fuera del viewport: ${offScreenSteps.length}/${positions.length}`);
  if (offScreenSteps.length > 0) {
    console.log('❌ La araña SÍ se sale del viewport');
    offScreenSteps.forEach(s => console.log(`  Step ${s.step}: x=${s.x}`));
  } else {
    console.log('✅ La araña NO se sale del viewport');
  }
  
  // ============================================
  // FASE 4: Spider chat interaction
  // ============================================
  console.log('\n--- FASE 4: Interacción con chat ---');
  
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(1000);
  
  // Buscar y hacer click en la araña
  const spiderClicked = await page.evaluate(() => {
    const canvases = document.querySelectorAll('canvas');
    for (const c of canvases) {
      const rect = c.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        c.click();
        return true;
      }
    }
    return false;
  });
  
  console.log('Click en canvas:', spiderClicked);
  await sleep(1500);
  
  // Verificar si abrió chat
  const chatState = await page.evaluate(() => {
    const chatBubble = document.querySelector('.spider-chat-bubble, [class*="chat-bubble"]');
    const chatText = document.querySelector('.spider-chat-bubble p, [class*="chat-bubble"] p');
    return {
      chatExists: !!chatBubble,
      chatVisible: chatBubble ? getComputedStyle(chatBubble).display !== 'none' : false,
      chatText: chatText?.textContent || 'N/A'
    };
  });
  console.log('Chat state:', JSON.stringify(chatState));
  
  await page.screenshot({ path: path.join(DIR, '03-spider-chat.png') });
  console.log('📸 03-spider-chat.png');
  
  // ============================================
  // FASE 5: Spider on different pages
  // ============================================
  console.log('\n--- FASE 5: Spider en diferentes páginas ---');
  
  for (const p of ['work', 'about', 'process', 'contact']) {
    await page.goto(`http://localhost:3000/${p}`, { waitUntil: 'networkidle', timeout: 15000 });
    await sleep(2000);
    
    const spiderOnPage = await page.evaluate(() => {
      const canvases = document.querySelectorAll('canvas');
      for (const c of canvases) {
        const rect = c.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          return {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            visible: getComputedStyle(c).opacity !== '0'
          };
        }
      }
      return null;
    });
    
    console.log(`  ${p}: spider at x=${spiderOnPage?.x}, visible=${spiderOnPage?.visible}`);
    await page.screenshot({ path: path.join(DIR, `04-spider-${p}.png`) });
    console.log(`  📸 04-spider-${p}.png`);
  }
  
  // ============================================
  // FASE 6: Spider size and style analysis
  // ============================================
  console.log('\n--- FASE 6: Análisis de estilo ---');
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
  await sleep(2000);
  
  const spiderStyle = await page.evaluate(() => {
    const canvases = document.querySelectorAll('canvas');
    for (const c of canvases) {
      const rect = c.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const style = getComputedStyle(c);
        return {
          width: rect.width,
          height: rect.height,
          opacity: style.opacity,
          position: style.position,
          zIndex: style.zIndex,
          transform: style.transform,
          filter: style.filter,
          className: c.className,
          id: c.id,
          parentClass: c.parentElement?.className,
          parentId: c.parentElement?.id
        };
      }
    }
    return null;
  });
  console.log(JSON.stringify(spiderStyle, null, 2));
  
  // ============================================
  // RESUMEN
  // ============================================
  console.log('\n=== RESUMEN ANÁLISIS ARAÑA ===');
  console.log(`Screenshots: ${fs.readdirSync(DIR).filter(f => f.endsWith('.png')).length}`);
  console.log(`Off-screen during scroll: ${offScreenSteps.length > 0 ? '❌ SÍ' : '✅ NO'}`);
  console.log(`Chat interaction: ${chatState.chatExists ? '✅' : '❌'}`);
  
  // Guardar findings
  const findings = {
    timestamp: new Date().toISOString(),
    spiderStyle,
    positions,
    offScreenSteps: offScreenSteps.length,
    chatState,
    screenshots: fs.readdirSync(DIR).filter(f => f.endsWith('.png'))
  };
  fs.writeFileSync(path.join(DIR, 'spider-findings.json'), JSON.stringify(findings, null, 2));
  console.log('\n📁 spider-findings.json guardado');
  
  browser.close();
})();
