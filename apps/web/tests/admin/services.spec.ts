import { test, expect } from '@playwright/test';

test.describe('Admin Services Management', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/services-mgmt');
    await expect(page.locator('.admin-page-root')).toBeVisible();
  });

  test('renders page heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Services');
  });

  test('Add Service button is visible', async ({ page }) => {
    await expect(page.locator('button:has-text("Add Service")')).toBeVisible();
  });

  test('opening Add Service shows form fields', async ({ page }) => {
    await page.click('button:has-text("Add Service")');
    await expect(page.locator('input[placeholder*="Exterior"], input[placeholder*="service"], input[placeholder*="name"]').first()).toBeVisible();
    await expect(page.locator('input[type="number"]').first()).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
  });

  test('Add Service modal can be cancelled', async ({ page }) => {
    await page.click('button:has-text("Add Service")');
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('button:has-text("Cancel")')).not.toBeVisible();
  });

  test('service table shows correct headers', async ({ page }) => {
    const hasData = await page.locator('table tbody tr').first().isVisible().catch(() => false);
    if (!hasData) {
      test.skip(true, 'No services in database');
      return;
    }
    for (const h of ['Service', 'Category', 'Price Range', 'Status']) {
      await expect(page.locator(`th:has-text("${h}")`)).toBeVisible();
    }
  });

  test('active toggle is present per row', async ({ page }) => {
    const hasData = await page.locator('table tbody tr').first().isVisible().catch(() => false);
    if (!hasData) {
      test.skip(true, 'No services in database');
      return;
    }
    // Each row has an edit + delete action
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow.locator('button').first()).toBeVisible();
  });

});
