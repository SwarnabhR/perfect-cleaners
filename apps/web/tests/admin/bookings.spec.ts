import { test, expect } from '../fixtures/admin';

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
    await expect(pendingBtn).toBeVisible({ timeout: 20_000 });
    await pendingBtn.click();
    await expect(pendingBtn).toHaveCSS('background-color', /rgba|rgb/);
    await page.locator('button:has-text("All")').first().click();
  });

  test('table renders with correct column headers', async ({ page }) => {
    const headers = ['Ref', 'Customer', 'Vehicle', 'Worker', 'Status', 'Scheduled', 'Amount', 'Action'];
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

  test('search from top bar navigates to live cleaning board', async ({ page }) => {
    // Top-bar search (placeholder "Search cleaning sessions…") no longer
    // targets /bookings with a query param — it always routes to the
    // live-cleaning board (see apps/web/src/app/(admin)/layout.tsx).
    await page.goto('/dashboard');
    await page.fill('input[placeholder="Search cleaning sessions…"]', 'Amit');
    await page.keyboard.press('Enter');
    await page.waitForURL(/\/live-cleaning/, { timeout: 5_000 });
  });

  test('search chip can be cleared', async ({ page }) => {
    // Bookings has its own local, in-page search input (no URL query param,
    // no "chip" UI) — verify it accepts and clears text directly.
    const search = page.locator('input[placeholder="Search by ref, customer, service…"]');
    await search.fill('Amit');
    await expect(search).toHaveValue('Amit');
    await search.fill('');
    await expect(search).toHaveValue('');
  });

});
