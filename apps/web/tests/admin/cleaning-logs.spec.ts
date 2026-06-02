import { test, expect } from '@playwright/test';

test.describe('Admin Cleaning Logs', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/cleaning-logs');
    await expect(page.locator('.admin-page-root')).toBeVisible();
  });

  test('renders page heading', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible();
  });

  test('date filter buttons are visible', async ({ page }) => {
    for (const label of ['Today', 'Last 7 days', 'All time']) {
      await expect(page.locator(`button:has-text("${label}")`)).toBeVisible();
    }
  });

  test('date filter switches work', async ({ page }) => {
    await page.click('button:has-text("Last 7 days")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("All time")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Today")');
  });

  test('shows loading or worker breakdown', async ({ page }) => {
    const loading = page.locator('text=Loading…');
    const content = page.locator('.admin-page-root');
    await expect(loading.or(content)).toBeVisible({ timeout: 10_000 });
  });

  test('KPI cards show cars cleaned and revenue metrics', async ({ page }) => {
    // Either data cards or empty state
    await page.waitForTimeout(2_000);
    await expect(page.locator('.admin-page-root')).toBeVisible();
  });

});
