/**
 * Authenticated-admin fixture — signs in ONCE per worker and reuses the SAME
 * page/tab for every test in that worker. See tests/fixtures/customer.ts for
 * why page-reuse (not just context-reuse) is the safe default here too.
 * Admin login is a plain email/password form submitted directly against the
 * app's own bundled Firebase SDK (no CDN import needed, unlike the
 * customer/worker token-bypass path), so this just fills the form.
 */
import { test as base, expect, type Page } from '@playwright/test';

export const test = base.extend<{}, { adminPage: Page }>({
  adminPage: [async ({ browser }, use) => {
    const context = await browser.newContext();
    const page    = await context.newPage();
    const email    = process.env.TEST_ADMIN_EMAIL;
    const password = process.env.TEST_ADMIN_PASSWORD;

    if (email && password) {
      await page.goto('/login');
      await page.fill('input[type="email"]',    email);
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 20_000 });
    } else {
      console.warn('\n⚠  TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not set — admin tests will hit /login unauthenticated.\n');
    }

    await use(page);
    await context.close();
  }, { scope: 'worker' }],

  page: async ({ adminPage }, use) => {
    await use(adminPage);
  },
});

export { expect };
