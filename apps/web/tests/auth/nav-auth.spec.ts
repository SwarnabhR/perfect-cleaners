/**
 * Nav bar authentication state tests.
 * Verifies that the marketing Nav shows the correct UI depending on
 * whether the visitor is signed in or not.
 */
import { test, expect } from '@playwright/test';
import path from 'path';

const CUSTOMER_AUTH = path.join(__dirname, '../.auth/customer.json');

// ── Unauthenticated nav ───────────────────────────────────────────────────────

test.describe('Nav — unauthenticated', () => {
  // Run all tests in this group without any stored auth
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForLoadState('networkidle');
  });

  test('shows "Sign in" link on desktop', async ({ page }) => {
    const signInLink = page.locator('nav a:has-text("Sign in")');
    await expect(signInLink).toBeVisible();
    const href = await signInLink.getAttribute('href');
    expect(href).toBe('/signin');
  });

  test('"Sign in" link navigates to /signin', async ({ page }) => {
    await page.click('nav a:has-text("Sign in")');
    await page.waitForURL('**/signin', { timeout: 8_000 });
    await expect(page.locator('h1')).toContainText('Sign in or create');
  });

  test('does NOT show account avatar when unauthenticated', async ({ page }) => {
    await expect(page.locator('a[aria-label="My account"]')).not.toBeVisible();
  });

  test('"Book Now" CTA is visible in desktop nav', async ({ page }) => {
    const bookNow = page.locator('.pc-nav-desktop a[href="/book"]').first();
    await expect(bookNow).toBeVisible();
  });

  test('mobile hamburger opens drawer with "Sign In / Sign Up"', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.click('button[aria-label="Open navigation"]');
    await expect(page.locator('text=Sign In / Sign Up')).toBeVisible({ timeout: 5_000 });
    const href = await page.locator('a:has-text("Sign In / Sign Up")').getAttribute('href');
    expect(href).toBe('/signin');
  });

  test('mobile drawer contains all nav links', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.click('button[aria-label="Open navigation"]');
    for (const label of ['Home', 'Services', 'Plans', 'About', 'Contact']) {
      await expect(page.locator(`#mobile-nav-drawer a:has-text("${label}")`)).toBeVisible();
    }
  });

  test('Escape key closes mobile drawer', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.click('button[aria-label="Open navigation"]');
    await expect(page.locator('text=Sign In / Sign Up')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('text=Sign In / Sign Up')).not.toBeVisible({ timeout: 3_000 });
  });

  test('nav links navigate to correct marketing pages', async ({ page }) => {
    const links: Array<[string, RegExp]> = [
      ['Services', /\/services/],
      ['Plans',    /\/plans/],
      ['About',    /\/about/],
      ['Contact',  /\/contact/],
    ];
    for (const [label, url] of links) {
      await page.goto('/');
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.click(`.pc-nav-desktop a:has-text("${label}")`);
      await page.waitForURL(url, { timeout: 8_000 });
    }
  });
});

// ── Authenticated nav ─────────────────────────────────────────────────────────

test.describe('Nav — authenticated customer', () => {
  test.use({ storageState: CUSTOMER_AUTH });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForLoadState('networkidle');
  });

  test('shows account avatar instead of "Sign in" link', async ({ page }) => {
    await page.waitForTimeout(2_000); // let auth state propagate
    await expect(page.locator('a[aria-label="My account"]')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('nav a:has-text("Sign in")')).not.toBeVisible();
  });

  test('account avatar links to /account', async ({ page }) => {
    await page.waitForTimeout(2_000);
    const avatarLink = page.locator('a[aria-label="My account"]');
    await expect(avatarLink).toBeVisible({ timeout: 8_000 });
    const href = await avatarLink.getAttribute('href');
    expect(href).toBe('/account');
  });

  test('avatar displays customer initials', async ({ page }) => {
    await page.waitForTimeout(2_000);
    const avatar = page.locator('a[aria-label="My account"]');
    await expect(avatar).toBeVisible({ timeout: 8_000 });
    const text = await avatar.textContent();
    expect(text?.trim()).toMatch(/^[A-Z]{1,2}$/);
  });

  test('mobile drawer shows "My Account" when signed in', async ({ page }) => {
    await page.waitForTimeout(2_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.click('button[aria-label="Open navigation"]');
    await expect(page.locator('a:has-text("My Account")')).toBeVisible({ timeout: 5_000 });
    const href = await page.locator('a:has-text("My Account")').getAttribute('href');
    expect(href).toBe('/account');
  });
});
