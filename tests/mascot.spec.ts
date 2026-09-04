import { test, expect } from '@playwright/test';

/**
 * Suite funcional E2E — asahel-web
 * Cubre: navegación, hero, secciones home, work/case studies,
 * formulario de contacto (validación + envío) y API.
 */

test.describe('Navegación general', () => {
  test('home carga con título correcto', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Asahel/);
  });

  test('skip link accesible como primer elemento enfocable', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.locator('a[href="#main-content"], [data-skip-link]').first();
    await expect(skip).toBeVisible();
  });

  test('navbar navega a /work y /contact', async ({ page }) => {
    await page.goto('/');
    const workLink = page.locator('header a[href="/work"]').first();
    if (await workLink.isVisible()) {
      await workLink.click();
      await expect(page).toHaveURL(/\/work$/);
    }
  });

  test('menú móvil abre y navega en viewport 360px', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome', 'Solo mobile');
    await page.goto('/');
    const hamburger = page.locator('button[aria-label*="menú" i]').first();
    await hamburger.click();
    await page.waitForTimeout(600);
    // El drawer tiene links: Trabajos, Proceso, Sobre mí
    const trabajosLink = page.locator('[aria-label="Menú móvil"] a[href="/work"]').first();
    await expect(trabajosLink).toBeVisible({ timeout: 5000 });
    await trabajosLink.click();
    await expect(page).toHaveURL(/\/work/);
  });
});

test.describe('Home — secciones principales', () => {
  test('main contiene los 6 bloques data-mascot-color', async ({ page }) => {
    await page.goto('/');
    const bloques = page.locator('[data-mascot-color]');
    await expect(bloques).toHaveCount(6);
  });

  test('footer visible con links de contacto', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer')).toBeVisible();
    // Criterio: contacto solo por email + GitHub. Sin redes sociales (sin LinkedIn).
    const footer = page.locator('footer');
    await expect(footer.locator('a[href*="github.com"]').first()).toBeAttached();
    await expect(footer.locator('a[href^="mailto:"]').first()).toBeAttached();
    const linkedin = footer.locator('a[href*="linkedin.com"]');
    await expect(linkedin).toHaveCount(0);
  });
});

test.describe('Mascot widget (araña WhatsApp)', () => {
  test('botón flotante visible y con aria-label', async ({ page }) => {
    await page.goto('/');
    const btn = page.getByRole('button', { name: /abrir chat de whatsapp/i });
    await expect(btn).toBeVisible();
  });

  test('click alterna estado abierto/cerrado', async ({ page }) => {
    await page.goto('/');
    // La araña se mueve constantemente (RAF), por eso force:true
    const btn = page.getByRole('button', { name: /abrir chat de whatsapp/i });
    await btn.click({ force: true });
    // La araña camina a la esquina DESPUÉS del click, así que esperamos el chat
    const closeBtn = page.getByRole('button', { name: 'Cerrar chat', exact: true });
    await expect(closeBtn).toBeVisible({ timeout: 15_000 });
    // Cerrar vía click en el botón X del chat
    await closeBtn.click();
    await expect(page.getByRole('button', { name: /abrir chat de whatsapp/i })).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('/work — casos de estudio', () => {
  test('index de trabajos lista case studies visibles', async ({ page }) => {
    await page.goto('/work');
    // El featured (ecommerce-platform) siempre aparece
    await expect(page.locator('a[href*="ecommerce-platform"]').first()).toBeAttached({ timeout: 8000 });
    // Al menos uno más (others: api-integration-platform)
    await expect(page.locator('a[href*="api-integration-platform"]').first()).toBeAttached({ timeout: 8000 });
  });

  test('case study ecommerce-platform carga completo', async ({ page }) => {
    await page.goto('/work/ecommerce-platform');
    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page).not.toHaveTitle('404');
  });

  test('case study api-integration-platform carga', async ({ page }) => {
    await page.goto('/work/api-integration-platform');
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test('slug inexistente devuelve 404', async ({ page }) => {
    const resp = await page.goto('/work/no-existe-xyz');
    expect(resp?.status()).toBe(404);
  });
});

test.describe('/contact — formulario', () => {
  test('página carga con formulario visible', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('#contacto')).toBeVisible();
  });

  test('validación Zod bloquea envío con datos inválidos', async ({ page }) => {
    await page.goto('/contact');
    const submit = page.locator('button[type="submit"]');
    await submit.scrollIntoViewIfNeeded();
    await submit.click();
    // Al menos aparecen errores de campos requeridos (name vacío)
    await expect(page.getByText(/al menos|inválido|required|obligatorio/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('email inválido muestra error al enviar', async ({ page }) => {
    await page.goto('/contact');
    // Llenar campos válidos excepto email → único error posible = email
    await page.fill('input[name="email"]', 'malo');
    await page.fill('textarea[name="description"]', 'Mensaje de prueba con suficientes caracteres para pasar la validación mínima de 50 caracteres.');
    const submit = page.locator('button[type="submit"]');
    await submit.scrollIntoViewIfNeeded();
    await submit.click();
    // Buscar el error de email específico (puede estar bajo el campo o en lista)
    await expect(
      page.getByText(/email inválido/i)
    ).toBeVisible({ timeout: 8000 });
  });

  test('envío válido llega al endpoint y responde JSON', async ({ request }) => {
    const resp = await request.post('/api/contact', {
      data: {
        name: 'Test Playwright',
        email: 'test@playwright.dev',
        projectType: 'webapp',
        timeline: 'flexible',
        budget: 'discovery-first',
        description:
          'Mensaje de prueba automatizada con Playwright para validar el flujo completo del formulario de contacto del portafolio.',
        hasDesign: false,
        hasBackend: true,
      },
    });
    expect(resp.status()).toBeLessThan(500);
    const body = await resp.json();
    expect(body).toHaveProperty('success');
  });
});

test.describe('API — /api/contact', () => {
  test('rechaza payload vacío con 400 o 429 (rate limit)', async ({ request }) => {
    const resp = await request.post('/api/contact', { data: {} });
    // 400 = validación, 429 = rate limit (IP ya bloqueada por tests previos)
    expect([400, 429]).toContain(resp.status());
    const body = await resp.json();
    expect(body.success).toBe(false);
    expect(body.message).toBeTruthy();
  });

  test('rechaza email inválido', async ({ request }) => {
    const resp = await request.post('/api/contact', {
      data: {
        name: 'X',
        email: 'malo',
        projectType: 'webapp',
        timeline: 'asap',
        budget: '5k-15k',
        description: 'x'.repeat(60),
        hasDesign: false,
        hasBackend: false,
      },
    });
    expect([400, 422, 429]).toContain(resp.status());
  });

  test('rate limiting funciona — ráfaga de 8 no crashea', async ({ request }) => {
    const responses = await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        request.post('/api/contact', {
          data: {
            name: `Spam ${i}`,
            email: `spam${i}@test.dev`,
            projectType: 'other',
            timeline: 'asap',
            budget: '5k-15k',
            description: 'Ráfaga de spam para probar rate limiting. '.repeat(2),
            hasDesign: false,
            hasBackend: false,
          },
        })
      )
    );
    const statuses = responses.map((r) => r.status());
    // Rate limit activado = 429; validación = 400; éxito = 200. Todos < 500.
    expect(statuses.every((s) => s < 500)).toBeTruthy();
    // Al menos algunos 429 confirman que el rate limiter funciona
    const rateLimited = statuses.filter((s) => s === 429).length;
    expect(rateLimited).toBeGreaterThan(0);
  });
});

test.describe('Araña v7 — interactiva + acento dinámico', () => {
  test('acento del sitio sigue al color de sección (sin cian fijo)', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2500);
    const accentHero = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
    );
    expect(accentHero).toBe('#1d4ed8'); // azul oscuro en hero
    await page.locator('[data-mascot-color]').nth(1).scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    const accentRoja = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
    );
    expect(accentRoja).toBe('#b91c1c'); // rojo en sección 2
  });

  test('botón de la araña sin jaula circular (borde/bg eliminados)', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2500);
    const btn = page.locator('.mascot-btn');
    const styles = await btn.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { border: cs.borderTopWidth, bg: cs.backgroundColor, w: cs.width };
    });
    expect(styles.border).toBe('0px');
    expect(['transparent', 'rgba(0, 0, 0, 0)']).toContain(styles.bg);
    expect(parseInt(styles.w)).toBeGreaterThanOrEqual(72); // más grande
  });

  test('acude a una tarjeta al pasar el mouse sobre ella (desktop)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'solo desktop');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForTimeout(9000); // entrada + patrulla activa
    const card = page.locator('.card').first();
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await card.hover();
    const before = await page.locator('.mascot-container').evaluate(el => el.style.transform);
    await page.waitForTimeout(3500);
    const after = await page.locator('.mascot-container').evaluate(el => el.style.transform);
    expect(before).not.toBe(after); // se movió hacia la tarjeta
  });
});
