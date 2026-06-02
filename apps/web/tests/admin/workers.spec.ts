import { test, expect } from '@playwright/test';

test.describe('Admin Workers', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/workers');
    await expect(page.locator('.admin-page-root')).toBeVisible();
  });

  test('renders page heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Workers');
  });

  test('Add Worker button is visible', async ({ page }) => {
    await expect(page.locator('button:has-text("Add Worker")')).toBeVisible();
  });

  test('search input is visible', async ({ page }) => {
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
  });

  test('status filter buttons are visible', async ({ page }) => {
    for (const label of ['All', 'Online', 'Offline']) {
      await expect(page.locator(`button:has-text("${label}")`)).toBeVisible();
    }
  });

  test('table has correct column headers when data is present', async ({ page }) => {
    const hasData = await page.locator('tbody tr').first().isVisible({ timeout: 8_000 }).catch(() => false);
    if (!hasData) { test.skip(true, 'No workers in database'); return; }
    for (const h of ['Name', 'Phone', 'Status', 'Rating', 'Jobs', 'Society']) {
      await expect(page.locator(`th:has-text("${h}")`)).toBeVisible();
    }
  });

  test('clicking a worker row opens detail panel', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    if (!await firstRow.isVisible({ timeout: 8_000 }).catch(() => false)) {
      test.skip(true, 'No workers in database'); return;
    }
    await firstRow.click();
    await expect(page.locator('button:has-text("Edit"), button:has-text("Delete")')).toBeVisible({ timeout: 8_000 });
  });

  test('Add Worker modal opens and has required fields', async ({ page }) => {
    await page.click('button:has-text("Add Worker")');
    // Actual placeholders in the worker form
    await expect(page.locator('input[placeholder="Ravi Kumar"]')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('input[placeholder="98765 43210"]')).toBeVisible();
    // Close via Cancel button
    await page.locator('button:has-text("Cancel")').first().click();
  });

});
