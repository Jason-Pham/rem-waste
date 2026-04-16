import { test, expect } from '@playwright/test';
import { cpSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __evidenceDir = dirname(fileURLToPath(import.meta.url));
const VIDEO_OUT = resolve(__evidenceDir, '../../../evidence/video');

/**
 * Records the Flow A demonstration video required for a complete evidence bundle.
 * Flow A: SW1A 1AA → general waste → 4-yard skip → confirm booking.
 *
 * Paced with deliberate pauses (evidence project only) so the recording is
 * visually clear and lands in the 60–90s range.
 */
test('Flow A — SW1A 1AA → general waste → 4-yard → confirm (video)', async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);

  const pause = (ms: number) => page.waitForTimeout(ms);

  await page.goto('./');
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, undefined, {
    timeout: 10_000,
  });
  await page.request.post('/_mocks/reset');
  await pause(3_000);

  // Step 1 — postcode lookup
  await page.getByLabel('Postcode').click();
  await page.getByLabel('Postcode').type('SW1A 1AA', { delay: 160 });
  await pause(2_000);
  await page.getByTestId('postcode-submit').click();

  // Wait for results
  await expect(page.getByTestId('address-list')).toBeVisible();
  await pause(4_500);

  // Select first address
  await page.getByTestId('address-option-addr_sw1a_01').click();
  await pause(3_000);
  await page.getByTestId('postcode-continue').click();

  // Step 2 — general waste
  await expect(page.getByRole('heading', { name: /type of waste/i })).toBeVisible();
  await pause(4_000);
  await page.getByTestId('waste-general').locator('input').click();
  await pause(3_000);
  await page.getByTestId('waste-continue').click();

  // Step 3 — skip selection (all enabled for general waste)
  await expect(page.getByRole('heading', { name: /choose your skip/i })).toBeVisible();
  await pause(5_000);
  await page.getByTestId('skip-4-yard').click();
  await pause(3_000);
  await page.getByTestId('skip-continue').click();

  // Step 4 — review + confirm
  await expect(page.getByRole('heading', { name: /review and confirm/i })).toBeVisible();
  await pause(6_000);
  await page.getByTestId('confirm-booking').click();
  await expect(page.getByTestId('booking-success')).toBeVisible();
  await pause(5_000);

  // --- Post-test: copy recorded video to evidence/video/flow-a.webm ---
  const videoPath = await page.video()?.path();
  if (videoPath) {
    mkdirSync(VIDEO_OUT, { recursive: true });
    // Remove any stale flow-a files
    for (const f of readdirSync(VIDEO_OUT).filter(
      (f) => f.startsWith('flow-a') && f.endsWith('.webm'),
    )) {
      rmSync(join(VIDEO_OUT, f));
    }
    await page.close();
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline) {
      try {
        const s = statSync(videoPath);
        if (s.size > 0) break;
      } catch {
        /* not yet flushed */
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    try {
      cpSync(videoPath, join(VIDEO_OUT, 'flow-a.webm'));
      testInfo.attach('flow-a', {
        path: join(VIDEO_OUT, 'flow-a.webm'),
        contentType: 'video/webm',
      });
    } catch (e) {
      console.warn('Video copy failed', e);
    }
  }
});
