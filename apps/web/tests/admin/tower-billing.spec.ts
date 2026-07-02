import { test, expect } from '../fixtures/admin';

test.describe('Admin Tower Billing', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/tower-billing');
    await expect(page.locator('.admin-page-root')).toBeVisible();
  });

  test('renders page heading and eyebrow', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Tower Pricing');
    await expect(page.locator('text="BILLING"')).toBeVisible();
  });

  test('search input is visible', async ({ page }) => {
    await expect(page.locator('input[placeholder="Search by society name or tower…"]')).toBeVisible();
  });

  test('table has correct columns when data is present', async ({ page }) => {
    const hasRows = await page.locator('tbody tr').first().isVisible({ timeout: 20_000 }).catch(() => false);
    if (!hasRows) { test.skip(true, 'No tower pricing configured'); return; }
    for (const h of ['Society', 'Tower', 'Monthly Fee', 'Schedule', 'Billing', 'Action']) {
      await expect(page.locator(`th:has-text("${h}")`)).toBeVisible();
    }
  });

  test('Add Pricing modal opens with all fields', async ({ page }) => {
    await expect(page.locator('button:has-text("Add Pricing")').first()).toBeVisible({ timeout: 15_000 });
    await page.locator('button:has-text("Add Pricing")').first().click();
    await expect(page.locator('text=Add Tower Pricing')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('input[placeholder="e.g., Uniworld City, Lodha Group"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Firebase ID"]')).toBeVisible();
    const towerInput = page.locator('input[placeholder="e.g., Tower A, Tower B, North Wing"]');
    await towerInput.scrollIntoViewIfNeeded();
    await expect(towerInput).toHaveCount(1);
    const feeInput = page.locator('input[placeholder="450"]');
    await feeInput.scrollIntoViewIfNeeded();
    await expect(feeInput).toHaveCount(1);
    for (const day of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']) {
      await expect(page.locator(`button:has-text("${day}")`)).toHaveCount(1);
    }
    const timeInput = page.locator('input[placeholder="9:00 AM"]');
    await timeInput.scrollIntoViewIfNeeded();
    await expect(timeInput).toHaveCount(1);
  });

  test('Add Pricing modal can be cancelled', async ({ page }) => {
    await expect(page.locator('button:has-text("Add Pricing")').first()).toBeVisible({ timeout: 15_000 });
    await page.locator('button:has-text("Add Pricing")').first().click();
    await expect(page.locator('text=Add Tower Pricing')).toBeVisible({ timeout: 8_000 });
    await page.locator('button:has-text("Cancel")').click();
    await expect(page.locator('text=Add Tower Pricing')).not.toBeVisible({ timeout: 5_000 });
  });

  test('Edit opens the modal pre-filled in edit mode', async ({ page }) => {
    const hasRows = await page.locator('tbody tr').first().isVisible({ timeout: 20_000 }).catch(() => false);
    if (!hasRows) { test.skip(true, 'No tower pricing configured'); return; }
    await page.locator('tbody tr').first().locator('button:has-text("Edit")').click();
    await expect(page.locator('text=Edit Tower Pricing')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('button:has-text("Save Changes")')).toBeVisible();
    await page.locator('button:has-text("Cancel")').click();
  });

});
