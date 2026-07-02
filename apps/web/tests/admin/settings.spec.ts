import { test, expect } from '../fixtures/admin';

test.describe('Admin Settings', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('.admin-page-root')).toBeVisible();
  });

  test('renders page heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Settings');
  });

  test('business info section is visible', async ({ page }) => {
    await expect(page.locator('text=BUSINESS INFO').or(page.locator('text=Business Info'))).toBeVisible();
  });

  test('business name input is present', async ({ page }) => {
    // The business-info fields have no placeholder text (they're pre-filled
    // from Firestore/defaults) — locate by the field's own <label> sibling.
    await expect(page.locator('label:has-text("Business Name") + input')).toBeVisible();
  });

  test('notifications toggles section is present', async ({ page }) => {
    // The section eyebrow reads "NOTIFICATION PREFERENCES", not "NOTIFICATIONS".
    await expect(page.locator('text=NOTIFICATION PREFERENCES')).toBeVisible();
  });

  test('integrations section is present', async ({ page }) => {
    await expect(page.locator('text=INTEGRATIONS').or(page.locator('text=Integrations'))).toBeVisible();
  });

  test('Save Changes button is present', async ({ page }) => {
    await expect(page.locator('button:has-text("Save")')).toBeVisible();
  });

  test('GST number field is present', async ({ page }) => {
    // No placeholder attribute on this field — locate by its <label> sibling.
    await expect(page.locator('label:has-text("GST Number") + input')).toBeVisible();
  });

  test('Razorpay integration toggle is present', async ({ page }) => {
    await expect(page.locator('text=Razorpay')).toBeVisible();
  });

});
