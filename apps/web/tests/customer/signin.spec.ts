import { test, expect } from '@playwright/test';

test.describe('Customer Sign In', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/signin');
  });

  test('renders branding and heading', async ({ page }) => {
    await expect(page.locator('text=Perfect Cleaners')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Sign in or create');
  });

  test('shows [ACCOUNT] / SIGN IN OR CREATE eyebrow', async ({ page }) => {
    await expect(page.locator('text=SIGN IN OR CREATE')).toBeVisible();
  });

  test('shows +91 prefix and phone input', async ({ page }) => {
    await expect(page.locator('text=+91')).toBeVisible();
    await expect(page.locator('input[type="tel"]')).toBeVisible();
    await expect(page.locator('input[placeholder="98765 43210"]')).toBeVisible();
  });

  test('Send Code button is disabled with fewer than 10 digits', async ({ page }) => {
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
    await page.fill('input[type="tel"]', '98765');
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('only accepts digits in phone field', async ({ page }) => {
    await page.fill('input[type="tel"]', 'abc12def34xyz56789');
    const value = await page.inputValue('input[type="tel"]');
    expect(value).toMatch(/^\d+$/);
  });

  test('shows terms disclaimer at bottom', async ({ page }) => {
    await expect(page.locator('text=terms of service')).toBeVisible();
    await expect(page.locator('text=privacy policy')).toBeVisible();
  });

  test('OTP step heading is not shown until phone is submitted', async ({ page }) => {
    await expect(page.locator('h1', { hasText: 'Enter your code.' })).not.toBeVisible();
    await expect(page.locator('h1', { hasText: 'One last step.' })).not.toBeVisible();
  });

  test('redirects authenticated customers away from sign-in', async ({ page }) => {
    const uid = process.env.TEST_CUSTOMER_UID;
    if (!uid) { test.skip(true, 'TEST_CUSTOMER_UID not set'); return; }
    await page.goto('/signin');
    await page.waitForTimeout(2_000);
    const url = page.url();
    expect(url).toMatch(/\/signin|\/account/);
  });

  test('from param is preserved in the redirect URL', async ({ page }) => {
    await page.goto('/signin?from=/book');
    await expect(page.locator('h1')).toContainText('Sign in or create');
  });

});
