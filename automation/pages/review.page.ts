import type { Locator, Page } from '@playwright/test';

export class ReviewPage {
  readonly heading: Locator;
  readonly summary: Locator;
  readonly priceBreakdown: Locator;
  readonly confirmButton: Locator;
  readonly backButton: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { name: /review and confirm/i });
    this.summary = page.getByTestId('review-summary');
    this.priceBreakdown = page.getByTestId('price-breakdown');
    this.confirmButton = page.getByTestId('confirm-booking');
    this.backButton = page.getByTestId('review-back');
  }

  /** Parses price lines into numbers for arithmetic assertions. */
  async readBreakdown(): Promise<{
    skip: number;
    permit: number;
    subtotal: number;
    vat: number;
    total: number;
  }> {
    const parse = async (tid: string): Promise<number> => {
      const raw = await this.page.getByTestId(tid).innerText();
      return Number(raw.replace(/[^0-9.]/g, ''));
    };
    return {
      skip: await parse('price-skip'),
      permit: await parse('price-permit'),
      subtotal: await parse('price-subtotal'),
      vat: await parse('price-vat'),
      total: await parse('price-total'),
    };
  }
}
