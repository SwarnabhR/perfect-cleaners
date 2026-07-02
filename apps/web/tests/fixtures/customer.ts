/**
 * Authenticated-customer fixture. Overrides the built-in `context` fixture
 * with a worker-scoped one that signs in ONCE per worker (via the dev-only
 * token bypass, TEST_CUSTOMER_UID) — the built-in `page` fixture then opens
 * fresh pages against that already-authenticated context per test, so each
 * test still gets full page-level isolation while sharing the (IndexedDB-
 * resident) Firebase session, which Playwright's storageState() cannot
 * serialize on its own. See tests/lib/auth-bypass.ts for why.
 */
import { test as base, expect, type BrowserContext } from '@playwright/test';
import { signInWithBypassToken } from '../lib/auth-bypass';

export const test = base.extend<{}, { customerContext: BrowserContext }>({
  customerContext: [async ({ browser }, use) => {
    const context = await browser.newContext();
    const uid = process.env.TEST_CUSTOMER_UID;

    if (uid) {
      const page = await context.newPage();
      await page.goto('/signin');
      await signInWithBypassToken(page, uid);
      await page.waitForURL('**/account', { timeout: 15_000 });
      await page.close();
    } else {
      console.warn('\n⚠  TEST_CUSTOMER_UID not set — customer tests will hit /signin unauthenticated.\n');
    }

    await use(context);
    await context.close();
  }, { scope: 'worker' }],

  context: async ({ customerContext }, use) => {
    await use(customerContext);
  },
});

export { expect };
