import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __evidenceDir = dirname(fileURLToPath(import.meta.url));

/**
 * Evidence capture for ASSESSMENT.md §9.
 *
 * Run with: npx playwright test evidence --reporter=list
 *
 * Outputs to ../evidence/:
 *   - screenshots/desktop/{step1..step4-success}.png
 *   - screenshots/mobile/{step1..step4-success}.png
 *   - screenshots/states/{error,empty,disabled-skips,price-breakdown}.png
 *   - a11y/{step1..step4}.json
 * Video for Flow B is captured automatically via project config.
 */

const OUT_ROOT = resolve(__evidenceDir, '../../../evidence');
const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 375, height: 667 };

function saveJson(path: string, data: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2));
}

async function fullFlow(page: import('@playwright/test').Page, dir: 'desktop' | 'mobile') {
  const shot = async (name: string) => {
    await page.screenshot({
      path: `${OUT_ROOT}/screenshots/${dir}/${name}.png`,
      fullPage: true,
    });
  };

  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, undefined, {
    timeout: 10_000,
  });
  await page.request.post('/_mocks/reset');

  // Step 1 — idle
  await shot('01-step1-idle');

  // Step 1 — results
  await page.getByLabel('Postcode').fill('SW1A 1AA');
  await page.getByTestId('postcode-submit').click();
  await expect(page.getByTestId('address-list')).toBeVisible();
  await shot('02-step1-results');

  await page.getByTestId('address-option-addr_sw1a_01').click();
  await page.getByTestId('postcode-continue').click();

  // Step 2
  await expect(page.getByRole('heading', { name: /type of waste/i })).toBeVisible();
  await shot('03-step2-waste');
  await page.getByTestId('waste-heavy').locator('input').click();
  await page.getByTestId('waste-plasterboard').locator('input').click();
  await page.getByTestId('plasterboard-under_10').click();
  await shot('04-step2-plasterboard-expanded');

  await page.getByTestId('waste-continue').click();

  // Step 3 — with disabled skips visible
  await expect(page.getByRole('heading', { name: /choose your skip/i })).toBeVisible();
  await shot('05-step3-skips');
  // Zoom on disabled card
  const disabled = page.locator('[data-testid^="skip-"][data-disabled="true"]').first();
  await expect(disabled).toBeVisible();
  await disabled.scrollIntoViewIfNeeded();
  await shot('06-step3-disabled-skips');

  await page.getByTestId('skip-6-yard').click();
  await page.getByTestId('skip-continue').click();

  // Step 4 — review + price breakdown
  await expect(page.getByRole('heading', { name: /review and confirm/i })).toBeVisible();
  await shot('07-step4-review');

  // Confirm
  await page.getByTestId('confirm-booking').click();
  await expect(page.getByTestId('booking-success')).toBeVisible();
  await shot('08-success');
}

test.describe('evidence capture', () => {
  test('desktop — full flow screenshots + axe per step', async ({ browser }) => {
    const context = await browser.newContext({ viewport: DESKTOP });
    const page = await context.newPage();

    await page.goto('/');
    await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, undefined, {
      timeout: 10_000,
    });
    await page.request.post('/_mocks/reset');

    // Step 1 axe
    await page.getByLabel('Postcode').fill('SW1A 1AA');
    await page.getByTestId('postcode-submit').click();
    await expect(page.getByTestId('address-list')).toBeVisible();
    const axe1 = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    saveJson(`${OUT_ROOT}/a11y/step1.json`, axe1);

    // Step 2 axe
    await page.getByTestId('address-option-addr_sw1a_01').click();
    await page.getByTestId('postcode-continue').click();
    await expect(page.getByRole('heading', { name: /type of waste/i })).toBeVisible();
    const axe2 = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    saveJson(`${OUT_ROOT}/a11y/step2.json`, axe2);

    // Step 3 axe (heavy + plasterboard)
    await page.getByTestId('waste-heavy').locator('input').click();
    await page.getByTestId('waste-plasterboard').locator('input').click();
    await page.getByTestId('plasterboard-under_10').click();
    await page.getByTestId('waste-continue').click();
    await expect(page.getByRole('heading', { name: /choose your skip/i })).toBeVisible();
    const axe3 = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    saveJson(`${OUT_ROOT}/a11y/step3.json`, axe3);

    // Step 4 axe
    await page.getByTestId('skip-6-yard').click();
    await page.getByTestId('skip-continue').click();
    await expect(page.getByRole('heading', { name: /review and confirm/i })).toBeVisible();
    const axe4 = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    saveJson(`${OUT_ROOT}/a11y/step4.json`, axe4);

    // Write a summary
    const violations = [axe1, axe2, axe3, axe4].map((r, i) => ({
      step: i + 1,
      violations: r.violations.length,
      critical: r.violations.filter((v) => v.impact === 'critical').length,
      serious: r.violations.filter((v) => v.impact === 'serious').length,
    }));
    saveJson(`${OUT_ROOT}/a11y/summary.json`, { generatedAt: new Date().toISOString(), steps: violations });

    await context.close();
  });

  test('desktop — flow screenshots', async ({ browser }) => {
    const context = await browser.newContext({ viewport: DESKTOP });
    const page = await context.newPage();
    await fullFlow(page, 'desktop');
    await context.close();
  });

  test('mobile — flow screenshots', async ({ browser }) => {
    const context = await browser.newContext({ viewport: MOBILE });
    const page = await context.newPage();
    await fullFlow(page, 'mobile');
    await context.close();
  });

  test('error + retry state screenshot', async ({ browser }) => {
    const context = await browser.newContext({ viewport: DESKTOP });
    const page = await context.newPage();

    await page.goto('/');
    await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, undefined, {
      timeout: 10_000,
    });
    await page.request.post('/_mocks/reset');

    await page.getByLabel('Postcode').fill('BS1 4DJ');
    await page.getByTestId('postcode-submit').click();
    await expect(page.getByRole('alert')).toBeVisible();
    await page.screenshot({
      path: `${OUT_ROOT}/screenshots/desktop/state-error-retry.png`,
      fullPage: true,
    });

    await context.close();
  });
});
