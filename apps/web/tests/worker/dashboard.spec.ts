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
    const heading = page.locator('h1');
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

  // The dashboard's content is now conditional on live data (per-car
  // checklist / "All caught up" / "No society assigned"), so — unlike the
  // old always-on stat cards — the one thing guaranteed to render is exactly
  // one of these three states.
  test('renders one of: checklist, all-caught-up, or no-society state', async ({ page }) => {
    // .first() — a worker assigned only via a live session (no static
    // assignedSocietyId) legitimately renders BOTH the checklist footer and
    // the "No society assigned." card, which made the bare .or() fail strict
    // mode rather than the state itself being wrong.
    await expect(
      page.locator('text=/\\d+ cars? cleaned today/')
        .or(page.locator('text=No society assigned.'))
        .first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('bottom tab bar has three navigation items', async ({ page }) => {
    const tabs = ['Dashboard', 'Cleans', 'Profile'];
    for (const label of tabs) {
      await expect(page.locator(`nav a:has-text("${label}")`)).toBeVisible();
    }
  });

  test('bottom tab hrefs point to correct worker pages', async ({ page }) => {
    // Wait for nav to be present before checking hrefs
    await expect(page.locator('nav a:has-text("Dashboard")')).toBeVisible({ timeout: 20_000 });
    const tabs: Array<[string, string]> = [
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

  test('View full calendar link is always visible', async ({ page }) => {
    await expect(page.locator('text=View full calendar')).toBeVisible({ timeout: 10_000 });
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
    await baseExpect(page.locator('text=YOUR TOWERS')).not.toBeVisible();
  });

  base('shows the "All caught up" empty state for a worker assigned to a society with nothing to clean', async ({ page }) => {
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

    await baseExpect(page.locator('text=No society assigned.')).not.toBeVisible();
    await baseExpect(page.locator('text=All caught up.')).toBeVisible({ timeout: 10_000 });
    await baseExpect(page.locator('text=0 cars cleaned today')).toBeVisible();
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
//
// The dashboard is now per-car, not per-session — a session with an empty
// cars[] renders nothing in the checklist regardless of totalCars, so every
// fixture below populates real car entries.

base.describe('Worker Dashboard — live session assignments', () => {

  base('renders per-car checklist rows for a scheduled session with cars', async ({ page }) => {
    const ts  = Date.now();
    const uid = `pw_test_worker_${ts}`;
    const phone = `+919${String(ts).slice(-9)}`;
    await adminDb().collection('workers').doc(uid).set({
      name: `${PW_TEST_PREFIX}Session Worker`,
      phone, isOnline: true, rating: 5, totalJobs: 0,
      createdAt: Timestamp.now(),
    });
    await adminDb().collection('cleaningSessions').add({
      societyId: 'pw_test_society', societyName: `${PW_TEST_PREFIX}Society`, tower: 'Tower Z',
      scheduledDate: Timestamp.now(), status: 'scheduled',
      cars: [
        { customerId: 'pw_c1', customerName: 'Resident One',   customerPhone: '+919000000001', unitNumber: '101', parkingNumber: 'P-1', carPlate: 'DL01AB0001', carMake: 'Honda',   carModel: 'City',  preferredTime: 9,  status: 'pending' },
        { customerId: 'pw_c2', customerName: 'Resident Two',   customerPhone: '+919000000002', unitNumber: '102', parkingNumber: 'P-2', carPlate: 'DL01AB0002', carMake: 'Maruti',  carModel: 'Swift', preferredTime: 11, status: 'pending' },
        { customerId: 'pw_c3', customerName: 'Resident Three', customerPhone: '+919000000003', unitNumber: '103', parkingNumber: 'P-3', carPlate: 'DL01AB0003', carMake: 'Hyundai', carModel: 'i20',   preferredTime: 14, status: 'pending' },
      ],
      totalCars: 3, completedCars: 0, skippedCars: 0,
      workerIds: [uid], workerNames: [`${PW_TEST_PREFIX}Session Worker`],
      createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    });

    await page.goto('/worker/login');
    await signInWithBypassToken(page, uid);
    await page.waitForURL('**/worker/dashboard', { timeout: 15_000 });

    // CarRow renders the flat and the car number as two separate <p>s — the
    // plate deliberately gets its own untruncated line — so they can't be
    // matched as one "Flat 101 · DL01AB0001" text node.
    for (const [flat, plate] of [['101', 'DL01AB0001'], ['102', 'DL01AB0002'], ['103', 'DL01AB0003']]) {
      await baseExpect(page.locator(`text=Flat ${flat}`).first()).toBeVisible({ timeout: 10_000 });
      await baseExpect(page.locator(`text=${plate}`).first()).toBeVisible();
    }
    // Single tower — the "YOUR TOWERS" picker is skipped, per-row tower tags too
    await baseExpect(page.locator('text=YOUR TOWERS')).not.toBeVisible();
    await baseExpect(page.locator('text=0 cars cleaned today')).toBeVisible();
  });

  base('assigning one worker to two towers on the same day shows a tower picker with both', async ({ page }) => {
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
      cars: [
        { customerId: 'pw_a1', customerName: 'A One', customerPhone: '+919000000011', unitNumber: '201', parkingNumber: 'P-1', carPlate: 'DL02AB0001', carMake: 'Tata', carModel: 'Nexon', preferredTime: 9,  status: 'pending' },
        { customerId: 'pw_a2', customerName: 'A Two', customerPhone: '+919000000012', unitNumber: '202', parkingNumber: 'P-2', carPlate: 'DL02AB0002', carMake: 'Kia',  carModel: 'Seltos', preferredTime: 10, status: 'pending' },
      ],
      totalCars: 2, completedCars: 0, skippedCars: 0,
      workerIds: [uid], workerNames: [`${PW_TEST_PREFIX}MultiTower Worker`],
      createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    });
    await adminDb().collection('cleaningSessions').add({
      societyId: 'pw_test_society_b', societyName: `${PW_TEST_PREFIX}Society B`, tower: 'Tower 2',
      scheduledDate: Timestamp.now(), status: 'inprogress',
      cars: [
        { customerId: 'pw_b1', customerName: 'B One',   customerPhone: '+919000000021', unitNumber: '301', parkingNumber: 'P-1', carPlate: 'DL03AB0001', carMake: 'Honda',  carModel: 'Amaze', preferredTime: 9,  status: 'done' },
        { customerId: 'pw_b2', customerName: 'B Two',   customerPhone: '+919000000022', unitNumber: '302', parkingNumber: 'P-2', carPlate: 'DL03AB0002', carMake: 'Toyota', carModel: 'Glanza', preferredTime: 11, status: 'pending' },
        { customerId: 'pw_b3', customerName: 'B Three', customerPhone: '+919000000023', unitNumber: '303', parkingNumber: 'P-3', carPlate: 'DL03AB0003', carMake: 'Ford',   carModel: 'Ecosport', preferredTime: 13, status: 'pending' },
      ],
      totalCars: 3, completedCars: 1, skippedCars: 0,
      workerIds: [uid], workerNames: [`${PW_TEST_PREFIX}MultiTower Worker`],
      createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    });

    await page.goto('/worker/login');
    await signInWithBypassToken(page, uid);
    await page.waitForURL('**/worker/dashboard', { timeout: 15_000 });

    await baseExpect(page.locator('text=YOUR TOWERS')).toBeVisible({ timeout: 10_000 });
    const tower1Row = page.locator('button', { hasText: 'Tower 1' });
    const tower2Row = page.locator('button', { hasText: 'Tower 2' });
    await baseExpect(tower1Row).toBeVisible();
    await baseExpect(tower2Row).toBeVisible();
    // Tower 1: 2 pending cars. Tower 2: 1 done + 2 pending — only pending counts.
    await baseExpect(tower1Row).toContainText('2');
    await baseExpect(tower2Row).toContainText('2');
  });

  base('a session already marked done does not appear in the checklist', async ({ page }) => {
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
      cars: [
        { customerId: 'pw_d1', customerName: 'Done One', customerPhone: '+919000000031', unitNumber: '401', parkingNumber: 'P-1', carPlate: 'DL04AB0001', carMake: 'Honda', carModel: 'Civic', preferredTime: 9, status: 'done' },
      ],
      totalCars: 1, completedCars: 1, skippedCars: 0,
      workerIds: [uid], workerNames: [`${PW_TEST_PREFIX}DoneSession Worker`],
      createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    });

    await page.goto('/worker/login');
    await signInWithBypassToken(page, uid);
    await page.waitForURL('**/worker/dashboard', { timeout: 15_000 });

    await baseExpect(page.locator('text=Flat 401')).not.toBeVisible();
    await baseExpect(page.locator('text=Tower Done')).not.toBeVisible();
  });

});
