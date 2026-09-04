const { chromium } = require('playwright');
const fs = require('fs');

const VIEWPORTS = [
  { name: 'iphone-se', width: 375, height: 667 },
  { name: 'iphone-14', width: 390, height: 844 },
  { name: 'ipad-mini', width: 768, height: 1024 },
  { name: 'laptop-13', width: 1366, height: 768 },
  { name: 'desktop-1080', width: 1920, height: 1080 },
];

const PAGES = [
  { path: '/', name: 'home' },
  { path: '/work', name: 'work' },
  { path: '/about', name: 'about' },
  { path: '/process', name: 'process' },
  { path: '/contact', name: 'contact' },
];

const DIR = 'test-results/human-analysis';

(async () => {
  fs.rmSync(DIR, { recursive: true, force: true });
  fs.mkdirSync(DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of VIEWPORTS) {
    for (const pg of PAGES) {
      let ctx;
      try {
        ctx = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
        });
        const page = await ctx.newPage();

        await page.goto(`http://localhost:3456${pg.path}`, { waitUntil: 'networkidle', timeout: 12000 });
        await page.waitForTimeout(5000);

        // 1. Initial
        await page.screenshot({ path: `${DIR}/${vp.name}-${pg.name}-01-initial.png` });
        results.push({ vp: vp.name, page: pg.name, state: 'initial' });

        // 2. Scroll 400px
        await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
        await page.waitForTimeout(1200);
        await page.screenshot({ path: `${DIR}/${vp.name}-${pg.name}-02-scroll.png` });
        results.push({ vp: vp.name, page: pg.name, state: 'scroll' });

        // 3. Bottom
        await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `${DIR}/${vp.name}-${pg.name}-03-bottom.png` });
        results.push({ vp: vp.name, page: pg.name, state: 'bottom' });

        // 4. Scroll back top
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
        await page.waitForTimeout(1000);

        // 5. Click spider
        await page.mouse.click(vp.width - 50, vp.height - 50);
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `${DIR}/${vp.name}-${pg.name}-04-spider-open.png` });
        results.push({ vp: vp.name, page: pg.name, state: 'spider-open' });

        // 6. Close spider
        await page.mouse.click(vp.width - 50, vp.height - 50);
        await page.waitForTimeout(800);

        // 7. Hover card (desktop)
        if (vp.width >= 1024) {
          const card = await page.$('.card');
          if (card) {
            const box = await card.boundingBox();
            if (box) {
              await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
              await page.waitForTimeout(2000);
              await page.screenshot({ path: `${DIR}/${vp.name}-${pg.name}-05-hover-card.png` });
              results.push({ vp: vp.name, page: pg.name, state: 'hover-card' });
            }
          }
        }

        await ctx.close();
        console.log(`✓ ${vp.name} × ${pg.name}`);
      } catch (e) {
        console.log(`✗ ${vp.name} × ${pg.name}: ${e.message.split('\n')[0]}`);
        if (ctx) await ctx.close().catch(() => {});
      }
    }
  }

  fs.writeFileSync(`${DIR}/summary.json`, JSON.stringify(results, null, 2));
  console.log(`\n📊 Total: ${results.length} screenshots`);
  await browser.close();
})();
