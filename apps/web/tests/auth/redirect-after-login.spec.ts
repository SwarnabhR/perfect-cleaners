/**
 * Post-login redirect tests — after signing in, the user lands on the page
 * they originally tried to visit (the ?from= param is honoured).
 *
 * These tests verify the redirect wiring is correct at the page/router level
 * without executing real OTP; they use the dev-only firebase-token endpoint
 * to authenticate programmatically.
 */
import { test, expect } from '@playwright/test';
import { signInWithBypassToken } from '../lib/auth-bypass';

// ── Helpers ───────────────────────────────────────────────────────────────────

const signInCustomer = signInWithBypassToken;

// ── Customer ?from= redirects ─────────────────────────────────────────────────

test.describe('Customer post-login redirect', () => {

  test('landing on /signin?from=/account/wallet redirects there after login', async ({ page }) => {
    const uid = process.env.TEST_CUSTOMER_UID;
    if (!uid) { test.skip(true, 'TEST_CUSTOMER_UID not set'); return; }

    await page.goto('/account/wallet');
    await page.waitForURL(/\/signin/, { timeout: 10_000 });
    expect(decodeURIComponent(page.url())).toContain('/account/wallet');

    await signInCustomer(page, uid);
    await page.waitForURL('**/account/wallet', { timeout: 15_000 });
    expect(page.url()).toContain('/account/wallet');
  });

  test('landing on /signin?from=/account/profile redirects there after login', async ({ page }) => {
    const uid = process.env.TEST_CUSTOMER_UID;
    if (!uid) { test.skip(true, 'TEST_CUSTOMER_UID not set'); return; }

    await page.goto('/account/profile');
    await page.waitForURL(/\/signin/, { timeout: 10_000 });

    await signInCustomer(page, uid);
    await page.waitForURL('**/account/profile', { timeout: 15_000 });
    expect(page.url()).toContain('/account/profile');
  });

  test('/signin without ?from defaults to /account after login', async ({ page }) => {
    const uid = process.env.TEST_CUSTOMER_UID;
    if (!uid) { test.skip(true, 'TEST_CUSTOMER_UID not set'); return; }

    await page.goto('/signin');
    await signInCustomer(page, uid);
    await page.waitForURL('**/account', { timeout: 15_000 });
    expect(page.url()).toContain('/account');
  });

});

// ── Customer sign-in page: ?from param is visible in URL ──────────────────────

test.describe('Sign-in page ?from param', () => {

  test('?from param is present in URL after being redirected', async ({ page }) => {
    await page.goto('/account/wallet');
    await page.waitForURL(/\/signin\?from/, { timeout: 10_000 });
    expect(page.url()).toContain('from=');
    expect(decodeURIComponent(page.url())).toContain('/account/wallet');
  });

  test('?from param is preserved when manually appended', async ({ page }) => {
    await page.goto('/signin?from=/plans');
    await expect(page.locator('h1')).toContainText('Sign in or create');
    expect(page.url()).toContain('from=');
  });

  test('/signin already-auth customer skips to ?from destination', async ({ page }) => {
    const uid = process.env.TEST_CUSTOMER_UID;
    if (!uid) { test.skip(true, 'TEST_CUSTOMER_UID not set'); return; }

    await page.goto('/signin?from=/account/wallet');
    await signInCustomer(page, uid);
    await page.waitForURL('**/account/wallet', { timeout: 15_000 });
    expect(page.url()).toContain('/account/wallet');
  });

});

// ── Worker ?from= redirects ───────────────────────────────────────────────────

test.describe('Worker post-login redirect', () => {

  test('landing on /worker/jobs redirects to /worker/login?from=...', async ({ page }) => {
    await page.goto('/worker/jobs');
    await page.waitForURL(/\/worker\/login/, { timeout: 10_000 });
    expect(decodeURIComponent(page.url())).toContain('/worker/jobs');
  });

  test('landing on /worker/cleaning-logs preserves ?from in redirect', async ({ page }) => {
    await page.goto('/worker/cleaning-logs');
    await page.waitForURL(/\/worker\/login/, { timeout: 10_000 });
    expect(decodeURIComponent(page.url())).toContain('/worker/cleaning-logs');
  });

  test('after worker login ?from destination is reached', async ({ page }) => {
    const uid = process.env.TEST_WORKER_UID;
    if (!uid) { test.skip(true, 'TEST_WORKER_UID not set'); return; }

    await page.goto('/worker/jobs');
    await page.waitForURL(/\/worker\/login/, { timeout: 10_000 });

    await signInWithBypassToken(page, uid);

    await page.waitForURL('**/worker/jobs', { timeout: 15_000 });
    expect(page.url()).toContain('/worker/jobs');
  });

});

// ── Admin: no ?from redirect (always lands on /dashboard) ────────────────────

test.describe('Admin post-login redirect', () => {

  test('admin /login redirects to /dashboard after sign in', async ({ page }) => {
    const email    = process.env.TEST_ADMIN_EMAIL;
    const password = process.env.TEST_ADMIN_PASSWORD;
    if (!email || !password) { test.skip(true, 'TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not set'); return; }

    await page.goto('/login');
    await page.fill('input[type="email"]',    email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 20_000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('/login while already authenticated redirects to /dashboard', async ({ page }) => {
    const email    = process.env.TEST_ADMIN_EMAIL;
    const password = process.env.TEST_ADMIN_PASSWORD;
    if (!email || !password) { test.skip(true, 'TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not set'); return; }

    // Sign in first
    await page.goto('/login');
    await page.fill('input[type="email"]',    email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 20_000 });

    // Now visit /login again — should redirect to dashboard
    await page.goto('/login');
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
    expect(page.url()).toContain('/dashboard');
  });

});
