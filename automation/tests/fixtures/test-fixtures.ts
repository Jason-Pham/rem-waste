import { test as base, expect, type Page } from '@playwright/test';
import { PostcodePage } from '../../pages/postcode.page';
import { WastePage } from '../../pages/waste.page';
import { SkipPage } from '../../pages/skip.page';
import { ReviewPage } from '../../pages/review.page';

type Fixtures = {
  /** Page already navigated to the app with MSW state reset. */
  freshPage: Page;
  postcodePage: PostcodePage;
  wastePage: WastePage;
  skipPage: SkipPage;
  reviewPage: ReviewPage;
};

export const test = base.extend<Fixtures>({
  freshPage: async ({ page }, use) => {
    await page.goto('/');
    // Wait for the MSW worker to be active before any further requests; without
    // this, the first spec to hit /_mocks/reset can race the SW registration.
    await page.waitForFunction(
      () => navigator.serviceWorker?.controller !== null,
      undefined,
      { timeout: 10_000 },
    );
    await page.request.post('/_mocks/reset');
    await use(page);
  },
  postcodePage: async ({ freshPage }, use) => {
    await use(new PostcodePage(freshPage));
  },
  wastePage: async ({ freshPage }, use) => {
    await use(new WastePage(freshPage));
  },
  skipPage: async ({ freshPage }, use) => {
    await use(new SkipPage(freshPage));
  },
  reviewPage: async ({ freshPage }, use) => {
    await use(new ReviewPage(freshPage));
  },
});

export { expect };
