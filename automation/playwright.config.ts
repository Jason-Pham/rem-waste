import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';
// Only boot the local Vite dev server when BASE_URL points at localhost.
// In CI runs against the GitHub Pages deploy, we skip webServer entirely.
const IS_LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(BASE_URL);

// Comma-separated PROJECTS env var narrows the browser matrix on demand —
// used by the GitHub Actions matrix so each runner only spins up one browser.
const PROJECT_FILTER = process.env.PROJECTS?.split(',').map((s) => s.trim()).filter(Boolean);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI
    ? [
        ['list'],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
        ['github'],
        ['junit', { outputFile: 'results.xml' }],
      ]
    : [['html', { open: 'never' }], ['list']],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: /tests\/evidence\/.*/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testIgnore: /tests\/evidence\/.*/,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testIgnore: /tests\/evidence\/.*/,
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      testIgnore: /tests\/evidence\/.*/,
      use: { ...devices['Pixel 5'] },
    },
    {
      // Evidence project — runs the capture specs with video always on.
      name: 'evidence',
      testMatch: /tests\/evidence\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        video: 'on' as const,
      },
      timeout: 90_000,
    },
  ].filter((p) => !PROJECT_FILTER || PROJECT_FILTER.includes(p.name)),
  webServer: IS_LOCAL
    ? {
        command: 'npm run dev',
        cwd: '../ui',
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
        stdout: 'ignore',
        stderr: 'pipe',
      }
    : undefined,
});
