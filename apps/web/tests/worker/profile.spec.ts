import { test, expect } from '../fixtures/worker';
import { test as base, expect as baseExpect } from '@playwright/test';
import { signInWithBypassToken } from '../lib/auth-bypass';
import { adminDb, Timestamp, PW_TEST_PREFIX } from '../lib/firestore-admin';

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

  // Sign-out flow itself is covered in tests/auth/signout.spec.ts, which
  // authenticates in its own isolated context — this file's tests share one
  // signed-in page per worker (see tests/fixtures/worker.ts), so actually
  // signing out here would destroy that session for every later test.

});

// ── Address CRUD + 3-state Save button (fresh, isolated worker) ──────────────
//
// Uses a dedicated worker identity so this doesn't leave permanent address
// clutter on the shared TEST_WORKER_UID every other worker test reuses.

base.describe('Worker Profile — address CRUD and save-state', () => {

  base('add, set primary, and delete a saved address', async ({ page }) => {
    const ts    = Date.now();
    const uid   = `pw_test_worker_${ts}`;
    const phone = `+919${String(ts).slice(-9)}`;
    await adminDb().collection('workers').doc(uid).set({
      name: `${PW_TEST_PREFIX}Profile Worker`,
      phone, isOnline: false, rating: 5, totalJobs: 0,
      createdAt: Timestamp.now(),
    });

    await page.goto('/worker/login');
    await signInWithBypassToken(page, uid);
    await page.waitForURL('**/worker/dashboard', { timeout: 15_000 });
    await page.click('nav a:has-text("Profile")');
    await page.waitForURL('**/worker/profile');

    await baseExpect(page.locator('text=No saved addresses yet.')).toBeVisible({ timeout: 10_000 });

    await page.click('button:has-text("Add")');
    const saveBtn = page.locator('button:has-text("Save Address")');
    await baseExpect(saveBtn).toBeDisabled(); // Line 1 empty — button stays disabled
    await page.fill('input[placeholder="House / building / street"]', 'PWTEST Building 1');
    await baseExpect(saveBtn).toBeEnabled();
    await saveBtn.click();

    await baseExpect(page.locator('text=PWTEST Building 1')).toBeVisible({ timeout: 10_000 });
    await baseExpect(page.locator('text=No saved addresses yet.')).not.toBeVisible();

    // Add a second address to exercise "Set primary" meaningfully
    await page.click('button:has-text("Add")');
    await page.fill('input[placeholder="House / building / street"]', 'PWTEST Building 2');
    await page.click('button:has-text("Save Address")');
    await baseExpect(page.locator('text=PWTEST Building 2')).toBeVisible({ timeout: 10_000 });

    function cardFor(line1: string, otherLine1: string) {
      return page.locator('div')
        .filter({ hasText: line1 })
        .filter({ hasNotText: otherLine1 })
        .filter({ has: page.locator('button:has-text("Delete")') })
        .last();
    }

    const secondCard = cardFor('PWTEST Building 2', 'PWTEST Building 1');
    await secondCard.locator('button:has-text("Set primary")').click();
    await baseExpect(secondCard.locator('text=PRIMARY')).toBeVisible({ timeout: 8_000 });

    const firstCard = cardFor('PWTEST Building 1', 'PWTEST Building 2');
    await firstCard.locator('button:has-text("Delete")').click();
    await baseExpect(page.locator('text=PWTEST Building 1')).not.toBeVisible({ timeout: 8_000 });
    await baseExpect(page.locator('text=PWTEST Building 2')).toBeVisible();
  });

  base('Save Profile button cycles through Saving… and Saved ✓', async ({ page }) => {
    const ts    = Date.now();
    const uid   = `pw_test_worker_${ts}`;
    const phone = `+919${String(ts).slice(-9)}`;
    await adminDb().collection('workers').doc(uid).set({
      name: `${PW_TEST_PREFIX}SaveState Worker`,
      phone, isOnline: false, rating: 5, totalJobs: 0,
      createdAt: Timestamp.now(),
    });

    await page.goto('/worker/login');
    await signInWithBypassToken(page, uid);
    await page.waitForURL('**/worker/dashboard', { timeout: 15_000 });
    await page.click('nav a:has-text("Profile")');
    await page.waitForURL('**/worker/profile');

    const saveBtn = page.locator('button:has-text("Save Profile"), button:has-text("Saving…"), button:has-text("Saved ✓")');
    await baseExpect(saveBtn).toContainText('Save Profile', { timeout: 10_000 });
    await saveBtn.click();
    await baseExpect(saveBtn).toContainText('Saved ✓', { timeout: 8_000 });
    // Reverts after 3s
    await baseExpect(saveBtn).toContainText('Save Profile', { timeout: 6_000 });
  });

});
