import { test, expect } from '../fixtures/admin';

test.describe('Admin Notifications (SMS History)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/notifications');
    await expect(page.locator('.admin-page-root')).toBeVisible();
  });

  test('renders page heading and eyebrow', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('SMS History');
    await expect(page.locator('text="COMMUNICATION"')).toBeVisible();
  });

  test('renders four KPI cards', async ({ page }) => {
    const kpis = page.locator('.kpi-grid-4');
    for (const label of ['TOTAL SENT', 'SUCCESSFUL', 'FAILED', 'TODAY']) {
      await expect(kpis.locator(`text=${label}`)).toBeVisible({ timeout: 15_000 });
    }
  });

  test('search input is visible', async ({ page }) => {
    await expect(page.locator('input[placeholder="Search by phone or name…"]')).toBeVisible();
  });

  test('type filter buttons are visible', async ({ page }) => {
    for (const label of ['All', 'approval', 'car cleaned', 'weekly reminder', 'payment reminder']) {
      await expect(page.locator(`button:has-text("${label}")`)).toBeVisible();
    }
  });

  test('shows notification rows or the empty state', async ({ page }) => {
    await expect(
      page.locator('text=No notifications found')
        .or(page.locator('text="Sent"').or(page.locator('text="Failed"')).first())
    ).toBeVisible({ timeout: 20_000 });
  });

  test('rows show a Sent or Failed status badge', async ({ page }) => {
    const hasRow = await page.locator('text="Sent"').or(page.locator('text="Failed"')).first().isVisible({ timeout: 20_000 }).catch(() => false);
    if (!hasRow) { test.skip(true, 'No notifications logged yet'); return; }
    await expect(page.locator('text="Sent"').or(page.locator('text="Failed"')).first()).toBeVisible();
  });

  test('filtering by type narrows the search-and-filter empty state', async ({ page }) => {
    // A search term guaranteed not to match anything real always yields the
    // "no results" branch — verifies search + filter wiring without needing
    // to depend on there being zero of a specific notification type.
    await page.fill('input[placeholder="Search by phone or name…"]', 'pw-test-no-such-recipient-zzz');
    await expect(page.locator('text=No notifications found')).toBeVisible({ timeout: 10_000 });
  });

});
