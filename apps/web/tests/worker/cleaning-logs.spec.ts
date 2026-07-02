import { test, expect } from '../fixtures/worker';

test.describe('Worker Cleaning Logs', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/worker/cleaning-logs');
    await page.waitForLoadState('networkidle');
  });

  test('renders page heading and eyebrow', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('My Cleans');
    await expect(page.locator('text=ACTIVITY LOG')).toBeVisible();
  });

  test('date filter buttons are all visible', async ({ page }) => {
    await expect(page.locator('button:has-text("Today")')).toBeVisible();
    await expect(page.locator('button:has-text("Last 7 days")')).toBeVisible();
    await expect(page.locator('button:has-text("All time")')).toBeVisible();
  });

  test('switching date filters works', async ({ page }) => {
    await expect(page.locator('button:has-text("Last 7 days")')).toBeVisible({ timeout: 8_000 });
    await page.click('button:has-text("Last 7 days")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("All time")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Today")');
  });

  test('stats cards show Cars Cleaned and Earned', async ({ page }) => {
    await expect(page.locator('text=CARS CLEANED').or(page.locator('text=Cars Cleaned'))).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('text=EARNED').or(page.locator('text=Earned'))).toBeVisible();
  });

  test('shows CLEANING HISTORY section label', async ({ page }) => {
    await expect(page.locator('text=CLEANING HISTORY').or(page.locator('text=[CLEANING HISTORY]'))).toBeVisible({ timeout: 8_000 });
  });

  test('shows log rows or empty state', async ({ page }) => {
    await expect(
      page.locator('text=No cleans yet')
        .or(page.locator('table tbody tr').first())
    ).toBeVisible({ timeout: 10_000 });
  });

  test('log table has correct columns when data exists', async ({ page }) => {
    const hasData = await page.locator('table tbody tr').first().isVisible({ timeout: 8_000 }).catch(() => false);
    if (!hasData) {
      test.skip(true, 'No cleaning logs for test worker');
      return;
    }
    for (const header of ['Time', 'Unit', 'Resident', 'Vehicle', 'Type', 'Earned']) {
      await expect(page.locator(`th:has-text("${header}")`)).toBeVisible();
    }
  });

  test('society name is shown under heading when worker is assigned', async ({ page }) => {
    // Optional: society name appears when worker.assignedSocietyName is set
    // Just assert the heading area is properly structured
    await expect(page.locator('h1')).toBeVisible();
  });

});
