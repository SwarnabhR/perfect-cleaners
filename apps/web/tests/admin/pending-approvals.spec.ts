import { test, expect } from '../fixtures/admin';

test.describe('Admin Pending Approvals', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/pending-approvals');
    await expect(page.locator('.admin-page-root')).toBeVisible();
  });

  test('renders page heading and eyebrow', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Pending Approvals');
    await expect(page.locator('text="CUSTOMERS"')).toBeVisible();
  });

  test('renders three KPI cards', async ({ page }) => {
    // "Societies" also exact-matches sidebar/bottom-nav links — scope to the grid.
    const kpis = page.locator('.kpi-grid-3');
    for (const label of ['Awaiting Approval', 'New Today', 'Societies']) {
      await expect(kpis.locator(`text=${label}`)).toBeVisible({ timeout: 15_000 });
    }
  });

  test('shows approval cards or the empty state', async ({ page }) => {
    await expect(
      page.locator('button:has-text("Approve")').first().or(page.locator('text=No pending approvals'))
    ).toBeVisible({ timeout: 20_000 });
    const hasCard = await page.locator('button:has-text("Approve")').first().isVisible().catch(() => false);
    if (!hasCard) {
      await expect(page.locator('text=No pending approvals')).toBeVisible();
      await expect(page.locator('text=All signup requests have been reviewed.')).toBeVisible();
      return;
    }
    await expect(page.locator('button:has-text("Reject")').first()).toBeVisible();
  });

  test('Approve opens a modal with payment method and notes', async ({ page }) => {
    const approveBtn = page.locator('button:has-text("Approve")').first();
    if (!await approveBtn.isVisible({ timeout: 20_000 }).catch(() => false)) {
      test.skip(true, 'No pending approvals to test Approve on');
      return;
    }
    await approveBtn.click();
    await expect(page.locator('text=Approve Signup')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('select')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="WhatsApp Pay"]')).toBeVisible();
    const submitBtn = page.locator('button:has-text("Approve & Add")');
    await expect(submitBtn).toBeVisible();
    await page.locator('button:has-text("Cancel")').click();
    await expect(page.locator('text=Approve Signup')).not.toBeVisible({ timeout: 5_000 });
  });

  test('Reject opens a modal requiring a reason', async ({ page }) => {
    const rejectBtn = page.locator('button:has-text("Reject")').first();
    if (!await rejectBtn.isVisible({ timeout: 20_000 }).catch(() => false)) {
      test.skip(true, 'No pending approvals to test Reject on');
      return;
    }
    await rejectBtn.click();
    await expect(page.locator('text=Reject Signup')).toBeVisible({ timeout: 8_000 });
    const confirmBtn = page.locator('button:has-text("Confirm Reject")');
    await expect(confirmBtn).toBeDisabled();
    await page.fill('textarea[placeholder*="Unverifiable address"]', 'PW_TEST — automated coverage check, do not act on this.');
    await expect(confirmBtn).toBeEnabled();
    await page.locator('button:has-text("Cancel")').click();
    await expect(page.locator('text=Reject Signup')).not.toBeVisible({ timeout: 5_000 });
  });

});
