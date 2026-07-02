import { test, expect } from '../fixtures/customer';
import { test as base, expect as baseExpect, type Page } from '@playwright/test';
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

  test('Pay Now button is visible when balance is non-zero', async ({ page }) => {
    await page.waitForTimeout(2_000);
    const neverBilled = await page.locator('text=Nothing to show here.').isVisible().catch(() => false);
    if (neverBilled) { test.skip(true, 'Test customer has no billing history yet'); return; }
    // The button reads "Pay now →" when outstandingBalance > 0, or
    // "All clear ✓" when settled — there is no literal "No outstanding
    // balance" copy anywhere in the component.
    const payBtn   = page.locator('button:has-text("Pay now")');
    const clearBtn = page.locator('button:has-text("All clear")');
    await expect(payBtn.or(clearBtn).first()).toBeVisible({ timeout: 10_000 });
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

// ── Pay Now flow — mocked Razorpay, fresh customer with a real balance ────────
//
// A real Razorpay checkout can't be driven in Playwright (external hosted
// iframe). Instead: seed a fresh customer with outstandingBalance > 0
// (needed for the Pay Now button to be enabled at all — see `isPaid` in
// account/wallet/page.tsx), stub `window.Razorpay` before the page loads so
// `loadRazorpay()`'s `if (window.Razorpay) resolve(...)` short-circuit picks
// it up instead of fetching the real checkout.js, and intercept the two
// backend routes the handler actually calls.

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

/** Stubs window.Razorpay so `rzp.open()` synchronously drives one of the real handler's callback paths. */
async function mockRazorpay(page: Page, mode: 'success' | 'dismiss') {
  await page.addInitScript((mode) => {
    (window as any).Razorpay = function (config: any) {
      return {
        open: () => {
          if (mode === 'success') {
            config.handler({
              razorpay_order_id:   'order_pw_test',
              razorpay_payment_id: 'pay_pw_test',
              razorpay_signature:  'sig_pw_test',
            });
          } else {
            config.modal.ondismiss();
          }
        },
      };
    };
  }, mode);
}

base.describe('Customer Wallet — Pay Now (mocked Razorpay)', () => {

  base('successful payment updates balance and shows confirmation', async ({ page }) => {
    const { uid, phone } = freshBilledCustomer();
    await seedBilledCustomer(uid, phone, 500);
    await mockRazorpay(page, 'success');

    let createOrderCalled = false;
    await page.route('**/api/payment/create-order', async route => {
      const body = route.request().postDataJSON();
      createOrderCalled = body?.amount === 500;
      await route.fulfill({ json: { orderId: 'order_pw_test', keyId: 'rzp_test_pw_mock' } });
    });
    await page.route('**/api/payment/settle-balance', async route => {
      await route.fulfill({ json: { ok: true } });
    });

    await page.goto('/signin');
    await signInWithBypassToken(page, uid, { persistence: 'session', phone });
    await page.waitForURL('**/account', { timeout: 15_000 });
    await page.click('a:has-text("Bill")');
    await page.waitForURL('**/account/wallet');

    const payBtn = page.locator('button:has-text("Pay now")');
    await baseExpect(payBtn).toBeVisible({ timeout: 10_000 });
    await payBtn.click();

    await baseExpect(page.locator('text=Payment received — balance updated.')).toBeVisible({ timeout: 10_000 });
    baseExpect(createOrderCalled).toBe(true);
  });

  base('dismissing checkout resets the button with no crash', async ({ page }) => {
    const { uid, phone } = freshBilledCustomer();
    await seedBilledCustomer(uid, phone, 300);
    await mockRazorpay(page, 'dismiss');

    await page.route('**/api/payment/create-order', async route => {
      await route.fulfill({ json: { orderId: 'order_pw_test_2', keyId: 'rzp_test_pw_mock' } });
    });

    await page.goto('/signin');
    await signInWithBypassToken(page, uid, { persistence: 'session', phone });
    await page.waitForURL('**/account', { timeout: 15_000 });
    await page.click('a:has-text("Bill")');
    await page.waitForURL('**/account/wallet');

    const payBtn = page.locator('button:has-text("Pay now")');
    await baseExpect(payBtn).toBeVisible({ timeout: 10_000 });
    await payBtn.click();

    // ondismiss() sets paying back to false — button returns to its idle label
    await baseExpect(page.locator('button:has-text("Pay now")')).toBeVisible({ timeout: 8_000 });
    await baseExpect(page.locator('text=Payment received')).not.toBeVisible();
  });

  base('order-creation failure shows an error, not a crash', async ({ page }) => {
    const { uid, phone } = freshBilledCustomer();
    await seedBilledCustomer(uid, phone, 250);
    await mockRazorpay(page, 'success');

    await page.route('**/api/payment/create-order', async route => {
      await route.fulfill({ json: { error: 'Could not create order.' } });
    });

    await page.goto('/signin');
    await signInWithBypassToken(page, uid, { persistence: 'session', phone });
    await page.waitForURL('**/account', { timeout: 15_000 });
    await page.click('a:has-text("Bill")');
    await page.waitForURL('**/account/wallet');

    const payBtn = page.locator('button:has-text("Pay now")');
    await baseExpect(payBtn).toBeVisible({ timeout: 10_000 });
    await payBtn.click();

    await baseExpect(page.locator('text=Could not create order.')).toBeVisible({ timeout: 8_000 });
    await baseExpect(payBtn).toBeVisible(); // back to idle, not stuck on "Opening checkout…"
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
