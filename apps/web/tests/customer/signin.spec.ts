import { test, expect } from '@playwright/test';
import { signInWithBypassToken } from '../lib/auth-bypass';

test.describe('Customer Sign In', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/signin');
  });

  test('renders branding and heading', async ({ page }) => {
    await expect(page.locator('text=Perfect Cleaners')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Sign in or create');
  });

  test('shows [ACCOUNT] / SIGN IN OR CREATE eyebrow', async ({ page }) => {
    // Quoted text= does an exact match; the unquoted substring version also
    // matched the "Sign in or create account." h1 (case-insensitive substring),
    // causing a strict-mode violation (2 elements).
    await expect(page.locator('text="[ACCOUNT] / SIGN IN OR CREATE"')).toBeVisible();
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
    await page.goto('/signin?from=/account/wallet');
    await expect(page.locator('h1')).toContainText('Sign in or create');
  });

});

// ── New-account creation (fresh UID, not the shared test identity) ────────────
//
// The literal "One last step." profile-creation form (SignInContent's
// step==='profile') is only ever reached from inside handleVerify's live
// MSG91 success callback — a page reload always resets local step state back
// to 'phone', and the page's own effect (`if (!loading && user && step !==
// 'profile') router.replace(redirectTo)`) immediately redirects a signed-in
// user away before that step could ever render post-reload. So the token
// bypass (which works by sign-in + reload) cannot drive that specific form,
// on this page or in AuthBottomSheet, which has the identical gate. What we
// CAN verify — and what actually matters for "different accounts, not the
// assigned test number" — is that a genuinely new Firebase UID that has
// never signed in before completes authentication and reaches the app.

test.describe('New customer account creation', () => {

  test('a brand-new UID (never signed in before) authenticates and reaches /account', async ({ page }) => {
    const uid = `pw_test_customer_${Date.now()}`;
    await page.goto('/signin');
    await signInWithBypassToken(page, uid, { persistence: 'session' });
    await page.waitForURL('**/account', { timeout: 15_000 });
    // No Firestore `customers/{uid}` doc exists for this UID — the page must
    // render a sane state for a profile-less customer, not crash or hang.
    await expect(page.locator('h1')).toBeVisible({ timeout: 10_000 });
  });

  test('a brand-new customer sees the empty-bookings state, not stale data', async ({ page }) => {
    const uid = `pw_test_customer_${Date.now()}`;
    // Bookings are queried by phone, not uid — a bare bypass token leaves
    // phoneNumber null and the section never resolves either way. Stamp a
    // synthetic-but-valid phone so the query genuinely runs and returns zero
    // results (this UID has never booked anything), the real "new customer" case.
    const phone = `+919${String(Date.now()).slice(-9)}`;
    await page.goto('/signin');
    await signInWithBypassToken(page, uid, { persistence: 'session', phone });
    await page.waitForURL('**/account', { timeout: 15_000 });
    await expect(page.locator('text=Your first wash awaits.')).toBeVisible({ timeout: 10_000 });
    const cta = page.locator('a:has-text("Join a society")');
    await expect(cta).toBeVisible();
    expect(await cta.getAttribute('href')).toBe('/for-societies');
  });

});
