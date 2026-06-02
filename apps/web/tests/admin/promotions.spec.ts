import { test, expect } from '@playwright/test';

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

  test('opening Create Promo shows form fields', async ({ page }) => {
    await page.click('button:has-text("Create Promo")');
    await expect(page.locator('input[placeholder="SHINE10"]')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('input[type="number"]').first()).toBeVisible();
  });

  test('promo form has Generate button', async ({ page }) => {
    await page.click('button:has-text("Create Promo")');
    await expect(page.locator('button:has-text("Generate")')).toBeVisible({ timeout: 8_000 });
  });

  test('Generate button fills code input', async ({ page }) => {
    await page.click('button:has-text("Create Promo")');
    const codeInput = page.locator('input[placeholder="SHINE10"]');
    await expect(codeInput).toBeVisible({ timeout: 8_000 });
    await page.click('button:has-text("Generate")');
    await page.waitForTimeout(300);
    const value = await codeInput.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test('promo form closes via × button', async ({ page }) => {
    await page.click('button:has-text("Create Promo")');
    await expect(page.locator('input[placeholder="SHINE10"]')).toBeVisible({ timeout: 8_000 });
    // Close button is the × icon button next to the form heading
    await page.locator('button').filter({ has: page.locator('svg') }).first().click();
    await expect(page.locator('input[placeholder="SHINE10"]')).not.toBeVisible({ timeout: 5_000 });
  });

  test('discount type buttons show Flat ₹ and Percentage %', async ({ page }) => {
    await page.click('button:has-text("Create Promo")');
    await expect(page.locator('button:has-text("Flat ₹")')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('button:has-text("Percentage %")')).toBeVisible();
  });

  test('clicking Percentage % changes discount label', async ({ page }) => {
    await page.click('button:has-text("Create Promo")');
    await page.locator('button:has-text("Percentage %")').click();
    await expect(page.locator('text=Discount (%)')).toBeVisible({ timeout: 5_000 });
  });

  test('Create Promotion submit button is visible in form', async ({ page }) => {
    await page.click('button:has-text("Create Promo")');
    await expect(page.locator('button:has-text("Create Promotion")')).toBeVisible({ timeout: 8_000 });
  });

  test('existing promotions table renders when data exists', async ({ page }) => {
    const hasData = await page.locator('table tbody tr').first().isVisible({ timeout: 8_000 }).catch(() => false);
    if (!hasData) { test.skip(true, 'No promotions in database'); return; }
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });

});
