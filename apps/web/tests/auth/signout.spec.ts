/**
 * Sign-out flow tests — every portal's sign-out button clears auth state
 * and redirects to the correct landing page.
 *
 * Deliberately does NOT use the shared worker-scoped fixtures from
 * tests/fixtures/*.ts — those reuse one signed-in context across every test
 * in a worker for speed, but a sign-out test destroys that shared session,
 * which would silently break every other test that reuses it. Each test
 * here authenticates fresh in its own isolated (default, test-scoped)
 * context instead.
 */
import { test, expect } from '@playwright/test';
import { signInWithBypassToken } from '../lib/auth-bypass';

// ── Customer sign-out ─────────────────────────────────────────────────────────

test.describe('Customer sign-out', () => {
  test.beforeEach(async ({ page }) => {
    const uid = process.env.TEST_CUSTOMER_UID;
    test.skip(!uid, 'TEST_CUSTOMER_UID not set');
    await page.goto('/signin');
    await signInWithBypassToken(page, uid!);
    await page.waitForURL('**/account', { timeout: 15_000 });
  });

  test('sign-out from /account redirects to homepage', async ({ page }) => {
    await page.goto('/account');
    await expect(page.locator('button:has-text("Sign out")')).toBeVisible({ timeout: 25_000 });
    await page.click('button:has-text("Sign out")');
    await page.waitForURL('**/', { timeout: 20_000 });
    expect(page.url()).toMatch(/\/$/);
  });

  test('after sign-out /account redirects to /signin', async ({ page }) => {
    await page.goto('/account');
    await expect(page.locator('button:has-text("Sign out")')).toBeVisible({ timeout: 25_000 });
    await page.click('button:has-text("Sign out")');
    await page.waitForURL('**/', { timeout: 20_000 });
    await page.goto('/account');
    await page.waitForURL(/\/signin/, { timeout: 15_000 });
    await expect(page.locator('h1')).toContainText('Sign in or create');
  });

  test('sign-out from /account/profile redirects to homepage', async ({ page }) => {
    await page.goto('/account/profile');
    // The Profile tab itself has no Sign out control — it lives on the
    // Bookings tab (/account). Navigate there via the in-page tab link,
    // matching how a real user would reach sign-out from /account/profile.
    await page.click('a:has-text("Bookings")');
    await page.waitForURL('**/account', { timeout: 15_000 });
    await expect(page.locator('button:has-text("Sign out")')).toBeVisible({ timeout: 25_000 });
    await page.click('button:has-text("Sign out")');
    await page.waitForURL('**/', { timeout: 20_000 });
    expect(page.url()).toMatch(/\/$/);
  });

  test('nav shows "Sign in" after customer signs out', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/account');
    await expect(page.locator('button:has-text("Sign out")')).toBeVisible({ timeout: 25_000 });
    await page.click('button:has-text("Sign out")');
    await page.waitForURL('**/', { timeout: 20_000 });
    await expect(page.locator('nav a:has-text("Sign in")')).toBeVisible({ timeout: 10_000 });
  });
});

// ── Worker sign-out ───────────────────────────────────────────────────────────

test.describe('Worker sign-out', () => {
  test.beforeEach(async ({ page }) => {
    const uid = process.env.TEST_WORKER_UID;
    test.skip(!uid, 'TEST_WORKER_UID not set');
    await page.goto('/worker/login');
    await signInWithBypassToken(page, uid!);
    await page.waitForURL('**/worker/dashboard', { timeout: 15_000 });
  });

  test('sign-out from /worker/profile redirects to /worker/login', async ({ page }) => {
    await page.goto('/worker/profile');
    await page.waitForLoadState('load');
    await expect(page.locator('button:has-text("Sign out")')).toBeVisible({ timeout: 10_000 });
    await page.click('button:has-text("Sign out")');
    await page.waitForURL(/\/worker\/login/, { timeout: 10_000 });
    await expect(page.locator('h1')).toContainText('Worker sign in.');
  });

  test('after worker sign-out protected pages redirect to /worker/login', async ({ page }) => {
    await page.goto('/worker/profile');
    await page.waitForLoadState('load');
    await page.click('button:has-text("Sign out")');
    await page.waitForURL(/\/worker\/login/, { timeout: 10_000 });
    await page.goto('/worker/dashboard');
    await page.waitForURL(/\/worker\/login/, { timeout: 10_000 });
    await expect(page.locator('h1')).toContainText('Worker sign in.');
  });
});

// ── Admin sign-out ────────────────────────────────────────────────────────────

test.describe('Admin sign-out', () => {
  test.beforeEach(async ({ page }) => {
    const email    = process.env.TEST_ADMIN_EMAIL;
    const password = process.env.TEST_ADMIN_PASSWORD;
    test.skip(!email || !password, 'TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not set');
    await page.goto('/login');
    await page.fill('input[type="email"]',    email!);
    await page.fill('input[type="password"]', password!);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 20_000 });
  });

  test('sign-out from admin sidebar redirects to /login', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    // The admin layout renders TWO copies of the sidebar (desktop-static +
    // mobile off-canvas drawer), each with its own button[aria-label="Sign out"].
    // At this desktop viewport only .sidebar-static is actually shown, so scope to it.
    const signOutBtn = page.locator('.sidebar-static button[aria-label="Sign out"]');
    await expect(signOutBtn).toBeVisible({ timeout: 25_000 });
    await signOutBtn.click();
    await page.waitForURL(/\/login/, { timeout: 20_000 });
    await expect(page.locator('h1')).toContainText('Sign in');
  });

  test('sign-out via profile dropdown redirects to /login', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    await expect(page.locator('header')).toBeVisible({ timeout: 25_000 });
    // Open profile dropdown — last icon button in the header
    const headerBtns = page.locator('header button');
    const count = await headerBtns.count();
    await headerBtns.nth(count - 1).click();
    const dropdownSignOut = page.locator('button:has-text("Sign out")');
    await expect(dropdownSignOut).toBeVisible({ timeout: 8_000 });
    await dropdownSignOut.click();
    await page.waitForURL(/\/login/, { timeout: 20_000 });
    await expect(page.locator('h1')).toContainText('Sign in');
  });

  test('after admin sign-out /dashboard redirects to /login', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    const signOutBtn = page.locator('.sidebar-static button[aria-label="Sign out"]');
    await expect(signOutBtn).toBeVisible({ timeout: 25_000 });
    await signOutBtn.click();
    await page.waitForURL(/\/login/, { timeout: 20_000 });
    await page.goto('/dashboard');
    await page.waitForURL(/\/login/, { timeout: 15_000 });
    await expect(page.locator('h1')).toContainText('Sign in');
  });
});
