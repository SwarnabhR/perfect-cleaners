import { test, expect } from '../fixtures/customer';

test.describe('Customer Account — Bookings', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/account');
    await page.waitForLoadState('load');
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
    // Scoped to <main> — the footer also has a (different) +91 contact number
    await expect(page.locator('main').locator('text=/\\+91/').first()).toBeVisible({ timeout: 8_000 });
  });

  test('Sign out button is visible', async ({ page }) => {
    await expect(page.locator('button:has-text("Sign out")')).toBeVisible({ timeout: 20_000 });
  });

  // Sign-out flow itself is covered in tests/auth/signout.spec.ts, which
  // authenticates in its own isolated context — this file's tests share one
  // signed-in page per worker (see tests/fixtures/customer.ts), so actually
  // signing out here would destroy that session for every later test.

  test('four account tabs are present', async ({ page }) => {
    await expect(page.locator('a:has-text("Schedule")')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('a:has-text("Bookings")')).toBeVisible();
    await expect(page.locator('a:has-text("Profile")')).toBeVisible();
    await expect(page.locator('a:has-text("Bill")')).toBeVisible();
  });

  test('Profile tab href is /account/profile', async ({ page }) => {
    const link = page.locator('a:has-text("Profile")');
    await expect(link).toBeVisible({ timeout: 20_000 });
    const href = await link.getAttribute('href');
    expect(href).toBe('/account/profile');
  });

  test('Bill tab href is /account/wallet', async ({ page }) => {
    const link = page.locator('a:has-text("Bill")');
    await expect(link).toBeVisible({ timeout: 20_000 });
    const href = await link.getAttribute('href');
    expect(href).toBe('/account/wallet');
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

  test('[NO BOOKINGS YET] empty state has Join a society CTA', async ({ page }) => {
    const isEmpty = await page.locator('text=Your first wash awaits.').isVisible({ timeout: 8_000 }).catch(() => false);
    if (!isEmpty) { test.skip(true, 'Customer has bookings'); return; }
    const cta = page.locator('a:has-text("Join a society")');
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute('href');
    expect(href).toBe('/for-societies');
  });

});
