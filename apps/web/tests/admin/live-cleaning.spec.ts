import { test, expect } from '../fixtures/admin';

test.describe('Admin Live Cleaning Task Board', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/live-cleaning');
    await expect(page.locator('.admin-page-root')).toBeVisible();
  });

  test('renders page heading and eyebrow', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Live Cleaning Task Board');
    await expect(page.locator('text="OPERATIONS"')).toBeVisible();
  });

  test('society and tower filter selects are visible', async ({ page }) => {
    await expect(page.locator('text="SOCIETY"')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('text="TOWER"')).toBeVisible();
    await expect(page.locator('select', { hasText: 'All Societies' })).toBeVisible();
    await expect(page.locator('select', { hasText: 'All Towers' })).toBeVisible();
  });

  test('shows time-slot cards with cars or the no-sessions empty state', async ({ page }) => {
    await expect(
      page.locator('text=No cars scheduled for today.')
        .or(page.locator('text=/\\d+ \\/ \\d+ CARS/'))
    ).toBeVisible({ timeout: 20_000 });
  });

  test('a car row can be toggled unavailable and back', async ({ page }) => {
    const toggleBtn = page.locator('button[title="Mark unavailable"]').first();
    if (!await toggleBtn.isVisible({ timeout: 20_000 }).catch(() => false)) {
      test.skip(true, 'No cars scheduled to toggle');
      return;
    }
    await toggleBtn.click();
    const undoBtn = page.locator('button[title="Mark available"]').first();
    await expect(undoBtn).toBeVisible({ timeout: 8_000 });
    await undoBtn.click();
    await expect(page.locator('button[title="Mark unavailable"]').first()).toBeVisible({ timeout: 8_000 });
  });

});
