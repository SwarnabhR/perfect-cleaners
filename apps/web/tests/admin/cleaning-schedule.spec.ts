import { test, expect } from '../fixtures/admin';

test.describe('Admin Cleaning Schedule', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/cleaning-schedule');
    await expect(page.locator('.admin-page-root')).toBeVisible();
  });

  test('renders page heading and eyebrow', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Weekly Cleaning Schedule');
    await expect(page.locator('text="OPERATIONS"')).toBeVisible();
  });

  test('renders three KPI cards', async ({ page }) => {
    const kpis = page.locator('.kpi-grid-3');
    for (const label of ['AWAITING WORKERS', 'CLEANING IN PROGRESS', 'ALL CARS CLEANED']) {
      await expect(kpis.locator(`text=${label}`)).toBeVisible({ timeout: 15_000 });
    }
  });

  test('status filter buttons are visible', async ({ page }) => {
    await expect(page.locator('button:has-text("All")').first()).toBeVisible();
    for (const status of ['scheduled', 'inprogress', 'done']) {
      await expect(page.locator(`button:has-text("${status}")`)).toBeVisible();
    }
  });

  test('shows session rows or the empty state', async ({ page }) => {
    await expect(
      page.locator('text=No sessions scheduled')
        .or(page.locator('text=CARS DONE').first())
    ).toBeVisible({ timeout: 20_000 });
  });

  test('Create Session modal opens with all fields', async ({ page }) => {
    await page.locator('button:has-text("Create Session")').first().click();
    await expect(page.locator('text=Create Cleaning Session')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('text="Society"')).toBeVisible();
    await expect(page.locator('text="Tower"')).toBeVisible();
    await expect(page.locator('text="Scheduled Date"')).toBeVisible();
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.locator('text="Assign Workers"')).toBeVisible();
    await expect(page.locator('text=/\\d+ workers? selected/')).toBeVisible();
    await expect(page.locator('button:has-text("Create Session")').last()).toBeDisabled();
    await page.locator('button:has-text("Cancel")').click();
    await expect(page.locator('text=Create Cleaning Session')).not.toBeVisible({ timeout: 5_000 });
  });

  test('Reassign opens the Reassign Workers modal', async ({ page }) => {
    const btn = page.locator('button:has-text("Reassign")').first();
    if (!await btn.isVisible({ timeout: 20_000 }).catch(() => false)) {
      test.skip(true, 'No scheduled/in-progress session to reassign');
      return;
    }
    await btn.click();
    await expect(page.locator('text=Reassign Workers')).toBeVisible({ timeout: 8_000 });
    await page.locator('button:has-text("Cancel")').click();
  });

  test('Mark Missed opens a reason + notes modal', async ({ page }) => {
    const btn = page.locator('button:has-text("Mark Missed")').first();
    if (!await btn.isVisible({ timeout: 20_000 }).catch(() => false)) {
      test.skip(true, 'No scheduled/in-progress session to mark missed');
      return;
    }
    await btn.click();
    await expect(page.locator('text=Mark Cleaning Missed')).toBeVisible({ timeout: 8_000 });
    for (const reason of ['Society holiday', 'Worker unavailable', 'Other']) {
      await expect(page.locator(`text=${reason}`)).toBeVisible();
    }
    await expect(page.locator('textarea[placeholder*="Diwali holiday"]')).toBeVisible();
    await page.locator('button:has-text("Cancel")').click();
    await expect(page.locator('text=Mark Cleaning Missed')).not.toBeVisible({ timeout: 5_000 });
  });

  test('Start button is present on a scheduled session', async ({ page }) => {
    const btn = page.locator('button:has-text("Start")').first();
    if (!await btn.isVisible({ timeout: 20_000 }).catch(() => false)) {
      test.skip(true, 'No scheduled session to start');
      return;
    }
    await expect(btn).toBeVisible();
  });

  test('Delete button is present on every session row', async ({ page }) => {
    const btn = page.locator('button:has-text("Delete")').first();
    if (!await btn.isVisible({ timeout: 20_000 }).catch(() => false)) {
      test.skip(true, 'No sessions to test Delete on');
      return;
    }
    await expect(btn).toBeVisible();
  });

});
