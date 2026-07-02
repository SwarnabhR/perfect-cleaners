import { test, expect } from '../fixtures/admin';

test.describe('Admin App Waitlist', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/waitlist');
    await expect(page.locator('.admin-page-root')).toBeVisible();
  });

  test('renders page heading and eyebrow', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('App Waitlist');
    await expect(page.locator('text="GROWTH"')).toBeVisible();
  });

  test('renders four KPI cards', async ({ page }) => {
    for (const label of ['Total Signups', 'Android', 'iOS', 'Today']) {
      await expect(page.locator(`text=${label}`).first()).toBeVisible({ timeout: 15_000 });
    }
  });

  test('search input is visible', async ({ page }) => {
    await expect(page.locator('input[placeholder="Search by phone number…"]')).toBeVisible();
  });

  test('platform filter chips are visible', async ({ page }) => {
    for (const label of ['All', 'Android', 'iOS', 'Both']) {
      await expect(page.locator(`button:has-text("${label}")`).first()).toBeVisible();
    }
  });

  test('table has correct columns or shows empty state', async ({ page }) => {
    await expect(
      page.locator('tbody tr').first().or(page.locator('text=No entries found'))
    ).toBeVisible({ timeout: 20_000 });
    const hasRows = (await page.locator('tbody tr').count()) > 0;
    if (!hasRows) {
      await expect(page.locator('text=No entries found')).toBeVisible();
      return;
    }
    for (const h of ['#', 'Phone', 'Platform', 'Signed Up']) {
      await expect(page.locator(`th:has-text("${h}")`)).toBeVisible();
    }
  });

});
