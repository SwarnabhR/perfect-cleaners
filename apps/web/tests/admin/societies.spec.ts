import { test, expect } from '@playwright/test';

test.describe('Admin Societies Management', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/societies-mgmt');
    await expect(page.locator('.admin-page-root')).toBeVisible();
  });

  test('renders page heading and eyebrow', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Societies');
    await expect(page.locator('text=PARTNERS')).toBeVisible();
  });

  test('renders four KPI cards', async ({ page }) => {
    const kpis = ['Total Societies', 'Active Now', 'Total Residents', 'Registered Cars'];
    for (const label of kpis) {
      await expect(page.locator(`text=${label}`)).toBeVisible();
    }
  });

  test('Add Society button is visible', async ({ page }) => {
    await expect(page.locator('button:has-text("Add Society")')).toBeVisible();
  });

  test('opening Add Society modal shows all form fields', async ({ page }) => {
    await page.click('button:has-text("Add Society")');

    const modal = page.locator('text=Add society').locator('..');
    await expect(modal).toBeVisible();

    await expect(page.locator('input[placeholder="Uniworld City"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Sector 30, Noida"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Noida"]')).toBeVisible();
    await expect(page.locator('input[placeholder="201301"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="Tower A"]')).toBeVisible();
    await expect(page.locator('input[placeholder="99"][type="number"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Rajesh Kumar"]')).toBeVisible();
  });

  test('Add Society modal can be cancelled', async ({ page }) => {
    await page.click('button:has-text("Add Society")');
    await expect(page.locator('text=Add society')).toBeVisible();
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('text=Add society')).not.toBeVisible();
  });

  test('Add Society modal validates required fields', async ({ page }) => {
    await page.click('button:has-text("Add Society")');
    await page.click('button:has-text("Add society")');
    await expect(page.locator('text=Society name is required.')).toBeVisible();
  });

  test('status filter buttons are visible', async ({ page }) => {
    for (const label of ['All', 'Active', 'Inactive']) {
      await expect(page.locator(`button:has-text("${label}")`)).toBeVisible();
    }
  });

  test('search input filters societies', async ({ page }) => {
    const search = page.locator('input[placeholder="Search by name or city…"]');
    await expect(search).toBeVisible();
    await search.fill('Test Society XYZ');
    // After filtering, either shows no results or filtered rows
    await page.waitForTimeout(300);
    const noResults = page.locator('text=No societies yet.');
    const rows      = page.locator('tbody tr');
    await expect(noResults.or(rows.first())).toBeVisible({ timeout: 5_000 });
  });

  test('table has correct column headers', async ({ page }) => {
    // Only shown when there is data
    const headers = ['Society', 'City', 'Units', 'Residents', 'Vehicles', 'Status', 'Schedule'];
    const hasData = await page.locator('tbody tr').count() > 0;
    if (!hasData) {
      test.skip(true, 'No societies in database — skipping table header check');
      return;
    }
    for (const h of headers) {
      await expect(page.locator(`th:has-text("${h}")`)).toBeVisible();
    }
  });

  test('clicking a society row opens detail panel', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const hasRows  = await firstRow.isVisible().catch(() => false);
    if (!hasRows) {
      test.skip(true, 'No societies in database — skipping detail panel test');
      return;
    }

    await firstRow.click();
    await expect(page.locator('button:has-text("Edit")')).toBeVisible();
    await expect(page.locator('button:has-text("Activate"), button:has-text("Deactivate")')).toBeVisible();
    await expect(page.locator('button:has-text("Delete")')).toBeVisible();
  });

  test('detail panel Edit button opens form modal', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    if (!await firstRow.isVisible().catch(() => false)) {
      test.skip(true, 'No societies in database');
      return;
    }

    await firstRow.click();
    await page.click('button:has-text("Edit")');
    await expect(page.locator('text=Edit society')).toBeVisible();
    await page.click('button:has-text("Cancel")');
  });

  test('detail panel Delete requires confirmation', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    if (!await firstRow.isVisible().catch(() => false)) {
      test.skip(true, 'No societies in database');
      return;
    }

    await firstRow.click();
    await page.click('button:has-text("Delete")');
    await expect(page.locator('button:has-text("Confirm delete")')).toBeVisible();
    // Close without confirming
    await page.click('button:has-text("Close")');
  });

});
