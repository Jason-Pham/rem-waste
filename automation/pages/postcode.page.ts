import type { Locator, Page } from '@playwright/test';

/**
 * Page Object for Step 1 — postcode lookup.
 * Actions only; assertions live in specs.
 */
export class PostcodePage {
  readonly input: Locator;
  readonly submit: Locator;
  readonly loading: Locator;
  readonly retry: Locator;
  readonly empty: Locator;
  readonly addressList: Locator;
  readonly continueButton: Locator;

  constructor(readonly page: Page) {
    this.input = page.getByLabel('Postcode');
    this.submit = page.getByTestId('postcode-submit');
    this.loading = page.getByTestId('postcode-loading');
    this.retry = page.getByTestId('postcode-retry');
    this.empty = page.getByTestId('postcode-empty');
    this.addressList = page.getByTestId('address-list');
    this.continueButton = page.getByTestId('postcode-continue');
  }

  async lookup(postcode: string): Promise<void> {
    await this.input.fill(postcode);
    await this.submit.click();
  }

  async selectAddress(id: string): Promise<void> {
    await this.page.getByTestId(`address-option-${id}`).click();
  }

  /** All rendered address options, for counting/assertions. */
  addressOptions(): Locator {
    return this.page.locator('[data-testid^="address-option-"]');
  }
}
