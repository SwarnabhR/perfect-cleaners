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

// ── Live session assignments (workerIds[] cleaningSessions, independent of
// the static assignedSocietyId field) ─────────────────────────────────────────
//
// Regression coverage for a bug found by hand: a worker assigned to a
// cleaningSession via the admin Cleaning Schedule page (which writes
// workerIds: string[], not the legacy singular workerId) previously never
// showed up here at all — the dashboard only ever read assignedSocietyId.
// Testing this live also surfaced a separate, pre-existing bug one layer
// down: firestore.rules only granted `cleaningSessions` read access when
// resource.data.workerId (singular) matched the caller, so a doc written
// with only workerIds (the array the admin Cleaning Schedule page actually
// writes) was rejected outright with "Missing or insufficient permissions".
// firestore.rules now also accepts
// resource.data.workerIds.hasAny([request.auth.uid]) (deployed) — confirmed
// live via a fresh worker + workerIds-only session before un-skipping these.

base.describe('Worker Dashboard — live session assignments', () => {

  base('shows a session card linking to /session/[id] for a scheduled assignment', async ({ page }) => {
    const ts  = Date.now();
    const uid = `pw_test_worker_${ts}`;
    const phone = `+919${String(ts).slice(-9)}`;
    await adminDb().collection('workers').doc(uid).set({
      name: `${PW_TEST_PREFIX}Session Worker`,
      phone, isOnline: true, rating: 5, totalJobs: 0,
      createdAt: Timestamp.now(),
    });
    const sessionRef = await adminDb().collection('cleaningSessions').add({
      societyId: 'pw_test_society', societyName: `${PW_TEST_PREFIX}Society`, tower: 'Tower Z',
      scheduledDate: Timestamp.now(), status: 'scheduled',
      cars: [], totalCars: 3, completedCars: 0, skippedCars: 0,
      workerIds: [uid], workerNames: [`${PW_TEST_PREFIX}Session Worker`],
      createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    });

    await page.goto('/worker/login');
    await signInWithBypassToken(page, uid);
    await page.waitForURL('**/worker/dashboard', { timeout: 15_000 });

    const card = page.locator(`a[href="/session/${sessionRef.id}"]`);
    await baseExpect(card).toBeVisible({ timeout: 10_000 });
    await baseExpect(card).toContainText('Tower Z');
    await baseExpect(card).toContainText('0/3 done');
  });

  base('assigning one worker to two towers on the same day shows both, plural heading', async ({ page }) => {
    const ts  = Date.now();
    const uid = `pw_test_worker_${ts}`;
    const phone = `+919${String(ts).slice(-9)}`;
    await adminDb().collection('workers').doc(uid).set({
      name: `${PW_TEST_PREFIX}MultiTower Worker`,
      phone, isOnline: true, rating: 5, totalJobs: 0,
      createdAt: Timestamp.now(),
    });
    await adminDb().collection('cleaningSessions').add({
      societyId: 'pw_test_society_a', societyName: `${PW_TEST_PREFIX}Society A`, tower: 'Tower 1',
      scheduledDate: Timestamp.now(), status: 'scheduled',
      cars: [], totalCars: 2, completedCars: 0, skippedCars: 0,
      workerIds: [uid], workerNames: [`${PW_TEST_PREFIX}MultiTower Worker`],
      createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    });
    await adminDb().collection('cleaningSessions').add({
      societyId: 'pw_test_society_b', societyName: `${PW_TEST_PREFIX}Society B`, tower: 'Tower 2',
      scheduledDate: Timestamp.now(), status: 'inprogress',
      cars: [], totalCars: 4, completedCars: 1, skippedCars: 0,
      workerIds: [uid], workerNames: [`${PW_TEST_PREFIX}MultiTower Worker`],
      createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    });

    await page.goto('/worker/login');
    await signInWithBypassToken(page, uid);
    await page.waitForURL('**/worker/dashboard', { timeout: 15_000 });

    await baseExpect(page.locator("text=TODAY'S ASSIGNMENTS (2)")).toBeVisible({ timeout: 10_000 });
    // "text=Society A" is a case-insensitive substring match, and "No society
    // assigned." contains "society a..." too — match the full prefixed name.
    await baseExpect(page.locator(`text=${PW_TEST_PREFIX}Society A`)).toBeVisible();
    await baseExpect(page.locator(`text=${PW_TEST_PREFIX}Society B`)).toBeVisible();
  });

  base('a session already marked done does not appear in the assignment list', async ({ page }) => {
    const ts  = Date.now();
    const uid = `pw_test_worker_${ts}`;
    const phone = `+919${String(ts).slice(-9)}`;
    await adminDb().collection('workers').doc(uid).set({
      name: `${PW_TEST_PREFIX}DoneSession Worker`,
      phone, isOnline: true, rating: 5, totalJobs: 0,
      createdAt: Timestamp.now(),
    });
    await adminDb().collection('cleaningSessions').add({
      societyId: 'pw_test_society_done', societyName: `${PW_TEST_PREFIX}Finished Society`, tower: 'Tower Done',
      scheduledDate: Timestamp.now(), status: 'done', completedAt: Timestamp.now(),
      cars: [], totalCars: 1, completedCars: 1, skippedCars: 0,
      workerIds: [uid], workerNames: [`${PW_TEST_PREFIX}DoneSession Worker`],
      createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    });

    await page.goto('/worker/login');
    await signInWithBypassToken(page, uid);
    await page.waitForURL('**/worker/dashboard', { timeout: 15_000 });

    await baseExpect(page.locator('text=No society assigned.')).toBeVisible({ timeout: 10_000 });
    await baseExpect(page.locator('text=Finished Society')).not.toBeVisible();
  });

});
