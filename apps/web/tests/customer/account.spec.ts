import { test, expect } from '@playwright/test';

test.describe('Customer Account — Bookings', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/account');
    await page.waitForLoadState('networkidle');
  });

  test('unauthenticated access redirects to sign-in', async ({ browser }) => {
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto('/account');
    await page.waitForURL(/\/signin/, { timeout: 10_000 });
    await expect(page.locator('h1')).toContainText('Sign in or create');
    await ctx.close();
  });

  test('renders personalised greeting', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible({ timeout: 10_000 });
    const text = await page.locator('h1').textContent();
    expect(text).toMatch(/Hi,\s+\w+\.|Your account\./);
  });

  test('shows formatted phone number', async ({ page }) => {
    await expect(page.locator('text=/\\+91/')).toBeVisible({ timeout: 8_000 });
  });

  test('Book a service CTA is visible', async ({ page }) => {
    await expect(page.locator('a:has-text("Book a service")')).toBeVisible();
  });

  test('Book a service links to /book', async ({ page }) => {
    const href = await page.locator('a:has-text("Book a service")').getAttribute('href');
    expect(href).toBe('/book');
  });

  test('Sign out button is visible', async ({ page }) => {
    await expect(page.locator('button:has-text("Sign out")')).toBeVisible();
  });

  test('sign out redirects to home', async ({ page }) => {
    await page.click('button:has-text("Sign out")');
    await page.waitForURL('**/', { timeout: 10_000 });
    expect(page.url()).toMatch(/\/$/);
  });

  test('three account tabs are present', async ({ page }) => {
    await expect(page.locator('a:has-text("Bookings")')).toBeVisible();
    await expect(page.locator('a:has-text("Profile")')).toBeVisible();
    await expect(page.locator('a:has-text("Bill")')).toBeVisible();
  });

  test('Profile tab navigates to /account/profile', async ({ page }) => {
    await page.click('a:has-text("Profile")');
    await page.waitForURL('**/account/profile', { timeout: 8_000 });
  });

  test('Bill tab navigates to /account/wallet', async ({ page }) => {
    await page.goto('/account');
    await page.click('a:has-text("Bill")');
    await page.waitForURL('**/account/wallet', { timeout: 8_000 });
  });

  test('shows booking cards or empty state', async ({ page }) => {
    await expect(
      page.locator('text=Your first wash awaits.')
        .or(page.locator('text=[NO BOOKINGS YET]'))
        .or(page.locator('div').filter({ has: page.locator('text=Date') }).first())
    ).toBeVisible({ timeout: 12_000 });
  });

  test('booking cards show service, date, total, status', async ({ page }) => {
    const hasBookings = await page.locator('text=Date').first().isVisible({ timeout: 8_000 }).catch(() => false);
    if (!hasBookings) { test.skip(true, 'No bookings for test customer'); return; }
    await expect(page.locator('text=Date').first()).toBeVisible();
    await expect(page.locator('text=Location').first()).toBeVisible();
    await expect(page.locator('text=Total').first()).toBeVisible();
  });

  test('pending booking shows Cancel booking button', async ({ page }) => {
    const cancelBtn = page.locator('button:has-text("Cancel booking")').first();
    const hasCancellable = await cancelBtn.isVisible({ timeout: 8_000 }).catch(() => false);
    if (!hasCancellable) { test.skip(true, 'No cancellable bookings for test customer'); return; }
    // First click enters confirm state
    await cancelBtn.click();
    await expect(page.locator('button:has-text("Tap again to confirm")')).toBeVisible();
    // Click "Never mind" to abort
    await page.click('button:has-text("Never mind")');
    await expect(page.locator('button:has-text("Cancel booking")')).toBeVisible();
  });

  test('[NO BOOKINGS YET] empty state has Book now CTA', async ({ page }) => {
    const isEmpty = await page.locator('text=Your first wash awaits.').isVisible({ timeout: 8_000 }).catch(() => false);
    if (!isEmpty) { test.skip(true, 'Customer has bookings'); return; }
    await expect(page.locator('a:has-text("Book now")')).toBeVisible();
    const href = await page.locator('a:has-text("Book now")').getAttribute('href');
    expect(href).toBe('/book');
  });

});
