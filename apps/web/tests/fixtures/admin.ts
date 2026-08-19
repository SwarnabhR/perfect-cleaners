/**
 * Authenticated-admin fixture — signs in ONCE per worker and reuses the SAME
 * page/tab for every test in that worker. See tests/fixtures/customer.ts for
 * why page-reuse (not just context-reuse) is the safe default here too.
 * Admin login takes a USERNAME (resolved server-side to the real Firebase
 * Auth email via /api/admin/resolve-username, see (admin)/login/page.tsx)
 * plus a password, submitted against the app's own bundled Firebase SDK.
 */
import { test as base, expect, type Page } from '@playwright/test';

export const test = base.extend<{}, { adminPage: Page }>({
  adminPage: [async ({ browser }, use) => {
    const context = await browser.newContext();
    const page     = await context.newPage();
    const username = process.env.TEST_ADMIN_USERNAME;
    const password = process.env.TEST_ADMIN_PASSWORD;

    if (username && password) {
      await page.goto('/login');
      await page.fill('#admin-username',        username);
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 20_000 });
    } else {
      console.warn('\n⚠  TEST_ADMIN_USERNAME / TEST_ADMIN_PASSWORD not set — admin tests will hit /login unauthenticated.\n');
    }

    await use(page);
    await context.close();
  }, { scope: 'worker' }],

  page: async ({ adminPage }, use) => {
    await use(adminPage);
  },
});

export { expect };
