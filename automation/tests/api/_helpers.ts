import type { Page } from '@playwright/test';

/**
 * Contract tests run in-browser to hit the MSW service worker. Playwright's
 * top-level `request` fixture makes Node-side HTTP calls that bypass the SW,
 * so we proxy through `page.evaluate(fetch)` instead.
 */
export async function apiCall(
  page: Page,
  url: string,
  init?: RequestInit,
): Promise<{ status: number; body: unknown }> {
  return page.evaluate(
    async ({ url, init }) => {
      const res = await fetch(url, init as RequestInit);
      const text = await res.text();
      let body: unknown = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }
      return { status: res.status, body };
    },
    { url, init },
  );
}
