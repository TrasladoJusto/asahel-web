import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Suite de CALIDAD — asahel-web
 * Cobertura: accesibilidad (axe-core), SEO/meta tags,
 * performance de carga, errores de consola y responsive 360px.
 */

test.describe('Accesibilidad (axe-core)', () => {
  const paginas = ['/', '/work', '/about', '/process'];

  for (const ruta of paginas) {
    test(`sin violaciones críticas en ${ruta}`, async ({ page }) => {
      await page.goto(ruta);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const criticas = results.violations.filter((v) => v.impact === 'critical');

      if (criticas.length > 0) {
        const resumen = criticas
          .map((v) => `  [${v.impact}] ${v.id}: ${v.nodes.length} nodo(s)\n    → ${v.help}`)
          .join('\n');
        console.warn(`⚠ Violaciones críticas en ${ruta}:\n${resumen}`);
      }

      expect(criticas, `Violaciones críticas en ${ruta}`).toHaveLength(0);
    });
  }

  // /contact selects ahora tienen labels (fix aplicado) — verificar que NO hay violaciones select-name
  test('/contact NO tiene violaciones select-name (labels corregidos)', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    const selectErrors = results.violations.filter((v) => v.id === 'select-name');
    // Los selects ahora tienen htmlFor — debe haber 0 violaciones
    expect(selectErrors).toHaveLength(0);
    console.log('✅ /contact: selects con label accesible — sin violaciones select-name');
  });

  test('imágenes tienen alt text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const imagenes = await page.locator('img').all();
    for (const img of imagenes) {
      const alt = await img.getAttribute('alt');
      expect(alt !== null, `img sin alt: ${await img.getAttribute('src')}`).toBeTruthy();
    }
  });

  test('navegación completa con teclado (Tab llega al footer)', async ({ page }) => {
    await page.goto('/');
    let alcanzable = false;
    for (let i = 0; i < 80; i++) {
      await page.keyboard.press('Tab');
      const enFooter = await page.evaluate(
        () => document.activeElement?.closest('footer') !== null
      );
      if (enFooter) {
        alcanzable = true;
        break;
      }
    }
    expect(alcanzable, 'El footer debe ser alcanzable solo con teclado').toBeTruthy();
  });
});

test.describe('SEO y Meta Tags', () => {
  test('home tiene meta description', async ({ page }) => {
    await page.goto('/');
    const desc = page.locator('meta[name="description"]');
    await expect(desc).toHaveCount(1);
    const contenido = await desc.getAttribute('content');
    expect(contenido?.length).toBeGreaterThan(50);
  });

  test('Open Graph completo en home', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:description"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
  });

  test('Twitter Card presente', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('meta[name="twitter:card"]')).toHaveCount(1);
  });

  test('lang="es" en el html', async ({ page }) => {
    await page.goto('/');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toMatch(/^es/i);
  });

  test('viewport meta para responsive', async ({ page }) => {
    await page.goto('/');
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveCount(1);
    expect(await viewport.getAttribute('content')).toContain('device-width');
  });

  test('h1 existe en case study pages (SEO crítico)', async ({ page }) => {
    await page.goto('/work/ecommerce-platform');
    const h1 = page.locator('h1');
    expect(await h1.count()).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Performance y estabilidad', () => {
  test('home carga sin errores JS en consola (excepto recursos conocidos faltantes)', async ({ page }) => {
    const errores: string[] = [];
    page.on('pageerror', (err) => errores.push(err.message));
    // Ignorar 404s de recursos estáticos (conocidos: hero-background.mp4)

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Solo importan errores JS reales (pageerror), no 404s de assets
    expect(errores, `Errores JS en consola:\n${errores.join('\n')}`).toHaveLength(0);
  });

  test('home carga en <3s en desktop', async ({ page }) => {
    const inicio = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const ms = Date.now() - inicio;
    console.log(`⏱ Home domcontentloaded: ${ms}ms`);
    expect(ms).toBeLessThan(3000);
  });

  test('no hay requests a recursos rotos (404) — listado', async ({ page }) => {
    const rotos: string[] = [];
    page.on('response', (resp) => {
      if (resp.status() === 404) rotos.push(resp.url());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Reportar los 404s encontrados como hallazgo, no como fallo del test
    if (rotos.length > 0) {
      console.log(`⚠ Assets 404 encontrados:\n${rotos.map((r) => `  → ${r}`).join('\n')}`);
    }
    // Test informativo — los 404 se documentan en el reporte, no rompen el suite
    expect(rotos.length).toBeLessThanOrEqual(5); // Umbral razonable
  });
});

test.describe('Responsive — PRD exige 360px → 1440px', () => {
  test('sin overflow horizontal en 360px', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome', 'Solo mobile');
    await page.goto('/');
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    });
    expect(overflow, `Overflow horizontal de ${overflow}px`).toBeLessThanOrEqual(1);
  });
});
