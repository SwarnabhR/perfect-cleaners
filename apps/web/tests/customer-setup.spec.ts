/**
 * Authenticates as a customer once before the 'customer' project runs.
 * Uses /api/test/firebase-token to bypass MSG91 OTP.
 *
 * Required env var: TEST_CUSTOMER_UID — Firestore UID of a real customer document
 * that already has name + email set (so the profile step is skipped).
 */
import { test, expect } from '@playwright/test';
import path from 'path';

const AUTH_FILE = path.join(__dirname, '.auth/customer.json');

test('authenticate as customer', async ({ page }) => {
  const uid = process.env.TEST_CUSTOMER_UID;

  if (!uid) {
    console.warn(
      '\n⚠  TEST_CUSTOMER_UID not set — skipping customer auth setup.\n' +
      '   Authenticated customer tests will be skipped.\n',
    );
    await page.context().storageState({ path: AUTH_FILE });
    return;
  }

  // 1. Get a Firebase custom token from the dev-only endpoint
  const res  = await page.request.get(`/api/test/firebase-token?uid=${uid}`);
  const body = await res.json();
  if (!res.ok()) throw new Error(`firebase-token failed: ${body.error}`);

  // 2. Sign in with the custom token inside the browser context
  await page.goto('/signin');
  await page.evaluate(async (token: string) => {
    const { getApps }              = await import('https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js' as any);
    const { getAuth, signInWithCustomToken } = await import('https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js' as any);
    const auth = getAuth(getApps()[0]);
    await signInWithCustomToken(auth, token);
  }, body.token);

  // 3. Auth listener triggers → redirects away from /signin
  await page.waitForURL('**/account', { timeout: 15_000 });
  await expect(page.locator('h1')).toBeVisible();

  await page.context().storageState({ path: AUTH_FILE });
});
