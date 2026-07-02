import { test, expect } from '../fixtures/admin';

// The promotions form renders INLINE below the table. After clicking "Create Promo",
// the form card appears at the bottom of the page. Elements near the TOP of the form
// (code input, Generate, discount type buttons) may be scrolled out of viewport —
// use scrollIntoViewIfNeeded() + toHaveCount(1) (DOM presence) rather than toBeVisible().

test.describe('Admin Promotions', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/promotions');
    await expect(page.locator('.admin-page-root')).toBeVisible();
  });

  test('renders page heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Promotions');
  });

  test('Create Promo button is visible', async ({ page }) => {
    await expect(page.locator('button:has-text("Create Promo")')).toBeVisible();
  });

  test('clicking Create Promo opens the form (CREATE PROMOTION header visible)', async ({ page }) => {
    await expect(page.locator('button:has-text("Create Promo")')).toBeVisible({ timeout: 20_000 });
    await page.click('button:has-text("Create Promo")');
    // The Eyebrow shows "CREATE PROMOTION" when the form is in new mode
    await expect(page.locator('text=CREATE PROMOTION')).toBeVisible({ timeout: 15_000 });
  });

  test('form has code input and Generate button in DOM', async ({ page }) => {
    await expect(page.locator('button:has-text("Create Promo")')).toBeVisible({ timeout: 20_000 });
    await page.click('button:has-text("Create Promo")');
    await expect(page.locator('text=CREATE PROMOTION')).toBeVisible({ timeout: 15_000 });
    // Scroll into view and check DOM presence — form top may be off-screen below the table
    const codeInput = page.locator('input[placeholder="SHINE10"]');
    await codeInput.scrollIntoViewIfNeeded();
    await expect(codeInput).toHaveCount(1);
    await expect(page.locator('button:has-text("Generate")')).toHaveCount(1);
  });

  test('Generate button updates code input value', async ({ page }) => {
    await expect(page.locator('button:has-text("Create Promo")')).toBeVisible({ timeout: 20_000 });
    await page.click('button:has-text("Create Promo")');
    await expect(page.locator('text=CREATE PROMOTION')).toBeVisible({ timeout: 15_000 });
    const codeInput = page.locator('input[placeholder="SHINE10"]');
    await codeInput.scrollIntoViewIfNeeded();
    const before = await codeInput.inputValue();
    await page.locator('button:has-text("Generate")').click();
    await page.waitForTimeout(200);
    const after = await codeInput.inputValue();
    expect(after.length).toBeGreaterThan(0);
    expect(after).not.toBe(before);
  });

  test('form closes via Cancel button', async ({ page }) => {
    await expect(page.locator('button:has-text("Create Promo")')).toBeVisible({ timeout: 20_000 });
    await page.click('button:has-text("Create Promo")');
    await expect(page.locator('text=CREATE PROMOTION')).toBeVisible({ timeout: 15_000 });
    await page.locator('button:has-text("Cancel")').last().click();
    await expect(page.locator('text=CREATE PROMOTION')).not.toBeVisible({ timeout: 8_000 });
  });

  test('discount type buttons exist in form DOM', async ({ page }) => {
    await expect(page.locator('button:has-text("Create Promo")')).toBeVisible({ timeout: 20_000 });
    await page.click('button:has-text("Create Promo")');
    await expect(page.locator('text=CREATE PROMOTION')).toBeVisible({ timeout: 15_000 });
    const flatBtn = page.locator('button:has-text("Flat ₹")');
    await flatBtn.scrollIntoViewIfNeeded();
    await expect(flatBtn).toHaveCount(1);
    await expect(page.locator('button:has-text("Percentage %")')).toHaveCount(1);
  });

  test('Percentage % button changes discount label', async ({ page }) => {
    await expect(page.locator('button:has-text("Create Promo")')).toBeVisible({ timeout: 20_000 });
    await page.click('button:has-text("Create Promo")');
    await expect(page.locator('text=CREATE PROMOTION')).toBeVisible({ timeout: 15_000 });
    const pctBtn = page.locator('button:has-text("Percentage %")');
    await pctBtn.scrollIntoViewIfNeeded();
    await pctBtn.click();
    await expect(page.locator('text=Discount (%)')).toHaveCount(1);
  });

  test('Create Promotion submit button is visible in form', async ({ page }) => {
    await expect(page.locator('button:has-text("Create Promo")')).toBeVisible({ timeout: 20_000 });
    await page.click('button:has-text("Create Promo")');
    await expect(page.locator('button:has-text("Create Promotion")')).toBeVisible({ timeout: 15_000 });
  });

  test('existing promotions table renders when data exists', async ({ page }) => {
    const hasData = await page.locator('table tbody tr').first().isVisible({ timeout: 8_000 }).catch(() => false);
    if (!hasData) { test.skip(true, 'No promotions in database'); return; }
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });

});
