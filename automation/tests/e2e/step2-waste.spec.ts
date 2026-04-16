import { test, expect } from '../fixtures/test-fixtures';

/**
 * Step 2 — Waste type selection.
 *
 * Covers the branching logic mandated by §3: General / Heavy / Plasterboard
 * with its three handling options, plus the mutual-exclusivity rules.
 */
test.describe('Step 2 — Waste type', () => {
  // Arrive at Step 2 with an address selected — reused by every test below.
  test.beforeEach(async ({ postcodePage }) => {
    await postcodePage.lookup('SW1A 1AA');
    await postcodePage.selectAddress('addr_sw1a_01');
    await postcodePage.continueButton.click();
  });

  test('renders three waste-type options and a Continue button', async ({
    page,
    wastePage,
  }) => {
    await expect(wastePage.heading).toBeVisible();
    await expect(page.getByTestId('waste-general')).toBeVisible();
    await expect(page.getByTestId('waste-heavy')).toBeVisible();
    await expect(page.getByTestId('waste-plasterboard')).toBeVisible();
    await expect(wastePage.continueButton).toBeVisible();
  });

  test('Continue without any selection surfaces an inline validation error', async ({
    page,
    wastePage,
  }) => {
    await wastePage.continueButton.click();
    await expect(page.getByTestId('waste-validation')).toBeVisible();
    await expect(page.getByTestId('waste-validation')).toContainText(/select at least one/i);
  });

  test('plasterboard reveals three handling options', async ({ page, wastePage }) => {
    await wastePage.togglePlasterboard();
    await expect(wastePage.plasterboardOptions).toBeVisible();
    await expect(page.getByTestId('plasterboard-under_10')).toBeVisible();
    await expect(page.getByTestId('plasterboard-10_to_25')).toBeVisible();
    await expect(page.getByTestId('plasterboard-over_25')).toBeVisible();
  });

  test('plasterboard without a handling option blocks Continue', async ({
    page,
    wastePage,
  }) => {
    await wastePage.togglePlasterboard();
    await wastePage.continueButton.click();
    await expect(page.getByTestId('waste-validation')).toContainText(/how much plasterboard/i);
  });

  test('BUG-001 regression — validation clears immediately on handling-option selection (no re-submit needed)', async ({
    page,
    wastePage,
  }) => {
    // Trigger the validation message
    await wastePage.togglePlasterboard();
    await wastePage.continueButton.click();
    await expect(page.getByTestId('waste-validation')).toBeVisible();

    // Selecting a handling option must clear the message without another Continue click
    await page.getByTestId('plasterboard-under_10').click();
    await expect(page.getByTestId('waste-validation')).toBeHidden();
  });

  test('toggling general clears heavy + plasterboard (mutually exclusive)', async ({
    page,
    wastePage,
  }) => {
    await wastePage.toggleHeavy();
    await wastePage.togglePlasterboard();
    await expect(wastePage.plasterboardOptions).toBeVisible();

    await wastePage.toggleGeneral();
    // Heavy and plasterboard should now be off; the options panel collapses.
    await expect(page.getByTestId('waste-heavy').locator('input')).not.toBeChecked();
    await expect(page.getByTestId('waste-plasterboard').locator('input')).not.toBeChecked();
    await expect(wastePage.plasterboardOptions).toBeHidden();
  });

  test('heavy + plasterboard + option sends the correct §5 payload', async ({
    page,
    wastePage,
  }) => {
    await wastePage.toggleHeavy();
    await wastePage.togglePlasterboard();
    await wastePage.selectHandlingOption('10_to_25');

    const [req] = await Promise.all([
      page.waitForRequest(
        (r) => r.url().endsWith('/api/waste-types') && r.method() === 'POST',
      ),
      wastePage.continueButton.click(),
    ]);
    expect(req.postDataJSON()).toEqual({
      heavyWaste: true,
      plasterboard: true,
      plasterboardOption: '10_to_25',
    });
  });

  test('back button returns to Step 1 with the postcode preserved', async ({
    page,
    wastePage,
    postcodePage,
  }) => {
    await wastePage.backButton.click();
    await expect(
      page.getByRole('heading', { name: /where do you need/i }),
    ).toBeVisible();
    await expect(postcodePage.input).toHaveValue(/SW1A/i);
  });
});
