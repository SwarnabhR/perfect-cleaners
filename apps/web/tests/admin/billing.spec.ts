import { test, expect } from '../fixtures/admin';

test.describe('Admin Billing', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/billing');
    await expect(page.locator('.admin-page-root')).toBeVisible();
  });

  test('renders page heading and eyebrow', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Billing');
    await expect(page.locator('text="FINANCE"')).toBeVisible();
  });

  test('renders three KPI cards', async ({ page }) => {
    for (const label of ["Today's Collected", 'Total Collected', 'Total Pending Dues']) {
      await expect(page.locator(`text=${label}`)).toBeVisible({ timeout: 15_000 });
    }
  });

  test('filter chips are visible', async ({ page }) => {
    for (const label of ['All pending', 'Pending dues']) {
      await expect(page.locator(`button:has-text("${label}")`)).toBeVisible();
    }
  });

  test('customer dues table has correct columns or shows empty state', async ({ page }) => {
    // The page now renders three tables (CUSTOMER DUES, SOCIETY BILLING DUES,
    // PAYMENT HISTORY) and all three have a "Customer" column, so every
    // locator here has to be scoped to the first one or it resolves to 3.
    const duesTable = page.locator('table').first();
    const hasRows = await duesTable.locator('tbody tr').first().isVisible({ timeout: 20_000 }).catch(() => false);
    if (!hasRows) {
      await expect(page.locator('text=No outstanding dues.')).toBeVisible();
      return;
    }
    for (const h of ['Customer', 'Society / Unit', 'Outstanding', 'Action']) {
      await expect(duesTable.locator(`th:has-text("${h}")`).first()).toBeVisible();
    }
  });

  test('Mark Paid button is present on a due row', async ({ page }) => {
    const hasRows = await page.locator('tbody tr').first().isVisible({ timeout: 20_000 }).catch(() => false);
    if (!hasRows) { test.skip(true, 'No outstanding dues to test Mark Paid on'); return; }
    await expect(page.locator('button:has-text("Mark Paid")').first()).toBeVisible();
  });

  test('payment history table has correct columns when logs exist', async ({ page }) => {
    const hasDateCol = await page.locator('th:has-text("Date")').isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasDateCol) { test.skip(true, 'No payment history logs yet'); return; }
    for (const h of ['Date', 'Customer', 'Type', 'Amount']) {
      await expect(page.locator(`th:has-text("${h}")`)).toBeVisible();
    }
  });

});
