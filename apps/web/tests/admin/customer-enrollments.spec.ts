import { test, expect } from '../fixtures/admin';

test.describe('Admin Customer Enrollments', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/customer-enrollments');
    await expect(page.locator('.admin-page-root')).toBeVisible();
  });

  test('renders page heading and eyebrow', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Active Enrollments');
    await expect(page.locator('text="CUSTOMERS"')).toBeVisible();
  });

  test('renders four KPI cards', async ({ page }) => {
    // Every label also substring-matches a filter chip or table cell value
    // (e.g. "Not Verified", the lowercase "pending payment" chip) — exact
    // match hits only the KPI card's own <p>.
    await expect(page.locator('text="TOTAL ENROLLED"')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('text="PENDING PAYMENT"')).toBeVisible();
    await expect(page.locator('text="VERIFIED"')).toBeVisible();
    await expect(page.locator('text="PAID"')).toBeVisible();
  });

  test('search input is visible', async ({ page }) => {
    await expect(page.locator('input[placeholder="Search by society, tower, or customer ID…"]')).toBeVisible();
  });

  test('status filter buttons are visible', async ({ page }) => {
    await expect(page.locator('button:has-text("All")').first()).toBeVisible();
    await expect(page.locator('button:has-text("verified")')).toBeVisible();
    await expect(page.locator('button:has-text("pending payment")')).toBeVisible();
    await expect(page.locator('button:has-text("paid")')).toBeVisible();
  });

  test('table has correct columns when data is present', async ({ page }) => {
    // Wait for the KPI count first (loads fast) as a proxy for "data ready".
    await expect(page.locator('text="TOTAL ENROLLED"')).toBeVisible({ timeout: 15_000 });
    // Either real rows or the empty-state text must appear — whichever wins
    // tells us which branch rendered. This table can be slow to settle, so
    // give it real room rather than a short isVisible() snapshot.
    await expect(
      page.locator('tbody tr').first().or(page.locator('text=No enrollments found'))
    ).toBeVisible({ timeout: 30_000 });
    const rowCount = await page.locator('tbody tr').count();
    if (rowCount === 0) {
      await expect(page.locator('text=No enrollments found')).toBeVisible();
      return;
    }
    for (const h of ['Customer', 'Society', 'Tower', 'Car', 'Status', 'Payment', 'Next Billing', 'Action']) {
      await expect(page.locator(`th:has-text("${h}")`)).toBeVisible();
    }
  });

  test('Mark Paid opens a confirmation modal', async ({ page }) => {
    const markPaidBtn = page.locator('button:has-text("Mark Paid")').first();
    if (!await markPaidBtn.isVisible({ timeout: 20_000 }).catch(() => false)) {
      test.skip(true, 'No pending-payment enrollment to test Mark Paid on');
      return;
    }
    await markPaidBtn.click();
    await expect(page.locator('text=Mark Payment Received')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('button:has-text("Confirm")')).toBeVisible();
    await page.locator('button:has-text("Cancel")').click();
    await expect(page.locator('text=Mark Payment Received')).not.toBeVisible({ timeout: 5_000 });
  });

  test('Pause/Resume toggle is present on an active or paused row', async ({ page }) => {
    const toggleBtn = page.locator('button:has-text("Pause"), button:has-text("Resume")').first();
    if (!await toggleBtn.isVisible({ timeout: 20_000 }).catch(() => false)) {
      test.skip(true, 'No active/paused enrollment to test the toggle on');
      return;
    }
    await expect(toggleBtn).toBeVisible();
  });

});
