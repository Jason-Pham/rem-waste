import { test, expect } from '@playwright/test';
import { cpSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __evidenceDir = dirname(fileURLToPath(import.meta.url));
const VIDEO_OUT = resolve(__evidenceDir, '../../../evidence/video');

/**
 * Records the flow-B demonstration video required by ASSESSMENT.md §9 (60–120s).
 *
 * We deliberately pace the actions with small waitForTimeout calls (only in the
 * evidence project — not in functional specs) so the recording lands in-range.
 * Total budget: ~75s.
 */
test('Flow B — heavy + plasterboard + retry + confirm (video)', async ({ page }, testInfo) => {
  test.setTimeout(180_000);

  const pause = (ms: number) => page.waitForTimeout(ms);

  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, undefined, {
    timeout: 10_000,
  });
  await page.request.post('/_mocks/reset');
  await pause(3_000);

  // Step 1 — type postcode and search
  await page.getByLabel('Postcode').click();
  await page.getByLabel('Postcode').type('BS1 4DJ', { delay: 180 });
  await pause(2_500);
  await page.getByTestId('postcode-submit').click();

  // Error state
  await expect(page.getByRole('alert')).toBeVisible();
  await pause(6_500);

  // Retry
  await page.getByTestId('postcode-retry').click();
  await expect(page.getByTestId('address-list')).toBeVisible();
  await pause(5_000);

  // Select address
  await page.getByTestId('address-option-addr_bs1_01').click();
  await pause(3_000);
  await page.getByTestId('postcode-continue').click();

  // Step 2 — heavy + plasterboard
  await expect(page.getByRole('heading', { name: /type of waste/i })).toBeVisible();
  await pause(4_500);
  await page.getByTestId('waste-heavy').locator('input').click();
  await pause(3_500);
  await page.getByTestId('waste-plasterboard').locator('input').click();
  await expect(page.getByTestId('plasterboard-options')).toBeVisible();
  await pause(4_500);
  await page.getByTestId('plasterboard-under_10').click();
  await pause(3_500);
  await page.getByTestId('waste-continue').click();

  // Step 3 — show disabled skips, pick 6-yard
  await expect(page.getByRole('heading', { name: /choose your skip/i })).toBeVisible();
  await pause(5_500);
  const disabled = page.locator('[data-testid^="skip-"][data-disabled="true"]').first();
  await disabled.scrollIntoViewIfNeeded();
  await pause(5_000);
  await page.getByTestId('skip-6-yard').click();
  await pause(3_000);
  await page.getByTestId('skip-continue').click();

  // Step 4 — review + price + confirm
  await expect(page.getByRole('heading', { name: /review and confirm/i })).toBeVisible();
  await pause(7_000);
  await page.getByTestId('confirm-booking').click();
  await expect(page.getByTestId('booking-success')).toBeVisible();
  await pause(5_500);

  // --- Post-test: copy the Playwright-recorded video into evidence/video/ ---
  // Get the attached video path. Playwright saves video when the test finishes.
  const videoPath = await page.video()?.path();
  if (videoPath) {
    mkdirSync(VIDEO_OUT, { recursive: true });
    // Clear prior video
    for (const f of readdirSync(VIDEO_OUT).filter((f) => f.endsWith('.webm'))) {
      rmSync(join(VIDEO_OUT, f));
    }
    // Close the page first so Playwright flushes the video to disk.
    await page.close();
    // Wait briefly for the flush to complete.
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline) {
      try {
        const s = statSync(videoPath);
        if (s.size > 0) break;
      } catch {
        /* not yet */
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    try {
      cpSync(videoPath, join(VIDEO_OUT, 'flow-b.webm'));
      testInfo.attach('flow-b', { path: join(VIDEO_OUT, 'flow-b.webm'), contentType: 'video/webm' });
    } catch (e) {
      // If copy fails, the raw file is still available in test-results/.
      console.warn('Video copy failed', e);
    }
  }
});
