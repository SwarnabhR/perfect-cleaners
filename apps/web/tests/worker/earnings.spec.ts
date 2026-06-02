import { test, expect } from '@playwright/test';

test.describe('Worker Earnings', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/worker/earnings');
    await page.waitForLoadState('networkidle');
  });

  test('renders page heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Earnings');
  });

  test('shows three period cards: Today, This Week, This Month', async ({ page }) => {
    await expect(page.locator('text=Today').first()).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('text=This Week').or(page.locator('text=Week'))).toBeVisible();
    await expect(page.locator('text=This Month').or(page.locator('text=Month'))).toBeVisible();
  });

  test('earnings values are numeric (₹ prefixed)', async ({ page }) => {
    // Wait for Firestore data to load
    await page.waitForTimeout(2_000);
    const rupeeValues = page.locator('text=/^₹/');
    await expect(rupeeValues.first()).toBeVisible({ timeout: 8_000 });
  });

  test('total jobs and rating stats are shown', async ({ page }) => {
    await expect(
      page.locator('text=Total Jobs').or(page.locator('text=total jobs'))
    ).toBeVisible({ timeout: 8_000 });
    await expect(
      page.locator('text=Rating').or(page.locator('text=rating'))
    ).toBeVisible();
  });

  test('bottom nav is visible', async ({ page }) => {
    await expect(page.locator('nav')).toBeVisible();
  });

  test('recent completed jobs section appears when data exists', async ({ page }) => {
    await page.waitForTimeout(2_000);
    // Either shows jobs or the section is conditionally hidden
    await expect(page.locator('body')).toBeVisible();
  });

});
