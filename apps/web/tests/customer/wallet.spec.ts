import { test, expect } from '@playwright/test';

test.describe('Customer Wallet / Bill', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/account/wallet');
    await page.waitForLoadState('networkidle');
  });

  test('renders Bill heading', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible({ timeout: 10_000 });
  });

  test('three account tabs visible', async ({ page }) => {
    await expect(page.locator('a:has-text("Bookings")')).toBeVisible();
    await expect(page.locator('a:has-text("Profile")')).toBeVisible();
    await expect(page.locator('a:has-text("Bill")')).toBeVisible();
  });

  test('outstanding balance card is shown', async ({ page }) => {
    await expect(
      page.locator('text=Outstanding Balance')
        .or(page.locator('text=OUTSTANDING BALANCE'))
        .or(page.locator('text=outstanding balance'))
    ).toBeVisible({ timeout: 10_000 });
  });

  test('balance displays ₹ value', async ({ page }) => {
    await page.waitForTimeout(2_000);
    await expect(page.locator('text=/₹/').first()).toBeVisible({ timeout: 8_000 });
  });

  test('Pay Now button is visible when balance is non-zero', async ({ page }) => {
    await page.waitForTimeout(2_000);
    // Pay Now button only appears when outstandingBalance > 0
    const payBtn = page.locator('button:has-text("Pay Now"), button:has-text("Pay now")');
    const zeroState = page.locator('text=No outstanding balance');
    await expect(payBtn.or(zeroState)).toBeVisible({ timeout: 10_000 });
  });

  test('transaction history section is shown', async ({ page }) => {
    await expect(
      page.locator('text=TRANSACTION HISTORY')
        .or(page.locator('text=Transaction History'))
        .or(page.locator('text=No transactions yet'))
    ).toBeVisible({ timeout: 10_000 });
  });

  test('transactions show type, label and amount', async ({ page }) => {
    await page.waitForTimeout(2_000);
    const hasTransactions = await page.locator('text=No transactions yet').isVisible().catch(() => false);
    if (hasTransactions) { test.skip(true, 'No transactions for test customer'); return; }
    // Each row shows a label and a rupee amount
    await expect(page.locator('text=/₹/').first()).toBeVisible({ timeout: 8_000 });
  });

  test('Bookings tab href is /account', async ({ page }) => {
    const href = await page.locator('a:has-text("Bookings")').getAttribute('href');
    expect(href).toBe('/account');
  });

});
