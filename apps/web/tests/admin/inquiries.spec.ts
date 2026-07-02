import { test, expect } from '../fixtures/admin';

test.describe('Admin Contact Inquiries', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/inquiries');
    await expect(page.locator('.admin-page-root')).toBeVisible();
  });

  test('renders page heading and eyebrow', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Contact Inquiries');
    await expect(page.locator('text="SUPPORT"')).toBeVisible();
  });

  test('renders four KPI cards', async ({ page }) => {
    // "New" also exact-matches the "New" filter chip button outside the KPI
    // grid — scope to the grid container to disambiguate.
    const kpis = page.locator('.kpi-grid-4');
    for (const label of ['Total', 'New', 'Today', 'Resolved']) {
      await expect(kpis.locator(`text="${label}"`)).toBeVisible({ timeout: 15_000 });
    }
  });

  test('search input is visible', async ({ page }) => {
    await expect(page.locator('input[placeholder="Search by name, phone, message…"]')).toBeVisible();
  });

  test('status filter chips are visible', async ({ page }) => {
    for (const label of ['All', 'New', 'In Progress', 'Resolved']) {
      await expect(page.locator(`button:has-text("${label}")`).first()).toBeVisible();
    }
  });

  test('table has correct columns or shows empty state', async ({ page }) => {
    await expect(
      page.locator('tbody tr').first().or(page.locator('text=No inquiries found'))
    ).toBeVisible({ timeout: 20_000 });
    const hasRows = (await page.locator('tbody tr').count()) > 0;
    if (!hasRows) {
      await expect(page.locator('text=No inquiries found')).toBeVisible();
      return;
    }
    for (const h of ['Date', 'Contact', 'Service', 'Message', 'Status', 'Actions']) {
      await expect(page.locator(`th:has-text("${h}")`)).toBeVisible();
    }
  });

  test('clicking a row expands the full message', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    if (!await firstRow.isVisible({ timeout: 20_000 }).catch(() => false)) {
      test.skip(true, 'No inquiries to expand'); return;
    }
    await firstRow.click();
    await expect(page.locator('text=FULL MESSAGE')).toBeVisible({ timeout: 5_000 });
  });

  test('status action buttons advance an inquiry', async ({ page }) => {
    // Scoped to the table — the filter-chip row above it also has an
    // "In Progress" button that must not be confused with a row action.
    const buttons = page.locator('tbody button:has-text("In Progress")');
    const before = await buttons.count();
    if (before === 0) { test.skip(true, 'No new inquiry to advance to In Progress'); return; }
    // Fires immediately (no confirm) — that row's own "In Progress" action
    // button disappears once its status changes, dropping the page-wide count.
    await buttons.first().click();
    await expect(buttons).toHaveCount(before - 1, { timeout: 8_000 });
  });

});
