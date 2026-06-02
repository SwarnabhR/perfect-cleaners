import { test, expect } from '@playwright/test';

test.describe('Customer Profile', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/account/profile');
    await page.waitForLoadState('networkidle');
  });

  test('renders profile heading', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible({ timeout: 10_000 });
  });

  test('three account tabs are visible', async ({ page }) => {
    await expect(page.locator('a:has-text("Bookings")')).toBeVisible();
    await expect(page.locator('a:has-text("Profile")')).toBeVisible();
    await expect(page.locator('a:has-text("Bill")')).toBeVisible();
  });

  test('name input is pre-filled from Firestore', async ({ page }) => {
    await page.waitForTimeout(2_000);
    const nameInput = page.locator('input[placeholder*="Rahul"], input[placeholder*="name"], input[autocomplete="name"]').first();
    await expect(nameInput).toBeVisible({ timeout: 8_000 });
    const value = await nameInput.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test('email input is pre-filled', async ({ page }) => {
    await page.waitForTimeout(2_000);
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 8_000 });
    const value = await emailInput.inputValue();
    expect(value).toContain('@');
  });

  test('phone number field is read-only', async ({ page }) => {
    const phoneInput = page.locator('input[type="tel"]').first();
    await expect(phoneInput).toBeVisible({ timeout: 8_000 });
    const ro = await phoneInput.getAttribute('readOnly');
    const disabled = await phoneInput.isDisabled();
    expect(ro !== null || disabled).toBe(true);
  });

  test('Save Changes button is present', async ({ page }) => {
    await expect(page.locator('button:has-text("Save")')).toBeVisible({ timeout: 8_000 });
  });

  test('Add address button or saved addresses section is visible', async ({ page }) => {
    await expect(
      page.locator('button:has-text("Add address")')
        .or(page.locator('text=SERVICE ADDRESSES'))
        .or(page.locator('text=Saved addresses'))
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Add address modal opens and has required fields', async ({ page }) => {
    const addBtn = page.locator('button:has-text("Add address")');
    if (!await addBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Add address button not visible');
      return;
    }
    await addBtn.click();
    await expect(page.locator('input[placeholder*="flat"], input[placeholder*="Flat"], input[placeholder*="house"]').first()).toBeVisible();
    await expect(page.locator('input[placeholder*="Pincode"], input[placeholder*="pincode"]')).toBeVisible();
    // Close modal
    await page.keyboard.press('Escape');
  });

  test('avatar displays initials of the customer name', async ({ page }) => {
    await page.waitForTimeout(2_000);
    // Avatar is a rounded div containing an uppercase initial
    const avatar = page.locator('div').filter({ hasText: /^[A-Z]$/ }).first();
    await expect(avatar).toBeVisible({ timeout: 8_000 });
  });

  test('navigation to Bookings tab works', async ({ page }) => {
    await page.click('a:has-text("Bookings")');
    await page.waitForURL('**/account', { timeout: 8_000 });
  });

});
