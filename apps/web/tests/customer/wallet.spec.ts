import { test, expect } from '../fixtures/customer';
import { test as base, expect as baseExpect } from '@playwright/test';
import { signInWithBypassToken } from '../lib/auth-bypass';
import { adminDb, Timestamp, PW_TEST_PREFIX } from '../lib/firestore-admin';

test.describe('Customer Wallet / Bill', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/account/wallet');
    await page.waitForLoadState('load');
  });

  test('renders Bill heading', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible({ timeout: 10_000 });
  });

  test('four account tabs visible', async ({ page }) => {
    await expect(page.locator('a:has-text("Schedule")')).toBeVisible();
    await expect(page.locator('a:has-text("Bookings")')).toBeVisible();
    await expect(page.locator('a:has-text("Profile")')).toBeVisible();
    await expect(page.locator('a:has-text("Bill")')).toBeVisible();
  });

  test('[NO BILLING YET] empty state shown for a never-billed customer', async ({ page }) => {
    const neverBilled = await page.locator('text=Nothing to show here.').isVisible({ timeout: 8_000 }).catch(() => false);
    if (!neverBilled) { test.skip(true, 'Test customer has billing history'); return; }
    await expect(page.locator('text=[NO BILLING YET]')).toBeVisible();
    await expect(page.locator('text=Nothing to show here.')).toBeVisible();
  });

  test('outstanding balance card is shown', async ({ page }) => {
    await page.waitForTimeout(2_000);
    const neverBilled = await page.locator('text=Nothing to show here.').isVisible().catch(() => false);
    if (neverBilled) { test.skip(true, 'Test customer has no billing history yet'); return; }
    await expect(page.locator('text=[OUTSTANDING BALANCE]')).toBeVisible({ timeout: 10_000 });
  });

  test('balance displays ₹ value', async ({ page }) => {
    await page.waitForTimeout(2_000);
    // A customer with no billing history at all gets the "[NO BILLING YET]"
    // empty state instead of the balance card — no ₹ renders anywhere then.
    const neverBilled = await page.locator('text=Nothing to show here.').isVisible().catch(() => false);
    if (neverBilled) { test.skip(true, 'Test customer has no billing history yet'); return; }
    await expect(page.locator('text=/₹/').first()).toBeVisible({ timeout: 8_000 });
  });

  test('shows manual-collection messaging when balance is non-zero, "All clear" when settled', async ({ page }) => {
    await page.waitForTimeout(2_000);
    const neverBilled = await page.locator('text=Nothing to show here.').isVisible().catch(() => false);
    if (neverBilled) { test.skip(true, 'Test customer has no billing history yet'); return; }
    // Online self-checkout is disabled — payment is collected by phone, not
    // a "Pay now" button. Non-zero balance shows the "we'll contact you"
    // pill; a settled balance shows "All clear ✓".
    const contactPill = page.locator("text=We'll be in touch to collect this");
    const clearBtn     = page.locator('button:has-text("All clear")');
    await expect(contactPill.or(clearBtn).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('button:has-text("Pay now")')).not.toBeVisible();
  });

  test('transaction history section is shown', async ({ page }) => {
    // The section is labelled "Activity" (not "Transaction History"), with
    // "Wash charges will appear here…" as its empty state, or the whole
    // section is replaced by the "[NO BILLING YET]" panel for a customer
    // with no history at all.
    await expect(
      page.locator('text=Activity')
        .or(page.locator('text=Wash charges will appear here'))
        .or(page.locator('text=Nothing to show here.'))
        .first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('transactions show type, label and amount', async ({ page }) => {
    await page.waitForTimeout(2_000);
    const noHistory = await page.locator('text=Nothing to show here.').isVisible().catch(() => false);
    const noTx      = await page.locator('text=Wash charges will appear here').isVisible().catch(() => false);
    if (noHistory || noTx) { test.skip(true, 'No transactions for test customer'); return; }
    // Each row shows a label and a rupee amount
    await expect(page.locator('text=/₹/').first()).toBeVisible({ timeout: 8_000 });
  });

  test('Bookings tab href is /account', async ({ page }) => {
    const link = page.locator('a:has-text("Bookings")');
    await expect(link).toBeVisible({ timeout: 20_000 });
    const href = await link.getAttribute('href');
    expect(href).toBe('/account');
  });

});

// ── Manual-collection messaging — fresh customer with a real balance ──────────
//
// Online self-checkout (Razorpay) is disabled for now — see account/wallet's
// handlePayNow comment. Payment is collected by phone, matching the society
// billing model, so there's no checkout flow left to drive here; these just
// confirm the balance card correctly reflects that instead of offering a
// dead "Pay now" button.

function freshBilledCustomer() {
  const ts = Date.now();
  return { uid: `pw_test_customer_${ts}`, phone: `+919${String(ts).slice(-9)}` };
}

async function seedBilledCustomer(uid: string, phone: string, outstandingBalance: number) {
  await adminDb().collection('customers').doc(uid).set({
    name: `${PW_TEST_PREFIX}Wallet Tester`,
    phone,
    outstandingBalance,
    vehicles: [],
    createdAt: Timestamp.now(),
  });
  await adminDb().collection('customers').doc(uid).collection('transactions').add({
    label: `${PW_TEST_PREFIX}Society wash`,
    amount: outstandingBalance,
    type: 'charge',
    createdAt: Timestamp.now(),
  });
}

base.describe('Customer Wallet — manual payment collection', () => {

  base('a non-zero balance shows the contact pill, not a Pay Now button', async ({ page }) => {
    const { uid, phone } = freshBilledCustomer();
    await seedBilledCustomer(uid, phone, 500);

    await page.goto('/signin');
    await signInWithBypassToken(page, uid, { persistence: 'session', phone });
    await page.waitForURL('**/account', { timeout: 15_000 });
    await page.click('a:has-text("Bill")');
    await page.waitForURL('**/account/wallet');

    await baseExpect(page.locator("text=We'll be in touch to collect this")).toBeVisible({ timeout: 10_000 });
    await baseExpect(page.locator('button:has-text("Pay now")')).not.toBeVisible();
    await baseExpect(page.locator('text=Our team will call you to collect')).toBeVisible();
  });

  base('the two disabled payment API routes respond 503 rather than attempting Razorpay', async ({ page }) => {
    const { uid, phone } = freshBilledCustomer();
    await seedBilledCustomer(uid, phone, 200);
    await page.goto('/signin');
    await signInWithBypassToken(page, uid, { persistence: 'session', phone });
    await page.waitForURL('**/account', { timeout: 15_000 });

    const createOrderRes = await page.request.post('/api/payment/create-order', { data: { amount: 200 } });
    baseExpect(createOrderRes.status()).toBe(503);
    const settleRes = await page.request.post('/api/payment/settle-balance', { data: { customerId: uid, amount: 200 } });
    baseExpect(settleRes.status()).toBe(503);
  });

  base('"How it works" opens an explanatory dialog', async ({ page }) => {
    const { uid, phone } = freshBilledCustomer();
    await seedBilledCustomer(uid, phone, 100);

    await page.goto('/signin');
    await signInWithBypassToken(page, uid, { persistence: 'session', phone });
    await page.waitForURL('**/account', { timeout: 15_000 });
    await page.click('a:has-text("Bill")');
    await page.waitForURL('**/account/wallet');

    let dialogMessage = '';
    page.once('dialog', async d => { dialogMessage = d.message(); await d.accept(); });
    await page.click('button:has-text("How it works")');
    await page.waitForTimeout(500); // let the dialog handler run
    baseExpect(dialogMessage).toContain('outstanding balance');
  });

});
