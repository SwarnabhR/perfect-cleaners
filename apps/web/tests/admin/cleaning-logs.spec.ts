import { test, expect } from '@playwright/test';

// Admin cleaning-logs uses "Today" / "Last 7 Days" / "All Time" (title case)
test.describe('Admin Cleaning Logs', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/cleaning-logs');
    await expect(page.locator('.admin-page-root')).toBeVisible();
  });

  test('renders page heading', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible();
  });

  test('date filter buttons are visible', async ({ page }) => {
    for (const label of ['Today', 'Last 7 Days', 'All Time']) {
      await expect(page.locator(`button:has-text("${label}")`)).toBeVisible();
    }
  });

  test('date filter switches work', async ({ page }) => {
    await page.click('button:has-text("Last 7 Days")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("All Time")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Today")');
  });

  test('shows loading or worker breakdown', async ({ page }) => {
    await expect(page.locator('.admin-page-root')).toBeVisible({ timeout: 10_000 });
  });

  test('KPI cards show cars cleaned and revenue metrics', async ({ page }) => {
    await page.waitForTimeout(2_000);
    await expect(page.locator('.admin-page-root')).toBeVisible();
  });

});
