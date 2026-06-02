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
    // ── 1. Auth setup — runs first, saves storageState ─────────────────────
    {
      name: 'setup',
      testMatch: '**/global-setup.spec.ts',
    },

    // ── 2. Login page — no saved auth state (tests the login UI itself) ────
    {
      name: 'admin-login',
      use:  { ...devices['Desktop Chrome'] },
      testMatch: '**/admin/login.spec.ts',
    },

    // ── 3. All other admin pages — authenticated via saved storageState ─────
    {
      name: 'admin',
      use:  {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/admin.json',
      },
      dependencies: ['setup'],
      testIgnore: ['**/admin/login.spec.ts', '**/global-setup.spec.ts'],
    },
  ],
});
