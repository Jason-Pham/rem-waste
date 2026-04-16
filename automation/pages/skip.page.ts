import type { Locator, Page } from '@playwright/test';

export class SkipPage {
  readonly heading: Locator;
  readonly list: Locator;
  readonly retry: Locator;
  readonly continueButton: Locator;
  readonly backButton: Locator;
  readonly heavyWasteNotice: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { name: /choose your skip/i });
    this.list = page.getByTestId('skip-list');
    this.retry = page.getByTestId('skips-retry');
    this.continueButton = page.getByTestId('skip-continue');
    this.backButton = page.getByTestId('skip-back');
    this.heavyWasteNotice = page.getByTestId('heavy-waste-notice');
  }

  card(size: string): Locator {
    return this.page.getByTestId(`skip-${size}`);
  }

  disabledCards(): Locator {
    return this.page.locator('[data-testid^="skip-"][data-disabled="true"]');
  }

  enabledCards(): Locator {
    return this.page.locator('[data-testid^="skip-"][data-disabled="false"]');
  }

  async select(size: string): Promise<void> {
    await this.card(size).click();
  }
}
