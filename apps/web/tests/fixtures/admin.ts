/**
 * Authenticated-admin fixture — same worker-scoped-context pattern as
 * tests/fixtures/customer.ts (see that file for why storageState() alone
 * doesn't work here). Admin login is a plain email/password form submitted
 * directly against the app's own bundled Firebase SDK (no CDN import needed,
 * unlike the customer/worker token-bypass path), so this just fills the form.
 */
import { test as base, expect, type BrowserContext } from '@playwright/test';

export const test = base.extend<{}, { adminContext: BrowserContext }>({
  adminContext: [async ({ browser }, use) => {
    const context = await browser.newContext();
    const email    = process.env.TEST_ADMIN_EMAIL;
    const password = process.env.TEST_ADMIN_PASSWORD;

    if (email && password) {
      const page = await context.newPage();
      await page.goto('/login');
      await page.fill('input[type="email"]',    email);
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 20_000 });
      await page.close();
    } else {
      console.warn('\n⚠  TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not set — admin tests will hit /login unauthenticated.\n');
    }

    await use(context);
    await context.close();
  }, { scope: 'worker' }],

  context: async ({ adminContext }, use) => {
    await use(adminContext);
  },
});

export { expect };
