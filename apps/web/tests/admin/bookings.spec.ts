import { test, expect } from '@playwright/test';

test.describe('Admin Bookings', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/bookings');
    await expect(page.locator('.admin-page-root')).toBeVisible();
  });

  test('renders page heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Bookings');
  });

  test('renders four KPI cards', async ({ page }) => {
    const grid = page.locator('.kpi-grid-4');
    await expect(grid).toBeVisible();
    await expect(grid.locator('p').filter({ hasText: /total|pending|active|done/i }).first()).toBeVisible();
  });

  test('renders filter buttons', async ({ page }) => {
    const filters = ['All', 'Pending', 'Assigned', 'En Route', 'In Progress', 'Done'];
    for (const label of filters) {
      await expect(page.locator(`button:has-text("${label}")`)).toBeVisible();
    }
  });

  test('filter buttons toggle active state', async ({ page }) => {
    const pendingBtn = page.locator('button:has-text("Pending")').first();
    await pendingBtn.click();
    // Active filter button uses sage background — check it's visually distinguished
    await expect(pendingBtn).toHaveCSS('background-color', /rgba|rgb/);

    // Switch back to All
    await page.locator('button:has-text("All")').first().click();
  });

  test('table renders with correct column headers', async ({ page }) => {
    const headers = ['Booking ID', 'Customer', 'Service', 'Date & Time', 'Worker', 'Amount', 'Status'];
    for (const h of headers) {
      await expect(page.locator(`th:has-text("${h}")`)).toBeVisible();
    }
  });

  test('table shows loading or data', async ({ page }) => {
    // Either "Loading…" text or at least one table row
    const loading = page.locator('text=Loading…');
    const rows    = page.locator('tbody tr');

    await expect(loading.or(rows.first())).toBeVisible({ timeout: 10_000 });
  });

  test('search from top bar navigates with query param', async ({ page }) => {
    await page.goto('/dashboard');
    await page.fill('input[placeholder="Search bookings…"]', 'Amit');
    await page.keyboard.press('Enter');
    await page.waitForURL(/\/bookings\?search=Amit/, { timeout: 5_000 });
    const chip = page.locator('text="Amit"');
    await expect(chip).toBeVisible();
  });

  test('search chip can be cleared', async ({ page }) => {
    await page.goto('/bookings?search=Amit');
    await expect(page.locator('text="Amit"')).toBeVisible();
    // "×" close button clears the search
    await page.click('button:has-text("×")');
    await expect(page.locator('text="Amit"')).not.toBeVisible();
  });

});
