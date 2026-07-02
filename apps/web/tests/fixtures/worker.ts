/**
 * Authenticated-worker fixture — signs in ONCE per worker (via the dev-only
 * token bypass, TEST_WORKER_UID) and reuses the SAME page/tab for every test
 * in that worker. See tests/fixtures/customer.ts for why page-reuse (not
 * just context-reuse) is the safe default here too.
 */
import { test as base, expect, type Page } from '@playwright/test';
import { signInWithBypassToken } from '../lib/auth-bypass';

export const test = base.extend<{}, { workerPage: Page }>({
  workerPage: [async ({ browser }, use) => {
    const context = await browser.newContext();
    const page    = await context.newPage();
    const uid = process.env.TEST_WORKER_UID;

    if (uid) {
      await page.goto('/worker/login');
      await signInWithBypassToken(page, uid);
      await page.waitForURL('**/worker/dashboard', { timeout: 15_000 });
    } else {
      console.warn('\n⚠  TEST_WORKER_UID not set — worker tests will hit /worker/login unauthenticated.\n');
    }

    await use(page);
    await context.close();
  }, { scope: 'worker' }],

  page: async ({ workerPage }, use) => {
    await use(workerPage);
  },
});

export { expect };
