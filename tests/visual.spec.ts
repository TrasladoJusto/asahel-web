import { test, expect } from '@playwright/test';

/**
 * Regresión VISUAL — asahel-web
 * Primera ejecución: crea baselines (npx playwright test --update-snapshots)
 * Ejecuciones siguientes: compara contra baselines detectando regressions.
 */

const paginas = ['/', '/work', '/contact'];

test.describe('Regresión visual desktop 1440px', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const ruta of paginas) {
    test(`snapshot estable ${ruta}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'chromium-desktop', 'Solo desktop');
      await page.goto(ruta);
      await page.waitForLoadState('networkidle');
      await page.addStyleTag({
        content: `*, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
        }`,
      });
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot(`${ruta === '/' ? 'home' : ruta.replace(/\//g, '')}-desktop.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      });
    });
  }
});

test.describe('Regresión visual mobile 360px (PRD)', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('snapshot home mobile', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome', 'Solo mobile');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.addStyleTag({
      content: `*, *::before, *::after {
        animation-duration: 0s !important;
        transition-duration: 0s !important;
      }`,
    });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('home-mobile.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });
});
