/**
 * Runs once before the 'admin' project.
 * Logs in with TEST_ADMIN_EMAIL + TEST_ADMIN_PASSWORD and saves the
 * browser storage state so every subsequent admin test starts authenticated.
 *
 * If credentials are not set the test is skipped and authenticated tests
 * will also skip (they depend on this project).
 */
import { test, expect } from '@playwright/test';
import path from 'path';

const AUTH_FILE = path.join(__dirname, '.auth/admin.json');

test('authenticate as admin', async ({ page }) => {
  const email    = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn(
      '\n⚠  TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not set — skipping auth setup.\n' +
      '   Authenticated admin tests will be skipped.\n',
    );
    // Write an empty state file so dependent tests don't hard-fail on missing file.
    await page.context().storageState({ path: AUTH_FILE });
    return;
  }

  await page.goto('/login');
  await expect(page.locator('h1')).toContainText('Sign in');

  await page.fill('input[type="email"]',    email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard', { timeout: 20_000 });
  await expect(page.locator('.admin-page-root')).toBeVisible();

  await page.context().storageState({ path: AUTH_FILE });
});
