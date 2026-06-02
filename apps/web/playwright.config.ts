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
    // ── Admin auth setup ───────────────────────────────────────────────────
    {
      name: 'setup',
      testMatch: '**/global-setup.spec.ts',
    },

    // ── Worker auth setup ──────────────────────────────────────────────────
    {
      name: 'worker-setup',
      testMatch: '**/worker-setup.spec.ts',
    },

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
    {
      name: 'admin',
      use:  {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/admin.json',
      },
      dependencies: ['setup'],
      testMatch: '**/admin/**/*.spec.ts',
      testIgnore: '**/admin/login.spec.ts',
    },

    // ── Worker pages — authenticated ───────────────────────────────────────
    {
      name: 'worker',
      use:  {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/worker.json',
      },
      dependencies: ['worker-setup'],
      testMatch: '**/worker/**/*.spec.ts',
      testIgnore: '**/worker/login.spec.ts',
    },

    // ── Customer auth setup ────────────────────────────────────────────────
    {
      name: 'customer-setup',
      testMatch: '**/customer-setup.spec.ts',
    },

    // ── Customer sign-in page — no saved auth state ────────────────────────
    {
      name: 'customer-signin',
      use:  { ...devices['Desktop Chrome'] },
      testMatch: '**/customer/signin.spec.ts',
    },

    // ── Customer pages — authenticated ─────────────────────────────────────
    {
      name: 'customer',
      use:  {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/customer.json',
      },
      dependencies: ['customer-setup'],
      testMatch: '**/customer/**/*.spec.ts',
      testIgnore: '**/customer/signin.spec.ts',
    },
  ],
});
