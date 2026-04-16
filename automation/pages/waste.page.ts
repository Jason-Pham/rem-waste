import type { Locator, Page } from '@playwright/test';

export class WastePage {
  readonly heading: Locator;
  readonly general: Locator;
  readonly heavy: Locator;
  readonly plasterboard: Locator;
  readonly plasterboardOptions: Locator;
  readonly continueButton: Locator;
  readonly backButton: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { name: /type of waste/i });
    this.general = page.getByTestId('waste-general');
    this.heavy = page.getByTestId('waste-heavy');
    this.plasterboard = page.getByTestId('waste-plasterboard');
    this.plasterboardOptions = page.getByTestId('plasterboard-options');
    this.continueButton = page.getByTestId('waste-continue');
    this.backButton = page.getByTestId('waste-back');
  }

  async toggleGeneral(): Promise<void> {
    await this.general.locator('input[type="checkbox"]').click();
  }

  async toggleHeavy(): Promise<void> {
    await this.heavy.locator('input[type="checkbox"]').click();
  }

  async togglePlasterboard(): Promise<void> {
    await this.plasterboard.locator('input[type="checkbox"]').click();
  }

  async selectHandlingOption(value: 'under_10' | '10_to_25' | 'over_25'): Promise<void> {
    await this.page.getByTestId(`plasterboard-${value}`).click();
  }
}
