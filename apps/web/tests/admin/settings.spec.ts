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
    await expect(
      page.locator('input[placeholder*="Perfect Cleaners"]')
        .or(page.locator('input[placeholder*="business"], input[placeholder*="Business"]'))
        .first()
    ).toBeVisible();
  });

  test('notifications toggles section is present', async ({ page }) => {
    await expect(page.locator('text=NOTIFICATIONS').or(page.locator('text=Notifications'))).toBeVisible();
  });

  test('integrations section is present', async ({ page }) => {
    await expect(page.locator('text=INTEGRATIONS').or(page.locator('text=Integrations'))).toBeVisible();
  });

  test('Save Changes button is present', async ({ page }) => {
    await expect(page.locator('button:has-text("Save")')).toBeVisible();
  });

  test('GST number field is present', async ({ page }) => {
    await expect(
      page.locator('input[placeholder*="GST"], input[placeholder*="gst"]')
    ).toBeVisible();
  });

  test('Razorpay integration toggle is present', async ({ page }) => {
    await expect(page.locator('text=Razorpay')).toBeVisible();
  });

});
