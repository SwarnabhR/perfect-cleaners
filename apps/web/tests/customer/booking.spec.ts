import { test, expect } from '@playwright/test';

test.describe('Customer Booking Flow', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/book');
    await page.waitForLoadState('networkidle');
  });

  // ── Step 1: Service selection ────────────────────────────────────────────

  test('renders booking page with all 6 services', async ({ page }) => {
    const services = [
      'Exterior Wash', 'Premium Wash', 'Interior Detail',
      'Full Detail', 'Ceramic Coating', 'Paint Protection',
    ];
    for (const s of services) {
      await expect(page.locator(`button:has-text("${s}")`)).toBeVisible({ timeout: 10_000 });
    }
  });

  test('[01] Select Service label is shown', async ({ page }) => {
    await expect(page.locator('text=Select Service')).toBeVisible();
  });

  test('clicking a service card selects it', async ({ page }) => {
    await page.click('button:has-text("Full Detail")');
    const btn = page.locator('button:has-text("Full Detail")');
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  test('order summary updates when service changes', async ({ page }) => {
    await page.click('button:has-text("Ceramic Coating")');
    await expect(page.locator('text=Ceramic Coating').last()).toBeVisible();
    await expect(page.locator('text=₹15,000').or(page.locator('text=15,000'))).toBeVisible();
  });

  // ── Step 2: Date & Time ──────────────────────────────────────────────────

  test('[02] Select Date & Time label is shown', async ({ page }) => {
    await expect(page.locator('text=Select Date')).toBeVisible();
  });

  test('quick-pick date pills are shown (next 5 days)', async ({ page }) => {
    const datePills = page.locator('button[aria-pressed]');
    await expect(datePills.first()).toBeVisible();
    const count = await datePills.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('time slots are shown', async ({ page }) => {
    const times = ['09:00 AM', '11:00 AM', '01:00 PM', '03:00 PM', '05:00 PM'];
    for (const t of times) {
      await expect(page.locator(`button:has-text("${t}")`)).toBeVisible();
    }
  });

  test('clicking a time slot selects it', async ({ page }) => {
    await page.click('button:has-text("11:00 AM")');
    await expect(page.locator('button:has-text("11:00 AM")')).toHaveAttribute('aria-pressed', 'true');
  });

  test('calendar picker icon opens a date picker', async ({ page }) => {
    await page.click('button[aria-label="Open date picker"]');
    await expect(page.locator('button[aria-label="Previous month"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Next month"]')).toBeVisible();
    // Close it
    await page.keyboard.press('Escape');
  });

  // ── Step 3: Location & Vehicle ───────────────────────────────────────────

  test('[03] Location & Vehicle label is shown', async ({ page }) => {
    await expect(page.locator('text=Location')).toBeVisible();
  });

  test('city dropdown is present with Delhi NCR cities', async ({ page }) => {
    // CustomSelect for city
    await expect(page.locator('text=Delhi').first()).toBeVisible();
  });

  test('address and pincode fields are present', async ({ page }) => {
    await expect(page.locator('input[placeholder*="address"], input[placeholder*="flat"]').first()).toBeVisible();
    await expect(page.locator('input[placeholder="Pincode"]')).toBeVisible();
  });

  test('vehicle brand dropdown is present', async ({ page }) => {
    await expect(page.locator('text=Vehicle brand')).toBeVisible();
  });

  test('model and number plate fields are present', async ({ page }) => {
    await expect(page.locator('input[placeholder*="Creta"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="DL 01"]')).toBeVisible();
  });

  test('pincode accepts only 6 digits', async ({ page }) => {
    await page.fill('input[placeholder="Pincode"]', 'abc123456');
    const value = await page.inputValue('input[placeholder="Pincode"]');
    expect(value).toMatch(/^\d{0,6}$/);
  });

  // ── Step 4: Contact ──────────────────────────────────────────────────────

  test('[04] Your Details label is shown', async ({ page }) => {
    await expect(page.locator('text=Your Details')).toBeVisible();
  });

  test('name and phone inputs are present', async ({ page }) => {
    await expect(page.locator('input[placeholder="Full name"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Mobile number"]')).toBeVisible();
  });

  test('name and phone are pre-filled when signed in', async ({ page }) => {
    await page.waitForTimeout(2_000);
    const name  = await page.inputValue('input[placeholder="Full name"]');
    const phone = await page.inputValue('input[placeholder="Mobile number"]');
    expect(name.length).toBeGreaterThan(0);
    expect(phone.length).toBeGreaterThan(0);
  });

  // ── Step 5: Promo code ───────────────────────────────────────────────────

  test('[05] Promo Code section is shown', async ({ page }) => {
    await expect(page.locator('text=Promo Code')).toBeVisible();
  });

  test('promo input and Apply button are present', async ({ page }) => {
    await expect(page.locator('input[placeholder="Enter promo code"]')).toBeVisible();
    await expect(page.locator('button:has-text("Apply")')).toBeVisible();
  });

  test('Apply button is disabled with empty promo input', async ({ page }) => {
    await expect(page.locator('button:has-text("Apply")')).toBeDisabled();
  });

  test('invalid promo code shows error', async ({ page }) => {
    await page.fill('input[placeholder="Enter promo code"]', 'INVALIDXYZ');
    await page.click('button:has-text("Apply")');
    await expect(page.locator('text=Promo code not found.')).toBeVisible({ timeout: 8_000 });
  });

  test('promo input converts to uppercase', async ({ page }) => {
    await page.fill('input[placeholder="Enter promo code"]', 'summer20');
    const value = await page.inputValue('input[placeholder="Enter promo code"]');
    expect(value).toBe('SUMMER20');
  });

  // ── Terms + Submit ───────────────────────────────────────────────────────

  test('terms checkbox and Confirm Booking button are present', async ({ page }) => {
    await expect(page.locator('text=Terms of Service')).toBeVisible();
    await expect(page.locator('button:has-text("Confirm Booking")')).toBeVisible();
  });

  test('Confirm Booking is disabled until terms are accepted', async ({ page }) => {
    await expect(page.locator('button:has-text("Confirm Booking")')).toBeDisabled();
  });

  test('Confirm Booking enables after checking terms', async ({ page }) => {
    // The checkbox has opacity:0 so we need force:true to click it
    await page.click('input[type="checkbox"]', { force: true });
    await expect(page.locator('button:has-text("Confirm Booking")')).not.toBeDisabled({ timeout: 5_000 });
  });

  test('submitting with missing fields shows validation errors', async ({ page }) => {
    await page.click('input[type="checkbox"]', { force: true });
    await page.click('button:has-text("Confirm Booking")');
    await expect(
      page.locator('text=Address is required.')
        .or(page.locator('text=Vehicle model is required.'))
        .or(page.locator('text=required'))
    ).toBeVisible({ timeout: 8_000 });
  });

  // ── Order summary ────────────────────────────────────────────────────────

  test('order summary sidebar shows base price, GST, platform fee', async ({ page }) => {
    await expect(page.locator('text=ORDER SUMMARY')).toBeVisible();
    await expect(page.locator('text=Base price')).toBeVisible();
    await expect(page.locator('text=GST (18%)')).toBeVisible();
    await expect(page.locator('text=Platform fee')).toBeVisible();
    await expect(page.locator('text=Total')).toBeVisible();
  });

  // ── Deep link from plans ─────────────────────────────────────────────────

  test('?plan=pro param pre-selects Premium Wash', async ({ page }) => {
    await page.goto('/book?plan=pro&cycle=monthly');
    await expect(page.locator('button[aria-pressed="true"]:has-text("Premium Wash")')).toBeVisible({ timeout: 8_000 });
  });

  test('subscription banner shown when arriving from plans', async ({ page }) => {
    await page.goto('/book?plan=elite&cycle=monthly');
    await expect(page.locator('text=subscription')).toBeVisible({ timeout: 8_000 });
  });

});
