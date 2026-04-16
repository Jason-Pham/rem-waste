import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../fixtures/test-fixtures';

/**
 * Accessibility smoke — each step is scanned by axe-core against WCAG 2.0 A/AA.
 * Mirrors the artefacts in evidence/a11y/ but as live assertions so drift fails CI.
 */
const AXE_TAGS = ['wcag2a', 'wcag2aa'];

async function scan(page: import('@playwright/test').Page) {
  return new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
}

test.describe('Accessibility (axe · WCAG 2 A/AA)', () => {
  test('Step 1 — postcode', async ({ page, postcodePage }) => {
    await expect(postcodePage.input).toBeVisible();
    const { violations } = await scan(page);
    expect(violations, formatViolations(violations)).toEqual([]);
  });

  test('Step 2 — waste type', async ({ page, postcodePage, wastePage }) => {
    await postcodePage.lookup('SW1A 1AA');
    await postcodePage.selectAddress('addr_sw1a_01');
    await postcodePage.continueButton.click();
    await expect(wastePage.heading).toBeVisible();

    const { violations } = await scan(page);
    expect(violations, formatViolations(violations)).toEqual([]);
  });

  test('Step 3 — skip selection', async ({ page, postcodePage, wastePage, skipPage }) => {
    await postcodePage.lookup('SW1A 1AA');
    await postcodePage.selectAddress('addr_sw1a_01');
    await postcodePage.continueButton.click();
    await wastePage.toggleGeneral();
    await wastePage.continueButton.click();
    await expect(skipPage.list).toBeVisible();

    const { violations } = await scan(page);
    expect(violations, formatViolations(violations)).toEqual([]);
  });

  test('Step 4 — review & confirm', async ({
    page,
    postcodePage,
    wastePage,
    skipPage,
    reviewPage,
  }) => {
    await postcodePage.lookup('SW1A 1AA');
    await postcodePage.selectAddress('addr_sw1a_01');
    await postcodePage.continueButton.click();
    await wastePage.toggleGeneral();
    await wastePage.continueButton.click();
    await skipPage.select('4-yard');
    await skipPage.continueButton.click();
    await expect(reviewPage.heading).toBeVisible();

    const { violations } = await scan(page);
    expect(violations, formatViolations(violations)).toEqual([]);
  });
});

// Human-friendly message shown when a violation appears, so failures point at
// the offending rule + node rather than a generic "arrays differ".
function formatViolations(
  violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations'],
): string {
  if (violations.length === 0) return 'no violations';
  return violations
    .map((v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.length} node(s)`)
    .join('\n');
}
