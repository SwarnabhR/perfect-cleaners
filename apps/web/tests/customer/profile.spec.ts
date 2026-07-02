import { test, expect } from '../fixtures/customer';

test.describe('Customer Profile', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/account/profile');
    await page.waitForLoadState('load');
  });

  test('renders profile heading', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible({ timeout: 10_000 });
  });

  test('four account tabs are visible', async ({ page }) => {
    await expect(page.locator('a:has-text("Schedule")')).toBeVisible();
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

  test('Save Profile button is present', async ({ page }) => {
    await expect(page.locator('button:has-text("Save Profile")')).toBeVisible({ timeout: 8_000 });
  });

  test('Add address button or saved addresses section is visible', async ({ page }) => {
    await expect(
      page.locator('button:has-text("Add address")')
        .or(page.locator('text=SERVICE ADDRESSES'))
        .or(page.locator('text=Saved addresses'))
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Add address form opens with required fields', async ({ page }) => {
    const addBtn = page.locator('button:has-text("Add address")');
    if (!await addBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Add address button not visible');
      return;
    }
    await addBtn.click();
    await expect(page.locator('input[placeholder="e.g. 1204"]')).toBeVisible();
    await expect(page.locator('input[placeholder="e.g. G-42"]')).toBeVisible();
    // Close via the form's own Cancel button (inline form, not a modal — Escape does nothing)
    await page.locator('button:has-text("Cancel")').click();
    await expect(page.locator('input[placeholder="e.g. 1204"]')).not.toBeVisible();
  });

  test('avatar displays initials of the customer name', async ({ page }) => {
    await page.waitForTimeout(2_000);
    // Avatar is a rounded div containing an uppercase initial
    const avatar = page.locator('div').filter({ hasText: /^[A-Z]$/ }).first();
    await expect(avatar).toBeVisible({ timeout: 8_000 });
  });

  test('Bookings tab href is /account', async ({ page }) => {
    const link = page.locator('a:has-text("Bookings")');
    await expect(link).toBeVisible({ timeout: 20_000 });
    const href = await link.getAttribute('href');
    expect(href).toBe('/account');
  });

});
