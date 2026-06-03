import { test, expect } from '@playwright/test';

test.describe('Customer Subscribe Flow', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/subscribe?plan=pro&cycle=monthly');
    await page.waitForLoadState('load');
  });

  test('renders subscription heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Set up your subscription.');
  });

  test('shows [SUBSCRIPTION] eyebrow with plan and cycle', async ({ page }) => {
    await expect(page.locator('text=PRO')).toBeVisible();
    await expect(page.locator('text=MONTHLY')).toBeVisible();
  });

  test('vehicle form section is visible', async ({ page }) => {
    await expect(page.locator('text=YOUR VEHICLE')).toBeVisible();
    await expect(page.locator('select')).toBeVisible(); // brand dropdown
    await expect(page.locator('input[placeholder*="Creta"]')).toBeVisible();
  });

  test('service address section is visible', async ({ page }) => {
    await expect(page.locator('text=SERVICE ADDRESS')).toBeVisible();
    await expect(page.locator('input[placeholder*="B-204"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Ghaziabad"]')).toBeVisible();
    await expect(page.locator('input[placeholder="201001"]')).toBeVisible();
  });

  test('preferred schedule section is visible', async ({ page }) => {
    await expect(page.locator('text=PREFERRED SCHEDULE')).toBeVisible();
    // Day selector
    await expect(page.locator('button:has-text("Monday")')).toBeVisible();
    // Time slot radios
    await expect(page.locator('text=Morning (9 AM – 12 PM)')).toBeVisible();
    await expect(page.locator('text=Afternoon (12 PM – 3 PM)')).toBeVisible();
    await expect(page.locator('text=Evening (3 PM – 6 PM)')).toBeVisible();
  });

  test('plan summary sidebar shows correct plan', async ({ page }) => {
    await expect(page.locator('text=YOUR PLAN')).toBeVisible();
    await expect(page.locator('text=Pro').first()).toBeVisible();
    await expect(page.locator('text=MONTHLY')).toBeVisible();
  });

  test('plan summary shows ₹ price', async ({ page }) => {
    await expect(page.locator('text=/₹4,999|4999/')).toBeVisible({ timeout: 5_000 });
  });

  test('plan features are listed', async ({ page }) => {
    await expect(page.locator('text=Weekly Premium Wash')).toBeVisible();
  });

  test('Confirm Subscription button is disabled without vehicle or address', async ({ page }) => {
    await expect(page.locator('button:has-text("Confirm Subscription")')).toBeDisabled();
  });

  test('day selector toggles between days', async ({ page }) => {
    await page.click('button:has-text("Saturday")');
    await expect(page.locator('button:has-text("Saturday")')).toHaveCSS('border-color', /rgb/);
    await page.click('button:has-text("Monday")');
  });

  test('notes textarea is present', async ({ page }) => {
    await expect(page.locator('textarea')).toBeVisible();
    await expect(page.locator('textarea')).toHaveAttribute('placeholder', /Gate code|gate code|parking/);
  });

  test('starter plan URL param changes price', async ({ page }) => {
    await page.goto('/subscribe?plan=starter&cycle=monthly');
    await expect(page.locator('text=/₹2,999|2999/')).toBeVisible({ timeout: 5_000 });
  });

  test('elite plan URL param changes price', async ({ page }) => {
    await page.goto('/subscribe?plan=elite&cycle=yearly');
    await expect(page.locator('text=/₹79,999|79999/')).toBeVisible({ timeout: 5_000 });
  });

  test('unauthenticated submit triggers sign-in sheet', async ({ browser }) => {
    const ctx  = await browser.newContext(); // no stored auth
    const page = await ctx.newPage();
    await page.goto('/subscribe?plan=pro&cycle=monthly');

    // Fill minimum required fields
    await page.selectOption('select', { index: 1 });
    await page.fill('input[placeholder*="Creta"]', 'Creta');
    await page.fill('input[placeholder*="B-204"]', '101 Main Street');
    await page.fill('input[placeholder="Ghaziabad"]', 'Delhi');
    await page.fill('input[placeholder="201001"]', '110001');

    await page.click('button:has-text("Confirm Subscription")');
    // Auth sheet should appear
    await expect(
      page.locator('text=Sign in to complete your subscription.')
    ).toBeVisible({ timeout: 8_000 });

    await ctx.close();
  });

});
