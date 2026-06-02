/**
 * Authenticates as a worker once before the 'worker' project runs.
 * Uses the dev-only /api/test/worker-token endpoint to bypass OTP.
 *
 * Required env vars (add to .env.local):
 *   TEST_WORKER_UID  — Firestore UID of a real worker document
 */
import { test, expect } from '@playwright/test';
import path from 'path';

const AUTH_FILE = path.join(__dirname, '.auth/worker.json');

test('authenticate as worker', async ({ page }) => {
  const uid = process.env.TEST_WORKER_UID;

  if (!uid) {
    console.warn(
      '\n⚠  TEST_WORKER_UID not set — skipping worker auth setup.\n' +
      '   Authenticated worker tests will be skipped.\n',
    );
    await page.context().storageState({ path: AUTH_FILE });
    return;
  }

  // 1. Get a custom token from the dev-only endpoint
  const res  = await page.request.get(`/api/test/firebase-token?uid=${uid}`);
  const body = await res.json();

  if (!res.ok()) {
    throw new Error(`worker-token endpoint failed: ${body.error}`);
  }

  // 2. Sign in with the custom token inside the browser
  await page.goto('/worker/login');
  await page.evaluate(async (token: string) => {
    const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js' as any);
    const { getAuth, signInWithCustomToken } = await import('https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js' as any);
    // Firebase is already initialized by the app — reuse existing app
    const app  = getApps()[0];
    const auth = getAuth(app);
    await signInWithCustomToken(auth, token);
  }, body.token);

  // 3. Wait for redirect away from login (auth listener fires → redirect)
  await page.waitForURL('**/worker/dashboard', { timeout: 15_000 });
  await expect(page.locator('header')).toBeVisible();

  await page.context().storageState({ path: AUTH_FILE });
});
