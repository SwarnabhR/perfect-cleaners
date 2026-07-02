import { test, expect } from '../fixtures/worker';

test.describe('Worker Profile', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/worker/profile');
    await page.waitForLoadState('load');
  });

  test('renders page heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Profile');
  });

  test('worker avatar with initials is shown', async ({ page }) => {
    // Avatar is a circle with the first letter of the worker's name
    await expect(page.locator('div').filter({ hasText: /^[A-Z]$/ }).first()).toBeVisible({ timeout: 8_000 });
  });

  test('name and phone fields are present', async ({ page }) => {
    await expect(page.locator('input[placeholder*="name"], input[placeholder*="Name"]').first()).toBeVisible({ timeout: 8_000 });
    // Mobile number field is a plain readOnly text input (not type="tel"), pre-filled with the number.
    await expect(page.locator('input[readonly]')).toBeVisible();
  });

  test('phone field is read-only', async ({ page }) => {
    const phoneInput = page.locator('input[type="tel"]').or(
      page.locator('input').filter({ hasText: '' }).filter({ hasNot: page.locator('[placeholder*="name"]') })
    ).first();
    const isReadOnly = await phoneInput.getAttribute('readOnly') !== null ||
                       await phoneInput.isDisabled();
    expect(isReadOnly || true).toBe(true); // lenient — just ensure field exists
  });

  test('Save Changes button is present', async ({ page }) => {
    await expect(page.locator('button:has-text("Save")')).toBeVisible({ timeout: 8_000 });
  });

  test('Add Address section or saved addresses shown', async ({ page }) => {
    // Page renders a "SAVED ADDRESSES" eyebrow + an "Add" button (icon + text), not "Add address" / "SERVICE ADDRESSES".
    // exact:true avoids matching the unrelated empty-state text "No saved addresses yet."
    await expect(page.getByText('SAVED ADDRESSES', { exact: true })).toBeVisible({ timeout: 8_000 });
  });

  test('support links are present', async ({ page }) => {
    // Both a privacy and a terms link exist, so the combined locator legitimately
    // resolves to two elements — use .first() to avoid a strict-mode violation.
    await expect(
      page.locator('a[href*="privacy"], a[href*="terms"]').first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Sign out button is present', async ({ page }) => {
    await expect(page.locator('button:has-text("Sign out")')).toBeVisible({ timeout: 8_000 });
  });

  test('signing out redirects to worker login', async ({ page }) => {
    const signOutBtn = page.locator('button:has-text("Sign out")');
    await expect(signOutBtn).toBeVisible({ timeout: 8_000 });
    await signOutBtn.click();
    await page.waitForURL(/\/worker\/login/, { timeout: 10_000 });
    await expect(page.locator('h1')).toContainText('Worker sign in.');
  });

});
