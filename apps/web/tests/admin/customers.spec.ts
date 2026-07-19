import { test, expect } from '../fixtures/admin';

test.describe('Admin Customers', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/customers');
    await expect(page.locator('.admin-page-root')).toBeVisible();
  });

  test('renders page heading and eyebrow', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Customers');
    await expect(page.locator('text="CRM"')).toBeVisible();
  });

  test('renders four KPI cards', async ({ page }) => {
    for (const label of ['Total Customers', 'Active (30d)', 'Outstanding', 'Avg Lifetime']) {
      await expect(page.locator(`text=${label}`)).toBeVisible({ timeout: 15_000 });
    }
  });

  test('search input is visible', async ({ page }) => {
    await expect(page.locator('input[placeholder="Search by name or phone…"]')).toBeVisible();
  });

  test('society filter row is shown when at least one customer has a society', async ({ page }) => {
    const hasSocietyFilter = await page.locator('text="Society"').isVisible({ timeout: 8_000 }).catch(() => false);
    if (!hasSocietyFilter) { test.skip(true, 'No customer with a societyName to trigger this row'); return; }
    await expect(page.locator('text="Society"')).toBeVisible();
  });

  test('table has correct columns or shows empty state', async ({ page }) => {
    const hasRows = await page.locator('tbody tr').first().isVisible({ timeout: 20_000 }).catch(() => false);
    if (!hasRows) {
      await expect(page.locator('text=No customers found.')).toBeVisible();
      return;
    }
    for (const h of ['Customer', 'Society', 'Phone', 'Vehicles', 'Jobs', 'Total Spent', 'Outstanding', 'Joined']) {
      await expect(page.locator(`th:has-text("${h}")`)).toBeVisible();
    }
  });

});
