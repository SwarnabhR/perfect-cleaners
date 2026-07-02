import { test, expect } from '../fixtures/admin';

test.describe('Admin Services Management', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/services-mgmt');
    await expect(page.locator('.admin-page-root')).toBeVisible({ timeout: 20_000 });
  });

  test('renders page heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Services');
  });

  test('Add Service button is visible', async ({ page }) => {
    await expect(page.locator('button:has-text("Add Service")')).toBeVisible();
  });

  test('opening Add Service shows correct form fields', async ({ page }) => {
    await expect(page.locator('button:has-text("Add Service")')).toBeVisible({ timeout: 20_000 });
    await page.click('button:has-text("Add Service")');
    await expect(page.locator('input[placeholder="e.g. Premium Exterior Wash"]')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('input[type="number"]').first()).toBeVisible();
    await expect(page.locator('textarea[placeholder*="description"]')).toBeVisible();
  });

  test('Add Service form can be cancelled', async ({ page }) => {
    await expect(page.locator('button:has-text("Add Service")')).toBeVisible({ timeout: 20_000 });
    await page.click('button:has-text("Add Service")');
    await expect(page.locator('input[placeholder="e.g. Premium Exterior Wash"]')).toBeVisible({ timeout: 15_000 });
    await page.locator('button:has-text("Cancel")').last().click();
    await expect(page.locator('input[placeholder="e.g. Premium Exterior Wash"]')).not.toBeVisible({ timeout: 8_000 });
  });

  test('service table shows correct headers when data exists', async ({ page }) => {
    const hasData = await page.locator('table tbody tr').first().isVisible({ timeout: 8_000 }).catch(() => false);
    if (!hasData) { test.skip(true, 'No services in database'); return; }
    for (const h of ['Service', 'Category', 'Price Range', 'Status']) {
      await expect(page.locator(`th:has-text("${h}")`)).toBeVisible();
    }
  });

  test('each service row has action buttons', async ({ page }) => {
    const hasData = await page.locator('table tbody tr').first().isVisible({ timeout: 8_000 }).catch(() => false);
    if (!hasData) { test.skip(true, 'No services in database'); return; }
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow.locator('button').first()).toBeVisible();
  });

});
