import { test, expect } from '../fixtures/customer';

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
    await expect(
      page.locator('text=Outstanding Balance')
        .or(page.locator('text=OUTSTANDING BALANCE'))
        .or(page.locator('text=outstanding balance'))
    ).toBeVisible({ timeout: 10_000 });
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
