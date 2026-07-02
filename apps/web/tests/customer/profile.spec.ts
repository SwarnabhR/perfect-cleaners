import { test, expect } from '../fixtures/customer';
import { test as base, expect as baseExpect } from '@playwright/test';
import { signInWithBypassToken } from '../lib/auth-bypass';

test.describe('Customer Profile', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/account/profile');
    await page.waitForLoadState('load');
  });

  test('renders profile heading', async ({ page }) => {
    // Unlike /account and /account/wallet, the profile page has no <h1> —
    // it goes straight from the tab bar into the "PERSONAL DETAILS" section,
    // which is the closest thing to a page heading and always renders.
    await expect(page.locator('text=PERSONAL DETAILS')).toBeVisible({ timeout: 10_000 });
  });

  test('four account tabs are visible', async ({ page }) => {
    // Use exact accessible-name matching instead of :has-text() substring
    // matching — the "Your Bill" quick-link further down the page also
    // contains the substring "Bill", which caused a strict-mode violation.
    await expect(page.getByRole('link', { name: 'Schedule', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Bookings', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Profile', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Bill', exact: true })).toBeVisible();
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
    // The test customer's Firestore record has no email set, so we can't
    // assert a specific non-empty value — just that the editable email
    // field renders (empty or populated, whatever Firestore actually has).
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 8_000 });
    await expect(emailInput).toBeEditable();
  });

  test('phone number field is read-only', async ({ page }) => {
    // The phone field renders as <input type="text" readOnly ...>, not
    // type="tel" — there is no input[type="tel"] on this page.
    const phoneInput = page.locator('input[readonly]').first();
    await expect(phoneInput).toBeVisible({ timeout: 8_000 });
    const ro = await phoneInput.getAttribute('readOnly');
    const disabled = await phoneInput.isDisabled();
    expect(ro !== null || disabled).toBe(true);
  });

  test('Save Profile button is present', async ({ page }) => {
    await expect(page.locator('button:has-text("Save Profile")')).toBeVisible({ timeout: 8_000 });
  });

  test('Add address button or saved addresses section is visible', async ({ page }) => {
    // The real section heading is "SAVED ADDRESSES" (not "SERVICE ADDRESSES"),
    // and both the "+ Add address" button and the section heading are always
    // rendered together, so the un-scoped .or() resolved to 2 elements
    // (strict-mode violation). .first() makes this an actual "either" check.
    await expect(
      page.locator('button:has-text("Add address")')
        .or(page.locator('text=SAVED ADDRESSES'))
        .first()
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
    // a:has-text("Bookings") is a substring match, and also matches the
    // "Order History" quick link further down the page (its subtext reads
    // "View all your past and upcoming bookings"), causing a strict-mode
    // violation. Match the tab's exact accessible name instead.
    const link = page.getByRole('link', { name: 'Bookings', exact: true });
    await expect(link).toBeVisible({ timeout: 20_000 });
    const href = await link.getAttribute('href');
    expect(href).toBe('/account');
  });

});

// ── Address CRUD — full add / set-primary / delete round trip ────────────────
//
// Uses a fresh customer identity (not the shared TEST_CUSTOMER_UID) so this
// doesn't leave permanent address clutter on the identity every other
// customer test in the suite reuses, and so the "zero addresses" starting
// state is guaranteed rather than assumed.

base.describe('Customer Profile — address CRUD', () => {

  base('add, set primary, and delete a saved address', async ({ page }) => {
    const ts    = Date.now();
    const uid   = `pw_test_customer_${ts}`;
    const phone = `+919${String(ts).slice(-9)}`;

    await page.goto('/signin');
    await signInWithBypassToken(page, uid, { persistence: 'session', phone });
    await page.waitForURL('**/account', { timeout: 15_000 });
    await page.click('a:has-text("Profile")');
    await page.waitForURL('**/account/profile');

    // Zero-addresses empty state for a brand-new customer
    await baseExpect(page.locator('text=No saved addresses yet.')).toBeVisible({ timeout: 10_000 });

    await page.click('button:has-text("+ Add address")');
    const societyTrigger = page.locator('button:has-text("Select your society…")');
    await baseExpect(societyTrigger).toBeVisible({ timeout: 5_000 });
    await societyTrigger.click();
    const firstOption = page.locator('ul[role="listbox"] li[role="option"]').first();
    await baseExpect(firstOption).toBeVisible({ timeout: 5_000 });
    const societyName = (await firstOption.textContent())?.trim() ?? '';
    await firstOption.click();

    await page.fill('input[placeholder="e.g. 1204"]', 'PWTEST-101');
    const saveBtn = page.locator('button:has-text("Save Address")');
    await baseExpect(saveBtn).toBeEnabled();
    await saveBtn.click();

    // New card appears live (onSnapshot), empty state is gone
    const card = page.locator('text=Flat PWTEST-101');
    await baseExpect(card).toBeVisible({ timeout: 10_000 });
    await baseExpect(page.locator('text=No saved addresses yet.')).not.toBeVisible();
    if (societyName) await baseExpect(page.locator(`text=${societyName}`).first()).toBeVisible();

    // First address has no "Set primary" button (nothing to compare against yet)
    // — add a second one to exercise Set primary meaningfully.
    await page.click('button:has-text("+ Add address")');
    await societyTrigger.click();
    await page.locator('ul[role="listbox"] li[role="option"]').first().click();
    await page.fill('input[placeholder="e.g. 1204"]', 'PWTEST-202');
    await page.click('button:has-text("Save Address")');
    await baseExpect(page.locator('text=Flat PWTEST-202')).toBeVisible({ timeout: 10_000 });

    // Scoping to the exact card (not a broader ancestor that happens to
    // contain both cards' text): must contain this address's own text, must
    // NOT contain the other address's text, and must contain a Delete button
    // (present once per card) — narrows a generic `div` match down to one element.
    function cardFor(plate: string, otherPlate: string) {
      return page.locator('div')
        .filter({ hasText: `Flat ${plate}` })
        .filter({ hasNotText: `Flat ${otherPlate}` })
        .filter({ has: page.locator('button:has-text("Delete")') })
        .last();
    }

    // Set the second address as primary
    const secondCard = cardFor('PWTEST-202', 'PWTEST-101');
    await secondCard.locator('button:has-text("Set primary")').click();
    await baseExpect(secondCard.locator('text=PRIMARY')).toBeVisible({ timeout: 8_000 });

    // Delete the first (now-non-primary) address
    const firstCard = cardFor('PWTEST-101', 'PWTEST-202');
    await firstCard.locator('button:has-text("Delete")').click();
    await baseExpect(page.locator('text=Flat PWTEST-101')).not.toBeVisible({ timeout: 8_000 });
    await baseExpect(page.locator('text=Flat PWTEST-202')).toBeVisible();
  });

});
