import { test, expect } from '../fixtures/test-fixtures';

test.describe('postcode step — milestone 1 smoke', () => {
  test('SW1A 1AA returns at least 12 addresses', async ({ postcodePage }) => {
    // Arrange – on page, MSW ready.

    // Act
    await postcodePage.lookup('SW1A 1AA');

    // Assert – results render, count meets §4 fixture requirement (≥12)
    await expect(postcodePage.addressList).toBeVisible();
    const count = await postcodePage.addressOptions().count();
    expect(count).toBeGreaterThanOrEqual(12);

    // Continue is gated on selection
    await expect(postcodePage.continueButton).toBeDisabled();
    await postcodePage.selectAddress('addr_sw1a_01');
    await expect(postcodePage.continueButton).toBeEnabled();
  });

  test('EC1A 1BB shows empty state, not an error', async ({ postcodePage }) => {
    await postcodePage.lookup('EC1A 1BB');

    await expect(postcodePage.empty).toBeVisible();
    await expect(postcodePage.empty).toContainText(/no addresses found/i);
    await expect(postcodePage.addressList).toBeHidden();
  });

  test('BS1 4DJ: error on first call, success after retry', async ({ postcodePage, page }) => {
    await postcodePage.lookup('BS1 4DJ');

    // First call returns 500 — error alert + retry button surface.
    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(postcodePage.retry).toBeVisible();

    // Retry click issues a new request that succeeds.
    const retryRequest = page.waitForResponse(
      (res) => res.url().endsWith('/api/postcode/lookup') && res.status() === 200,
    );
    await postcodePage.retry.click();
    await retryRequest;

    await expect(postcodePage.addressList).toBeVisible();
    await expect(alert).toBeHidden();
  });

  test('invalid postcode surfaces inline validation, no request fired', async ({
    postcodePage,
    page,
  }) => {
    let lookupCalled = false;
    await page.route('**/api/postcode/lookup', (route) => {
      lookupCalled = true;
      return route.fulfill({ status: 200, body: '{}' });
    });

    await postcodePage.lookup('NOT A POSTCODE');

    await expect(page.getByRole('alert')).toContainText(/valid uk postcode/i);
    expect(lookupCalled).toBe(false);
  });
});
