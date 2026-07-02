/**
 * Authenticated-worker fixture — same worker-scoped-context pattern as
 * tests/fixtures/customer.ts (see that file for why). Uses TEST_WORKER_UID.
 */
import { test as base, expect, type BrowserContext } from '@playwright/test';
import { signInWithBypassToken } from '../lib/auth-bypass';

export const test = base.extend<{}, { workerContext: BrowserContext }>({
  workerContext: [async ({ browser }, use) => {
    const context = await browser.newContext();
    const uid = process.env.TEST_WORKER_UID;

    if (uid) {
      const page = await context.newPage();
      await page.goto('/worker/login');
      await signInWithBypassToken(page, uid);
      await page.waitForURL('**/worker/dashboard', { timeout: 15_000 });
      await page.close();
    } else {
      console.warn('\n⚠  TEST_WORKER_UID not set — worker tests will hit /worker/login unauthenticated.\n');
    }

    await use(context);
    await context.close();
  }, { scope: 'worker' }],

  context: async ({ workerContext }, use) => {
    await use(workerContext);
  },
});

export { expect };
