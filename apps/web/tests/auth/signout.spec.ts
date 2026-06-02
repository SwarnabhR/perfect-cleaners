/**
 * Sign-out flow tests — every portal's sign-out button clears auth state
 * and redirects to the correct landing page.
 *
 * Each describe block loads the relevant storageState inline so a single
 * sign-out test doesn't bleed state into the next test.
 */
import { test, expect } from '@playwright/test';
import path from 'path';

const ADMIN_AUTH    = path.join(__dirname, '../.auth/admin.json');
const WORKER_AUTH   = path.join(__dirname, '../.auth/worker.json');
const CUSTOMER_AUTH = path.join(__dirname, '../.auth/customer.json');

// ── Customer sign-out ─────────────────────────────────────────────────────────

test.describe('Customer sign-out', () => {
  test.use({ storageState: CUSTOMER_AUTH });

  test('sign-out from /account redirects to homepage', async ({ page }) => {
    await page.goto('/account');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Sign out")');
    await page.waitForURL('**/', { timeout: 10_000 });
    expect(page.url()).toMatch(/\/$/);
  });

  test('after sign-out /account redirects to /signin', async ({ page }) => {
    await page.goto('/account');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Sign out")');
    await page.waitForURL('**/', { timeout: 10_000 });
    // Now navigate back to a protected page
    await page.goto('/account');
    await page.waitForURL(/\/signin/, { timeout: 10_000 });
    await expect(page.locator('h1')).toContainText('Sign in or create');
  });

  test('sign-out from /account/profile redirects to homepage', async ({ page }) => {
    await page.goto('/account/profile');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Sign out")');
    await page.waitForURL('**/', { timeout: 10_000 });
    expect(page.url()).toMatch(/\/$/);
  });

  test('nav shows "Sign in" after customer signs out', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/account');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Sign out")');
    await page.waitForURL('**/', { timeout: 10_000 });
    await page.waitForTimeout(1_000);
    await expect(page.locator('nav a:has-text("Sign in")')).toBeVisible({ timeout: 8_000 });
  });
});

// ── Worker sign-out ───────────────────────────────────────────────────────────

test.describe('Worker sign-out', () => {
  test.use({ storageState: WORKER_AUTH });

  test('sign-out from /worker/profile redirects to /worker/login', async ({ page }) => {
    await page.goto('/worker/profile');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('button:has-text("Sign out")')).toBeVisible({ timeout: 10_000 });
    await page.click('button:has-text("Sign out")');
    await page.waitForURL(/\/worker\/login/, { timeout: 10_000 });
    await expect(page.locator('h1')).toContainText('Worker sign in.');
  });

  test('after worker sign-out protected pages redirect to /worker/login', async ({ page }) => {
    await page.goto('/worker/profile');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Sign out")');
    await page.waitForURL(/\/worker\/login/, { timeout: 10_000 });
    await page.goto('/worker/dashboard');
    await page.waitForURL(/\/worker\/login/, { timeout: 10_000 });
    await expect(page.locator('h1')).toContainText('Worker sign in.');
  });
});

// ── Admin sign-out ────────────────────────────────────────────────────────────

test.describe('Admin sign-out', () => {
  test.use({ storageState: ADMIN_AUTH });

  test('sign-out from admin sidebar redirects to /login', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    // Sign out via sidebar button (log-out icon)
    await page.click('button[aria-label="Sign out"]');
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expect(page.locator('h1')).toContainText('Sign in');
  });

  test('sign-out via profile dropdown redirects to /login', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    // Open profile dropdown in top bar
    await page.click('button[aria-label="user"], button:has([data-lucide="user"])').catch(async () => {
      // Fallback: click the user avatar circle in the top bar
      const userBtns = page.locator('header button');
      const count = await userBtns.count();
      await userBtns.nth(count - 1).click();
    });
    await expect(page.locator('button:has-text("Sign out")')).toBeVisible({ timeout: 5_000 });
    await page.click('button:has-text("Sign out")');
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expect(page.locator('h1')).toContainText('Sign in');
  });

  test('after admin sign-out /dashboard redirects to /login', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.click('button[aria-label="Sign out"]');
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await page.goto('/dashboard');
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expect(page.locator('h1')).toContainText('Sign in');
  });
});
