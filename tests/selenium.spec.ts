import { test, expect } from '@playwright/test';
import { Builder, By, until, type WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

/**
 * Suite SELENIUM — smoke tests con el chromedriver del sistema.
 * Complementa Playwright validando el stack clásico de WebDriver.
 */

let driver: WebDriver;

test.describe('Selenium — humo del sitio', () => {
  test.beforeEach(async ({ baseURL }) => {
    const options = new chrome.Options()
      .addArguments('--headless=new', '--no-sandbox', '--disable-dev-shm-usage') as chrome.Options;
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
    driver.manage().setTimeouts({ implicit: 5000 });
    if (baseURL) await driver.get(baseURL);
  });

  test.afterEach(async () => {
    await driver?.quit();
  });

  test('home renderiza título vía WebDriver', async () => {
    await driver.wait(until.titleContains('Asahel'), 10_000);
    expect(await driver.getTitle()).toContain('Asahel');
  });

  test('navegación a /contact funciona', async ({ baseURL }) => {
    await driver.get(`${baseURL}/contact`);
    const form = await driver.wait(
      until.elementLocated(By.id('contacto')),
      10_000
    );
    expect(await form.isDisplayed()).toBeTruthy();
  });

  test('/work lista case studies vía CSS', async ({ baseURL }) => {
    await driver.get(`${baseURL}/work`);
    await driver.wait(until.elementLocated(By.css('a[href*="ecommerce-platform"]')), 10_000);
    const links = await driver.findElements(By.css('a[href*="ecommerce-platform"]'));
    expect(links.length).toBeGreaterThan(0);
  });

  test('mascot botón presente (wait explícito)', async () => {
    const btn = await driver.wait(
      until.elementLocated(By.css('button[aria-label*="WhatsApp"]')),
      10_000
    );
    expect(await btn.isDisplayed()).toBeTruthy();
  });
});
