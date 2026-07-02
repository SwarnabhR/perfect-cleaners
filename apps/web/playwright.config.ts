import { defineConfig, devices } from '@playwright/test';

/**
 * Set TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD in .env.local (or shell env)
 * before running authenticated tests.
 *
 * Run:  npx playwright test
 * UI:   npx playwright test --ui
 * Report: npx playwright show-report
 */
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect:  { timeout: 10_000 },
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL:    'http://localhost:3000',
    trace:      'on-first-retry',
    screenshot: 'only-on-failure',
  },

  webServer: {
    command:            'npm run dev',
    url:                'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout:            120_000,
  },

  projects: [
    // ── Admin login page — no saved auth state ─────────────────────────────
    {
      name: 'admin-login',
      use:  { ...devices['Desktop Chrome'] },
      testMatch: '**/admin/login.spec.ts',
    },

    // ── Worker login page — no saved auth state ────────────────────────────
    {
      name: 'worker-login',
      use:  { ...devices['Desktop Chrome'] },
      testMatch: '**/worker/login.spec.ts',
    },

    // ── Admin pages — authenticated ────────────────────────────────────────
    // timeout: 60s — Firestore pages take 10-12s to load, leaving room for interactions.
    // Auth comes from tests/fixtures/admin.ts (a worker-scoped signed-in
    // context, signed in once per worker) — spec files import `test` from
    // there instead of '@playwright/test'. Not storageState: Firebase Auth's
    // IndexedDB-based session isn't serialized by this Playwright version.
    {
      name: 'admin',
      timeout: 60_000,
      use:  { ...devices['Desktop Chrome'] },
      testMatch: '**/admin/**/*.spec.ts',
      testIgnore: '**/admin/login.spec.ts',
    },

    // ── Worker pages — authenticated (see tests/fixtures/worker.ts) ────────
    {
      name: 'worker',
      timeout: 60_000,
      use:  { ...devices['Desktop Chrome'] },
      testMatch: '**/worker/**/*.spec.ts',
      testIgnore: '**/worker/login.spec.ts',
    },

    // ── Customer sign-in page — no saved auth state ────────────────────────
    {
      name: 'customer-signin',
      use:  { ...devices['Desktop Chrome'] },
      testMatch: '**/customer/signin.spec.ts',
    },

    // ── Customer pages — authenticated (see tests/fixtures/customer.ts) ────
    {
      name: 'customer',
      timeout: 60_000,
      use:  { ...devices['Desktop Chrome'] },
      testMatch: '**/customer/**/*.spec.ts',
      testIgnore: '**/customer/signin.spec.ts',
    },

    // ── Auth flows — authenticated contexts created via fixtures/inline ────
    {
      name: 'auth',
      timeout: 60_000,
      use:  { ...devices['Desktop Chrome'] },
      testMatch: '**/auth/**/*.spec.ts',
    },
  ],
});
