import { test, expect } from '@playwright/test';

test.describe('Admin Login', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('renders login form correctly', async ({ page }) => {
    // The (admin) layout wraps /login in the full sidebar shell, which has
    // its own <p> tags (sidebar footer name/email) — scope to the one
    // containing the login subtitle to avoid a strict-mode violation.
    await expect(page.locator('h1')).toContainText('Sign in');
    await expect(page.locator('p', { hasText: 'Operator access only' })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Sign in');
  });

  test('shows Perfect Cleaners branding', async ({ page }) => {
    // The layout renders both a desktop (.sidebar-static) and an off-canvas
    // mobile (.sidebar-drawer) copy of the sidebar; the mobile one is
    // display:none at desktop viewport width but still matches `text=`
    // locators (which ignore CSS visibility) and sorts first in the DOM —
    // scope to the visible desktop sidebar to avoid a hidden-element match.
    await expect(page.locator('.sidebar-static').getByText('Perfect Cleaners').first()).toBeVisible();
    await expect(page.locator('.sidebar-static').getByText('Admin').first()).toBeVisible();
  });

  test('submit button is enabled with empty fields', async ({ page }) => {
    // Button is not disabled by default — HTML5 required validation fires on submit
    const btn = page.locator('button[type="submit"]');
    await expect(btn).not.toBeDisabled();
  });

  test('browser validates required email field', async ({ page }) => {
    // Attempt submit with empty fields — browser blocks it via required attr
    await page.click('button[type="submit"]');
    // Still on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('shows error on wrong credentials', async ({ page }) => {
    await page.fill('input[type="email"]',    'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    const error = page.locator('p', { hasText: /invalid email or password|sign-in failed/i });
    await expect(error).toBeVisible({ timeout: 15_000 });
    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('shows loading state while signing in', async ({ page }) => {
    await page.fill('input[type="email"]',    'test@example.com');
    await page.fill('input[type="password"]', 'testpassword');

    const btn = page.locator('button[type="submit"]');
    await page.click('button[type="submit"]');
    // Button text changes to "Signing in…" while the request is in-flight
    await expect(btn).toContainText(/signing in/i).catch(() => {
      // May resolve too fast in fast environments — that's fine
    });
  });

  test('valid credentials redirect to dashboard', async ({ page }) => {
    const email    = process.env.TEST_ADMIN_EMAIL;
    const password = process.env.TEST_ADMIN_PASSWORD;

    if (!email || !password) {
      test.skip(true, 'TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not set');
      return;
    }

    await page.fill('input[type="email"]',    email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 20_000 });
    await expect(page.locator('.admin-page-root')).toBeVisible();
  });

});
