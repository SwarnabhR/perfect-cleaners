/**
 * Authenticated-customer fixture. Signs in ONCE per worker (via the dev-only
 * token bypass, TEST_CUSTOMER_UID) and reuses the SAME page/tab for every
 * test in that worker — not just the same context.
 *
 * This app uses setPersistence(auth, browserSessionPersistence)
 * (CustomerAuthContext.tsx), i.e. sessionStorage, which is scoped per TAB,
 * not per browser context. Playwright's default `page` fixture opens a new
 * tab per test; a new tab has empty sessionStorage even in an already
 * signed-in context, so overriding only `context` (leaving `page` default)
 * silently drops the session on every test after the first. Each test's own
 * `beforeEach` already does a fresh `page.goto(...)`, which resets DOM state
 * cleanly without needing a new tab.
 */
import { test as base, expect, type Page } from '@playwright/test';
import { signInWithBypassToken } from '../lib/auth-bypass';

export const test = base.extend<{}, { customerPage: Page }>({
  customerPage: [async ({ browser }, use) => {
    const context = await browser.newContext();
    const page    = await context.newPage();
    const uid = process.env.TEST_CUSTOMER_UID;

    if (uid) {
      await page.goto('/signin');
      await signInWithBypassToken(page, uid, { persistence: 'session' });
      await page.waitForURL('**/account', { timeout: 15_000 });
    } else {
      console.warn('\n⚠  TEST_CUSTOMER_UID not set — customer tests will hit /signin unauthenticated.\n');
    }

    await use(page);
    await context.close();
  }, { scope: 'worker' }],

  page: async ({ customerPage }, use) => {
    await use(customerPage);
  },
});

export { expect };
