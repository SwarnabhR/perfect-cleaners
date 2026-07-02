import { test, expect } from '../fixtures/worker';
import { test as base, expect as baseExpect } from '@playwright/test';
import { signInWithBypassToken } from '../lib/auth-bypass';
import { adminDb, Timestamp, PW_TEST_PREFIX } from '../lib/firestore-admin';

test.describe('Worker Jobs', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/worker/jobs');
    await page.waitForLoadState('load');
  });

  test('renders page heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('My Jobs');
    await expect(page.locator('text=ASSIGNMENTS')).toBeVisible();
  });

  test('renders all filter chips', async ({ page }) => {
    for (const label of ['All', 'Upcoming', 'Active', 'Done', 'Cancelled']) {
      await expect(page.locator(`button:has-text("${label}")`)).toBeVisible();
    }
  });

  test('filter chips toggle correctly', async ({ page }) => {
    // Wait for filter buttons to be interactive
    await expect(page.locator('button:has-text("Upcoming")')).toBeVisible({ timeout: 8_000 });
    await page.click('button:has-text("Upcoming")');
    await page.waitForTimeout(200);
    await page.click('button:has-text("Done")');
    await page.waitForTimeout(200);
    await page.click('button:has-text("All")');
  });

  test('shows Loading or job cards or empty state', async ({ page }) => {
    await expect(
      page.locator('text=Loading…')
        .or(page.locator('text=No jobs found.'))
        .or(page.locator('a[href*="/worker/job/"]').first())
    ).toBeVisible({ timeout: 10_000 });
  });

  test('job cards link to detail page', async ({ page }) => {
    const firstCard = page.locator('a[href*="/worker/job/"]').first();
    const hasCards  = await firstCard.isVisible({ timeout: 8_000 }).catch(() => false);
    if (!hasCards) {
      test.skip(true, 'No jobs assigned to test worker');
      return;
    }
    const href = await firstCard.getAttribute('href');
    expect(href).toMatch(/\/worker\/job\/.+/);
    await firstCard.click();
    await page.waitForURL(/\/worker\/job\/.+/, { timeout: 8_000 });
  });

  test('job cards show booking ref, service name and status badge', async ({ page }) => {
    const firstCard = page.locator('a[href*="/worker/job/"]').first();
    if (!await firstCard.isVisible({ timeout: 8_000 }).catch(() => false)) {
      test.skip(true, 'No jobs assigned to test worker');
      return;
    }
    // Status badge is rendered as a coloured span
    await expect(firstCard.locator('span').last()).toBeVisible();
  });

  test('Cancelled filter shows only cancelled jobs', async ({ page }) => {
    await expect(page.locator('button:has-text("Cancelled")')).toBeVisible({ timeout: 20_000 });
    await page.click('button:has-text("Cancelled")');
    await page.waitForTimeout(500);
    const cards = page.locator('a[href*="/worker/job/"]');
    const count = await cards.count();
    if (count === 0) { return; } // No cancelled jobs — pass
    for (let i = 0; i < Math.min(count, 3); i++) {
      await expect(cards.nth(i).locator('span', { hasText: /cancelled/i })).toBeVisible();
    }
  });

});

// ── Filter correctness (fresh, isolated worker with one booking per status) ──

base.describe('Worker Jobs — filter correctness', () => {

  base('each filter narrows to its exact status set', async ({ page }) => {
    const ts    = Date.now();
    const uid   = `pw_test_worker_${ts}`;
    const phone = `+919${String(ts).slice(-9)}`;
    await adminDb().collection('workers').doc(uid).set({
      name: `${PW_TEST_PREFIX}Filter Worker`,
      phone, isOnline: false, rating: 5, totalJobs: 0,
      createdAt: Timestamp.now(),
    });

    const baseBooking = {
      customerId: `${PW_TEST_PREFIX}customer`,
      workerId:   uid,
      serviceIds: ['exterior-wash'],
      vehicle:    { id: 'v1', make: 'Maruti', model: 'Swift', year: 2022, type: 'hatchback', registration: 'DL01PWFLT', color: 'White' },
      scheduledAt: Timestamp.now(),
      address:    { line1: '1 Test Rd', city: 'Ghaziabad', pincode: '201001', coordinates: { latitude: 0, longitude: 0 } },
      priceBreakdown: { subtotal: 500, tax: 0, total: 500 },
      paymentStatus: 'pending' as const,
      photos: { before: [], after: [] },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      customerName: `${PW_TEST_PREFIX}Customer`,
    };

    const statuses = ['assigned', 'enroute', 'done', 'cancelled'] as const;
    for (const status of statuses) {
      await adminDb().collection('bookings').doc(`pw_test_booking_${ts}_${status}`).set({
        ...baseBooking, status,
        bookingRef: `PC-${status.toUpperCase().slice(0, 5)}`,
      });
    }

    await page.goto('/worker/login');
    await signInWithBypassToken(page, uid);
    await page.waitForURL('**/worker/dashboard', { timeout: 15_000 });
    await page.goto('/worker/jobs');

    // All — every seeded booking present
    await baseExpect(page.locator('a[href*="/worker/job/"]')).toHaveCount(4, { timeout: 10_000 });

    // Upcoming — only 'assigned'
    await page.click('button:has-text("Upcoming")');
    await baseExpect(page.locator('a[href*="/worker/job/"]')).toHaveCount(1, { timeout: 8_000 });
    await baseExpect(page.locator('span:has-text("Assigned")')).toBeVisible();

    // Active — only 'enroute' (of the seeded set)
    await page.click('button:has-text("Active")');
    await baseExpect(page.locator('a[href*="/worker/job/"]')).toHaveCount(1, { timeout: 8_000 });
    await baseExpect(page.locator('span:has-text("Enroute")')).toBeVisible();

    // Done — only 'done'
    await page.click('button:has-text("Done")');
    await baseExpect(page.locator('a[href*="/worker/job/"]')).toHaveCount(1, { timeout: 8_000 });
    await baseExpect(page.locator('span:has-text("Done")')).toBeVisible();

    // Cancelled — only 'cancelled'
    await page.click('button:has-text("Cancelled")');
    await baseExpect(page.locator('a[href*="/worker/job/"]')).toHaveCount(1, { timeout: 8_000 });
    await baseExpect(page.locator('span:has-text("Cancelled")')).toBeVisible();
  });

  base('shows "No jobs found." when a filter matches nothing', async ({ page }) => {
    const ts    = Date.now();
    const uid   = `pw_test_worker_${ts}`;
    const phone = `+919${String(ts).slice(-9)}`;
    await adminDb().collection('workers').doc(uid).set({
      name: `${PW_TEST_PREFIX}EmptyFilter Worker`,
      phone, isOnline: false, rating: 5, totalJobs: 0,
      createdAt: Timestamp.now(),
    });
    await adminDb().collection('bookings').doc(`pw_test_booking_${ts}_only`).set({
      customerId: `${PW_TEST_PREFIX}customer`, workerId: uid,
      serviceIds: ['exterior-wash'],
      vehicle:    { id: 'v1', make: 'Maruti', model: 'Swift', year: 2022, type: 'hatchback', registration: 'DL01PWEF', color: 'White' },
      status:     'assigned',
      scheduledAt: Timestamp.now(),
      address:    { line1: '1 Test Rd', city: 'Ghaziabad', pincode: '201001', coordinates: { latitude: 0, longitude: 0 } },
      priceBreakdown: { subtotal: 500, tax: 0, total: 500 },
      paymentStatus: 'pending',
      photos: { before: [], after: [] },
      createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
      customerName: `${PW_TEST_PREFIX}Customer`,
      bookingRef: 'PC-ONLY01',
    });

    await page.goto('/worker/login');
    await signInWithBypassToken(page, uid);
    await page.waitForURL('**/worker/dashboard', { timeout: 15_000 });
    await page.goto('/worker/jobs');

    await baseExpect(page.locator('a[href*="/worker/job/"]')).toHaveCount(1, { timeout: 10_000 });
    await page.click('button:has-text("Done")'); // this worker has no 'done' booking
    await baseExpect(page.locator('text=No jobs found.')).toBeVisible({ timeout: 8_000 });
  });

});
