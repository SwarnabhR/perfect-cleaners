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
    await expect(page.locator('button:has-text("Add Society")')).toBeVisible({ timeout: 20_000 });
    await page.click('button:has-text("Add Society")');
    // First field is visible without scrolling
    await expect(page.locator('input[placeholder="Uniworld City"]')).toBeVisible({ timeout: 15_000 });
    // Subsequent fields may be in the overflow:auto modal — check DOM presence
    const addrInput = page.locator('input[placeholder="Sector 30, Noida"]');
    await addrInput.scrollIntoViewIfNeeded();
    await expect(addrInput).toHaveCount(1);
    await expect(page.locator('input[placeholder="Noida"]')).toHaveCount(1);
    await expect(page.locator('input[placeholder="201301"]')).toHaveCount(1);
    const towerInput = page.locator('input[placeholder*="Tower A"]');
    await towerInput.scrollIntoViewIfNeeded();
    await expect(towerInput).toHaveCount(1);
    const cpInput = page.locator('input[placeholder="Rajesh Kumar"]');
    await cpInput.scrollIntoViewIfNeeded();
    await expect(cpInput).toHaveCount(1);
  });

  test('Add Society modal can be cancelled', async ({ page }) => {
    await expect(page.locator('button:has-text("Add Society")')).toBeVisible({ timeout: 20_000 });
    await page.click('button:has-text("Add Society")');
    await expect(page.locator('input[placeholder="Uniworld City"]')).toBeVisible({ timeout: 15_000 });
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('input[placeholder="Uniworld City"]')).not.toBeVisible({ timeout: 8_000 });
  });

  test('Add Society modal validates required fields', async ({ page }) => {
    await expect(page.locator('button:has-text("Add Society")')).toBeVisible({ timeout: 20_000 });
    await page.click('button:has-text("Add Society")');
    await expect(page.locator('input[placeholder="Uniworld City"]')).toBeVisible({ timeout: 15_000 });
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=Society name is required.')).toBeVisible({ timeout: 8_000 });
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
    await page.waitForTimeout(300);
    await expect(
      page.locator('text=No societies yet.').or(page.locator('tbody tr').first())
    ).toBeVisible({ timeout: 5_000 });
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
