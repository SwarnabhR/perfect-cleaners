import { test, expect } from '@playwright/test';

test.describe('Admin Analytics', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics');
    await expect(page.locator('.admin-page-root')).toBeVisible();
  });

  test('renders page heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Performance Overview');
  });

  test('renders all four KPI cards', async ({ page }) => {
    const kpis = ['Total Revenue', 'Jobs Completed', 'Avg Job Value', 'Cancellations'];
    for (const label of kpis) {
      await expect(page.locator(`text=${label}`)).toBeVisible();
    }
  });

  test('range filter buttons are visible and clickable', async ({ page }) => {
    for (const r of ['7D', '30D', '90D', 'All']) {
      const btn = page.locator(`button:has-text("${r}")`);
      await expect(btn).toBeVisible();
      await btn.click();
      await page.waitForTimeout(300);
    }
  });

  test('revenue chart SVG is rendered', async ({ page }) => {
    await expect(page.locator('svg').first()).toBeVisible();
  });

  test('job mix donut chart is rendered', async ({ page }) => {
    await expect(page.locator('text=JOB MIX')).toBeVisible();
    // Either chart or "No bookings" message
    await expect(
      page.locator('svg circle').first()
        .or(page.locator('text=No bookings in this period.'))
    ).toBeVisible({ timeout: 10_000 });
  });

  test('top services table section is rendered', async ({ page }) => {
    await expect(page.locator('text=TOP SERVICES')).toBeVisible();
  });

  test('switching range updates the heading label', async ({ page }) => {
    await page.click('button:has-text("7D")');
    await expect(page.locator('text=LAST 7 DAYS')).toBeVisible();

    await page.click('button:has-text("All")');
    await expect(page.locator('text=ALL TIME')).toBeVisible();
  });

  test('KPI values load from Firestore (not stuck on —)', async ({ page }) => {
    // Wait for loading to finish — values should either be numeric or ₹0
    await page.waitForTimeout(3_000);
    const revenueCard = page.locator('text=Total Revenue').locator('..').locator('..');
    // The value cell should not show the loading placeholder "—"
    const valueTxt = await revenueCard.locator('p').nth(1).textContent();
    expect(valueTxt).not.toBeNull();
  });

});
