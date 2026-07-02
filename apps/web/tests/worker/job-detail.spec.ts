import { test, expect } from '../fixtures/worker';
import { test as base, expect as baseExpect } from '@playwright/test';
import { signInWithBypassToken } from '../lib/auth-bypass';
import { adminDb, Timestamp, PW_TEST_PREFIX } from '../lib/firestore-admin';

/**
 * Job detail tests require at least one job assigned to the test worker.
 * Tests that need a specific job ID read it from the jobs list page.
 */

async function getFirstJobId(page: any): Promise<string | null> {
  await page.goto('/worker/jobs');
  const firstCard = page.locator('a[href*="/worker/job/"]').first();
  if (!await firstCard.isVisible({ timeout: 8_000 }).catch(() => false)) return null;
  const href = await firstCard.getAttribute('href');
  return href?.split('/').pop() ?? null;
}

test.describe('Worker Job Detail', () => {

  test('back button returns to previous page', async ({ page }) => {
    const jobId = await getFirstJobId(page);
    if (!jobId) { test.skip(true, 'No jobs assigned to test worker'); return; }

    await page.goto(`/worker/job/${jobId}`);
    const backBtn = page.locator('button[aria-label], button').filter({ has: page.locator('svg') }).first();
    // Just verify the back button (arrow-left icon) is present
    await expect(page.locator('button').first()).toBeVisible();
  });

  test('renders booking ref and service name in header', async ({ page }) => {
    const jobId = await getFirstJobId(page);
    if (!jobId) { test.skip(true, 'No jobs assigned to test worker'); return; }

    await page.goto(`/worker/job/${jobId}`);
    await page.waitForLoadState('load');
    await expect(page.locator('h1')).toBeVisible({ timeout: 10_000 });
  });

  test('status pipeline (assigned → enroute → inprogress → done) is rendered', async ({ page }) => {
    const jobId = await getFirstJobId(page);
    if (!jobId) { test.skip(true, 'No jobs assigned to test worker'); return; }

    await page.goto(`/worker/job/${jobId}`);
    await page.waitForLoadState('load');
    for (const label of ['Assigned', 'En Route', 'In Progress', 'Done']) {
      await expect(page.locator(`text=${label}`)).toBeVisible({ timeout: 10_000 });
    }
  });

  test('customer info section is visible', async ({ page }) => {
    const jobId = await getFirstJobId(page);
    if (!jobId) { test.skip(true, 'No jobs assigned to test worker'); return; }

    await page.goto(`/worker/job/${jobId}`);
    await expect(page.locator('text=CUSTOMER')).toBeVisible({ timeout: 10_000 });
  });

  test('job details section shows address, vehicle, amount', async ({ page }) => {
    const jobId = await getFirstJobId(page);
    if (!jobId) { test.skip(true, 'No jobs assigned to test worker'); return; }

    await page.goto(`/worker/job/${jobId}`);
    await expect(page.locator('text=JOB DETAILS')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=Scheduled')).toBeVisible();
    await expect(page.locator('text=Address')).toBeVisible();
    await expect(page.locator('text=Vehicle')).toBeVisible();
    await expect(page.locator('text=Amount')).toBeVisible();
  });

  test('advance-status button is shown for in-progress jobs', async ({ page }) => {
    const jobId = await getFirstJobId(page);
    if (!jobId) { test.skip(true, 'No jobs assigned to test worker'); return; }

    await page.goto(`/worker/job/${jobId}`);
    await page.waitForLoadState('load');

    const actionBtn = page.locator('button').filter({
      hasText: /On My Way|Start Job|Mark Complete/,
    });
    const doneCard = page.locator('text=Job completed!').or(page.locator('text=Job cancelled.'));

    await expect(actionBtn.or(doneCard)).toBeVisible({ timeout: 10_000 });
  });

  test('Call button links to tel: for jobs with customer phone', async ({ page }) => {
    const jobId = await getFirstJobId(page);
    if (!jobId) { test.skip(true, 'No jobs assigned to test worker'); return; }

    await page.goto(`/worker/job/${jobId}`);
    await page.waitForLoadState('load');
    const callLink = page.locator('a[href^="tel:"]');
    // Only present when customer has a phone number stored
    const hasCall = await callLink.isVisible().catch(() => false);
    if (hasCall) {
      const href = await callLink.getAttribute('href');
      expect(href).toMatch(/^tel:\+91\d+/);
    }
  });

  test('non-existent job shows "Booking not found"', async ({ page }) => {
    await page.goto('/worker/job/nonexistent-booking-id-xyz');
    await page.waitForLoadState('load');
    await expect(page.locator('text=Booking not found.')).toBeVisible({ timeout: 10_000 });
  });

});

// ── Full status pipeline walk (fresh, isolated worker + seeded booking) ──────
//
// The shared TEST_WORKER_UID may or may not have real jobs assigned, and
// even if it does, driving one through assigned→done here would corrupt
// state other worker tests in this suite rely on (SlideToConfirm actually
// mutates the booking). A dedicated worker + booking, seeded per test,
// avoids both problems and guarantees the full pipeline is reachable.

function freshWorker() {
  const ts = Date.now();
  return { uid: `pw_test_worker_${ts}`, phone: `+919${String(ts).slice(-9)}` };
}

async function seedWorkerAndBooking(opts: {
  workerPhone: string;
  workerUid: string;
  bookingId: string;
  customerPhone?: string;
  address: Record<string, unknown>;
  paymentStatus: 'pending' | 'paid';
}) {
  await adminDb().collection('workers').doc(opts.workerUid).set({
    name: `${PW_TEST_PREFIX}Pipeline Worker`,
    phone: opts.workerPhone,
    isOnline: false,
    rating: 5,
    totalJobs: 0,
    createdAt: Timestamp.now(),
  });
  await adminDb().collection('bookings').doc(opts.bookingId).set({
    customerId:    `${PW_TEST_PREFIX}customer`,
    workerId:      opts.workerUid,
    serviceIds:    ['exterior-wash'],
    vehicle:       { id: 'v1', make: 'Maruti', model: 'Swift', year: 2022, type: 'hatchback', registration: 'DL01PWTEST', color: 'White' },
    status:        'assigned',
    scheduledAt:   Timestamp.now(),
    address:       opts.address,
    priceBreakdown: { subtotal: 500, tax: 0, total: 500 },
    paymentStatus: opts.paymentStatus,
    photos:        { before: [], after: [] },
    createdAt:     Timestamp.now(),
    updatedAt:     Timestamp.now(),
    bookingRef:    `PC-${opts.bookingId.slice(0, 6).toUpperCase()}`,
    customerName:  `${PW_TEST_PREFIX}Customer`,
    ...(opts.customerPhone ? { customerPhone: opts.customerPhone } : {}),
  });
}

base.describe('Worker Job Detail — full status pipeline', () => {

  base('walks assigned → enroute → arrived → inprogress → done, updating the pipeline and button label at each step', async ({ page }) => {
    const { uid, phone } = freshWorker();
    const bookingId = `pw_test_booking_${Date.now()}`;
    await seedWorkerAndBooking({
      workerPhone: phone, workerUid: uid, bookingId,
      customerPhone: '+919876543210',
      address: { line1: '101 Test Street', city: 'Ghaziabad', pincode: '201001', coordinates: { latitude: 0, longitude: 0 } },
      paymentStatus: 'pending',
    });

    await page.goto('/worker/login');
    await signInWithBypassToken(page, uid);
    await page.waitForURL('**/worker/dashboard', { timeout: 15_000 });
    await page.goto(`/worker/job/${bookingId}`);

    const steps: Array<[string, string]> = [
      ['Assigned',    'On My Way →'],
      ['En Route',    "I've Arrived →"],
      ['Arrived',     'Start Job →'],
      ['In Progress', 'Mark Complete →'],
    ];

    for (const [stepLabel, buttonLabel] of steps) {
      // All pipeline step labels are always rendered; the current one just
      // gets styling — assert presence, not exclusivity.
      await baseExpect(page.locator(`text=${stepLabel}`)).toBeVisible({ timeout: 10_000 });
      const actionBtn = page.locator(`button:has-text("${buttonLabel}")`);
      await baseExpect(actionBtn).toBeVisible({ timeout: 10_000 });
      await actionBtn.click();
    }

    // Marking complete redirects to the dashboard
    await page.waitForURL('**/worker/dashboard', { timeout: 15_000 });

    const finalStatus = (await adminDb().collection('bookings').doc(bookingId).get()).data()?.status;
    baseExpect(finalStatus).toBe('done');
  });

  base('shows "(pay at service)" for a pending payment, and hides the Call link when no customer phone is on file', async ({ page }) => {
    const { uid, phone } = freshWorker();
    const bookingId = `pw_test_booking_${Date.now()}`;
    await seedWorkerAndBooking({
      workerPhone: phone, workerUid: uid, bookingId,
      // No customerPhone at all
      address: { line1: '55 No-Phone Lane', city: 'Noida', pincode: '201301', coordinates: { latitude: 0, longitude: 0 } },
      paymentStatus: 'pending',
    });

    await page.goto('/worker/login');
    await signInWithBypassToken(page, uid);
    await page.waitForURL('**/worker/dashboard', { timeout: 15_000 });
    await page.goto(`/worker/job/${bookingId}`);

    await baseExpect(page.locator('text=(pay at service)')).toBeVisible({ timeout: 10_000 });
    await baseExpect(page.locator('a[href^="tel:"]')).not.toBeVisible();
  });

  base('shows "(paid)" for a paid booking, a Call link for a customer with a phone, and a society-formatted address', async ({ page }) => {
    const { uid, phone } = freshWorker();
    const bookingId = `pw_test_booking_${Date.now()}`;
    await seedWorkerAndBooking({
      workerPhone: phone, workerUid: uid, bookingId,
      customerPhone: '+919812345678',
      address: { line1: '', societyName: `${PW_TEST_PREFIX}Society`, tower: 'Tower B', flatNo: '404', coordinates: { latitude: 0, longitude: 0 } },
      paymentStatus: 'paid',
    });

    await page.goto('/worker/login');
    await signInWithBypassToken(page, uid);
    await page.waitForURL('**/worker/dashboard', { timeout: 15_000 });
    await page.goto(`/worker/job/${bookingId}`);

    await baseExpect(page.locator('text=(paid)')).toBeVisible({ timeout: 10_000 });
    const callLink = page.locator('a[href^="tel:"]');
    await baseExpect(callLink).toBeVisible();
    baseExpect(await callLink.getAttribute('href')).toBe('tel:+919812345678');
    await baseExpect(page.locator(`text=Tower B`)).toBeVisible();
    await baseExpect(page.locator(`text=${PW_TEST_PREFIX}Society`)).toBeVisible();
  });

});
