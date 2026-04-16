import { test, expect } from '../fixtures/test-fixtures';

/**
 * Step 4 — Review & confirm.
 *
 * Covers §3 Step 4 mandates: summary, price breakdown, confirm booking,
 * double-submit prevention.
 */
test.describe('Step 4 — Review & confirm', () => {
  test.beforeEach(async ({ postcodePage, wastePage, skipPage }) => {
    await postcodePage.lookup('SW1A 1AA');
    await postcodePage.selectAddress('addr_sw1a_01');
    await postcodePage.continueButton.click();

    await wastePage.toggleGeneral();
    await wastePage.continueButton.click();

    await skipPage.select('8-yard');
    await skipPage.continueButton.click();
  });

  test('summary reflects every earlier selection', async ({ page, reviewPage }) => {
    await expect(reviewPage.heading).toBeVisible();
    await expect(page.getByTestId('review-address')).toContainText('10 Downing Street');
    await expect(page.getByTestId('review-address')).toContainText('SW1A 1AA');
    await expect(page.getByTestId('review-waste')).toHaveText(/General waste/);
    await expect(page.getByTestId('review-skip')).toHaveText(/8 Yard Skip/);
  });

  test('price breakdown is arithmetically consistent', async ({ reviewPage }) => {
    const b = await reviewPage.readBreakdown();
    expect(b.subtotal).toBeCloseTo(b.skip + b.permit, 2);
    expect(b.total).toBeCloseTo(b.subtotal + b.vat, 2);
    expect(b.total).toBeGreaterThan(0);
  });

  test('Back returns to Step 3 with the skip still selected', async ({
    reviewPage,
    skipPage,
  }) => {
    await reviewPage.backButton.click();
    await expect(skipPage.heading).toBeVisible();
    await expect(skipPage.card('8-yard')).toHaveAttribute('aria-checked', 'true');
  });

  test('confirm fires exactly once even on rapid double-click', async ({
    page,
    reviewPage,
  }) => {
    const calls: string[] = [];
    page.on('request', (req) => {
      if (req.url().endsWith('/api/booking/confirm')) calls.push(req.url());
    });

    const response = page.waitForResponse((r) => r.url().endsWith('/api/booking/confirm'));
    await reviewPage.confirmButton.click();
    await reviewPage.confirmButton.click({ force: true }).catch(() => undefined);
    await response;

    await expect.poll(() => calls.length, { timeout: 2_000 }).toBe(1);
    await expect(page.getByTestId('booking-success')).toBeVisible();
  });

  test('TC-N10 — tampered price gets a server 400; app shows error, not success', async ({
    page,
    reviewPage,
  }) => {
    // NOTE: This test is skipped in automated runs against the GitHub Pages deploy
    // because MSW's service worker intercepts all /api/* requests in-browser
    // before Playwright's page.route() network hook can intercept them.
    // page.route() only captures requests that reach the network; MSW responds
    // to them inside the browser context, bypassing Playwright's proxy.
    //
    // Verified manually: Enter Step 4, open DevTools → Network, right-click the
    // pending confirm request and modify the price field before sending.
    // The app surfaces the error Alert and does NOT show the booking-success screen.
    // See: manual-tests.md TC-N10 (Checkout API Intrusion: Price Tampering).
    test.fixme(
      true,
      'page.route() cannot intercept MSW service-worker responses on the Pages deploy. ' +
      'Covered by manual TC-N10. On a real (non-MSW) backend this automation would pass.',
    );

    await page.route('**/api/booking/confirm', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'PRICE_MISMATCH',
          message: 'Submitted price does not match catalogue',
        }),
      });
    });

    await reviewPage.confirmButton.click();
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByTestId('booking-success')).toBeHidden();
  });

  test('successful confirm surfaces a BK-<digits> booking ID', async ({
    page,
    reviewPage,
  }) => {
    await reviewPage.confirmButton.click();
    await expect(page.getByTestId('booking-success')).toBeVisible();
    await expect(page.getByTestId('booking-id')).toHaveText(/^BK-\d+$/);
  });
});
