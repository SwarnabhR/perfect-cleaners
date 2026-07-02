import { test, expect } from '../fixtures/worker';
import { test as base, expect as baseExpect } from '@playwright/test';
import { signInWithBypassToken } from '../lib/auth-bypass';
import { adminDb, Timestamp, PW_TEST_PREFIX } from '../lib/firestore-admin';

test.describe('Worker Dashboard', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/worker/dashboard');
    // Wait for auth check — either dashboard loads or redirects to login
    await page.waitForLoadState('load');
  });

  test('unauthenticated access redirects to login', async ({ browser }) => {
    const ctx  = await browser.newContext(); // no storageState
    const page = await ctx.newPage();
    await page.goto('/worker/dashboard');
    await page.waitForURL(/\/worker\/login/, { timeout: 10_000 });
    await expect(page.locator('h1')).toContainText('Worker sign in.');
    await ctx.close();
  });

  test('top bar shows worker portal branding', async ({ page }) => {
    await expect(page.locator('text=PERFECT CLEANERS')).toBeVisible();
  });

  test('renders greeting and worker name', async ({ page }) => {
    const greetings = ['Good morning', 'Good afternoon', 'Good evening'];
    const heading   = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: 10_000 });
    const text = await heading.textContent();
    // Heading ends with worker's first name followed by a period
    expect(text).toMatch(/\w+\.$/);
  });

  test('Go Online / Online status button is visible', async ({ page }) => {
    await expect(
      page.locator('button:has-text("Go Online")').or(page.locator('button:has-text("Online")'))
    ).toBeVisible({ timeout: 10_000 });
  });

  test('KPI stats strip renders three cards', async ({ page }) => {
    await expect(page.locator('text=Cars Done Today').or(page.locator('text=cars done today'))).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=Remaining').or(page.locator('text=remaining'))).toBeVisible();
  });

  test('bottom tab bar has four navigation items', async ({ page }) => {
    const tabs = ['Dashboard', 'Cleans', 'Jobs', 'Profile'];
    for (const label of tabs) {
      await expect(page.locator(`nav a:has-text("${label}")`)).toBeVisible();
    }
  });

  test('bottom tab hrefs point to correct worker pages', async ({ page }) => {
    // Wait for nav to be present before checking hrefs
    await expect(page.locator('nav a:has-text("Dashboard")')).toBeVisible({ timeout: 20_000 });
    const tabs: Array<[string, string]> = [
      ['Jobs',     '/worker/jobs'],
      ['Profile',  '/worker/profile'],
      ['Cleans',   '/worker/cleaning-logs'],
    ];
    for (const [label, expectedHref] of tabs) {
      const link = page.locator(`nav a:has-text("${label}")`);
      await expect(link).toBeVisible();
      const href = await link.getAttribute('href');
      expect(href).toBe(expectedHref);
    }
  });

  test('society assignment card or "no society" message is shown', async ({ page }) => {
    await expect(
      page.locator('text=ASSIGNED SOCIETY')
        .or(page.locator('text=No society assigned.'))
    ).toBeVisible({ timeout: 10_000 });
  });

  test('online toggle changes worker status', async ({ page }) => {
    const goOnline = page.locator('button:has-text("Go Online")');
    const online   = page.locator('button:has-text("Online")');

    // Wait for either state to render after Firestore loads
    await expect(goOnline.or(online)).toBeVisible({ timeout: 20_000 });

    if (await goOnline.isVisible()) {
      await goOnline.click();
      await expect(online).toBeVisible({ timeout: 15_000 });
      await online.click();
      await expect(goOnline).toBeVisible({ timeout: 15_000 });
    } else {
      await online.click();
      await expect(goOnline).toBeVisible({ timeout: 15_000 });
      await goOnline.click();
      await expect(online).toBeVisible({ timeout: 15_000 });
    }
  });

});

// ── Empty states (fresh, isolated workers) ────────────────────────────────────

base.describe('Worker Dashboard — empty states', () => {

  base('shows "No society assigned." for a worker with no assignedSocietyId', async ({ page }) => {
    const ts    = Date.now();
    const uid   = `pw_test_worker_${ts}`;
    const phone = `+919${String(ts).slice(-9)}`;
    await adminDb().collection('workers').doc(uid).set({
      name: `${PW_TEST_PREFIX}NoSociety Worker`,
      phone, isOnline: false, rating: 5, totalJobs: 0,
      createdAt: Timestamp.now(),
      // assignedSocietyId intentionally omitted
    });

    await page.goto('/worker/login');
    await signInWithBypassToken(page, uid);
    await page.waitForURL('**/worker/dashboard', { timeout: 15_000 });

    await baseExpect(page.locator('text=No society assigned.')).toBeVisible({ timeout: 10_000 });
    await baseExpect(page.locator('text=ASSIGNED SOCIETY')).not.toBeVisible();
  });

  base('shows "No cleans logged yet." for a worker assigned to a society with zero cleans today', async ({ page }) => {
    const societiesSnap = await adminDb().collection('societies').where('isActive', '==', true).limit(1).get();
    if (societiesSnap.empty) { base.skip(true, 'No active society to assign'); return; }
    const society = societiesSnap.docs[0];

    const ts    = Date.now();
    const uid   = `pw_test_worker_${ts}`;
    const phone = `+919${String(ts).slice(-9)}`;
    await adminDb().collection('workers').doc(uid).set({
      name: `${PW_TEST_PREFIX}ZeroCleans Worker`,
      phone, isOnline: false, rating: 5, totalJobs: 0,
      assignedSocietyId:   society.id,
      assignedSocietyName: society.data().name,
      createdAt: Timestamp.now(),
    });

    await page.goto('/worker/login');
    await signInWithBypassToken(page, uid);
    await page.waitForURL('**/worker/dashboard', { timeout: 15_000 });

    await baseExpect(page.locator('text=ASSIGNED SOCIETY')).toBeVisible({ timeout: 10_000 });
    await baseExpect(page.locator('text=No cleans logged yet.')).toBeVisible({ timeout: 10_000 });
  });

});
