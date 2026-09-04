import { chromium } from 'playwright';

const SECTIONS = [
  { id: 'about', label: 'about' },
  { id: 'servicios', label: 'servicios' },
  { id: 'portfolio', label: 'portfolio' },
  { id: 'proceso', label: 'proceso' },
];

(async () => {
  const browser = await chromium.launch({ headless: true });

  // Desktop
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await desktop.goto('http://localhost:3737', { waitUntil: 'networkidle' });
  await desktop.waitForTimeout(1500);

  for (const s of SECTIONS) {
    await desktop.evaluate((id) => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'instant', block: 'start' });
    }, s.id);
    await desktop.waitForTimeout(800);
    await desktop.screenshot({ path: `/tmp/analysis/desktop-${s.label}.png` });
    console.log(`desktop-${s.label}.png`);
  }

  // CTA section (no id, scroll to bottom)
  await desktop.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await desktop.waitForTimeout(800);
  await desktop.screenshot({ path: '/tmp/analysis/desktop-cta.png' });
  console.log('desktop-cta.png');

  await desktop.close();

  // Mobile
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto('http://localhost:3737', { waitUntil: 'networkidle' });
  await mobile.waitForTimeout(1500);

  for (const s of SECTIONS) {
    await mobile.evaluate((id) => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'instant', block: 'start' });
    }, s.id);
    await mobile.waitForTimeout(800);
    await mobile.screenshot({ path: `/tmp/analysis/mobile-${s.label}.png` });
    console.log(`mobile-${s.label}.png`);
  }

  // CTA section mobile
  await mobile.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await mobile.waitForTimeout(800);
  await mobile.screenshot({ path: '/tmp/analysis/mobile-cta.png' });
  console.log('mobile-cta.png');

  await mobile.close();
  await browser.close();
  console.log('Done.');
})();
