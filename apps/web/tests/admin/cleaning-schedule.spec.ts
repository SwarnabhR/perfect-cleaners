import { test, expect } from '../fixtures/admin';
import { adminDb, Timestamp, PW_TEST_PREFIX } from '../lib/firestore-admin';

test.describe('Admin Cleaning Schedule', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/cleaning-schedule');
    await expect(page.locator('.admin-page-root')).toBeVisible();
  });

  test('renders page heading and eyebrow', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Weekly Cleaning Schedule');
    await expect(page.locator('text="OPERATIONS"')).toBeVisible();
  });

  test('renders three KPI cards', async ({ page }) => {
    const kpis = page.locator('.kpi-grid-3');
    for (const label of ['AWAITING WORKERS', 'CLEANING IN PROGRESS', 'ALL CARS CLEANED']) {
      await expect(kpis.locator(`text=${label}`)).toBeVisible({ timeout: 15_000 });
    }
  });

  test('status filter buttons are visible', async ({ page }) => {
    await expect(page.locator('button:has-text("All")').first()).toBeVisible();
    for (const status of ['scheduled', 'inprogress', 'done']) {
      await expect(page.locator(`button:has-text("${status}")`)).toBeVisible();
    }
  });

  test('shows session rows or the empty state', async ({ page }) => {
    await expect(
      page.locator('text=No sessions scheduled')
        .or(page.locator('text=CARS DONE').first())
    ).toBeVisible({ timeout: 20_000 });
  });

  test('Create Session modal opens with all fields', async ({ page }) => {
    await page.locator('button:has-text("Create Session")').first().click();
    await expect(page.locator('text=Create Cleaning Session')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('text="Society"')).toBeVisible();
    await expect(page.locator('text="Tower"')).toBeVisible();
    await expect(page.locator('text="Scheduled Date"')).toBeVisible();
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.locator('text="Assign Workers"')).toBeVisible();
    await expect(page.locator('text=/\\d+ workers? selected/')).toBeVisible();
    await expect(page.locator('button:has-text("Create Session")').last()).toBeDisabled();
    await page.locator('button:has-text("Cancel")').click();
    await expect(page.locator('text=Create Cleaning Session')).not.toBeVisible({ timeout: 5_000 });
  });

  test('Reassign opens the Reassign Workers modal', async ({ page }) => {
    const btn = page.locator('button:has-text("Reassign")').first();
    if (!await btn.isVisible({ timeout: 20_000 }).catch(() => false)) {
      test.skip(true, 'No scheduled/in-progress session to reassign');
      return;
    }
    await btn.click();
    await expect(page.locator('text=Reassign Workers')).toBeVisible({ timeout: 8_000 });
    await page.locator('button:has-text("Cancel")').click();
  });

  test('Mark Missed opens a reason + notes modal', async ({ page }) => {
    const btn = page.locator('button:has-text("Mark Missed")').first();
    if (!await btn.isVisible({ timeout: 20_000 }).catch(() => false)) {
      test.skip(true, 'No scheduled/in-progress session to mark missed');
      return;
    }
    await btn.click();
    await expect(page.locator('text=Mark Cleaning Missed')).toBeVisible({ timeout: 8_000 });
    for (const reason of ['Society holiday', 'Worker unavailable', 'Other']) {
      await expect(page.locator(`text=${reason}`)).toBeVisible();
    }
    await expect(page.locator('textarea[placeholder*="Diwali holiday"]')).toBeVisible();
    await page.locator('button:has-text("Cancel")').click();
    await expect(page.locator('text=Mark Cleaning Missed')).not.toBeVisible({ timeout: 5_000 });
  });

  test('Start button is present on a scheduled session', async ({ page }) => {
    const btn = page.locator('button:has-text("Start")').first();
    if (!await btn.isVisible({ timeout: 20_000 }).catch(() => false)) {
      test.skip(true, 'No scheduled session to start');
      return;
    }
    await expect(btn).toBeVisible();
  });

  test('Delete button is present on every session row', async ({ page }) => {
    const btn = page.locator('button:has-text("Delete")').first();
    if (!await btn.isVisible({ timeout: 20_000 }).catch(() => false)) {
      test.skip(true, 'No sessions to test Delete on');
      return;
    }
    await expect(btn).toBeVisible();
  });

});

// ── Create Session populates cars[] from active enrollments ────────────────
// Regression coverage: creating a session here previously always wrote an
// empty cars[]/totalCars: 0, which meant the Live Cleaning board could never
// show anything for it and the first "car cleaned" tap anywhere downstream
// would immediately fail (0 >= 0). This exercises the real create flow end
// to end against a society/tower with a seeded active enrollment.

test.describe('Admin Cleaning Schedule — Create Session populates cars', () => {

  test('a session created for a tower with an active enrollment gets a non-empty cars[]', async ({ page }) => {
    const ts = Date.now();
    const societyId = `pw_test_society_sched_${ts}`;
    const societyName = `${PW_TEST_PREFIX}Schedule Society ${ts}`; // unique per run — repeat runs otherwise
    const tower = 'Tower Sched';                                   // pile up societies with identical names,
    const customerId = `pw_test_cust_sched_${ts}`;                 // and selectOption({label}) picks the first match.

    await adminDb().collection('societies').doc(societyId).set({
      name: societyName, address: 'Test', city: 'Test', pincode: '000000',
      towers: [tower], totalUnits: 10, activeResidents: 1, vehicleCount: 1,
      isActive: true, pricePerWash: 0, cleaningSchedule: 'Mon, Wed, Fri · 9:00 AM',
      contactPerson: { name: 'Test', phone: '+910000000000', role: 'Facility Manager' },
      assignedWorkerIds: [], contractStart: Timestamp.now(), createdAt: Timestamp.now(),
    });
    await adminDb().collection('customerSocietyRecords').add({
      customerId, customerName: `${PW_TEST_PREFIX}Sched Customer`, customerPhone: '+919000000001',
      societyId, societyName, tower,
      cars: [{ plate: 'PW 00 SC 0001', make: 'Test', model: 'Car' }],
      preferredCleaningTime: 9, signupSource: 'bulk_import', status: 'active',
      monthlyFee: 500, nextBillingDate: Timestamp.now(), paymentStatus: 'verified',
      skipDates: [], rescheduledSlots: [],
      createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    });

    await page.goto('/cleaning-schedule');
    await expect(page.locator('.admin-page-root')).toBeVisible();
    await page.locator('button:has-text("Create Session")').first().click();
    await expect(page.locator('text=Create Cleaning Session')).toBeVisible({ timeout: 8_000 });
    await page.selectOption('select >> nth=0', { label: societyName });
    await page.selectOption('select >> nth=1', { label: tower });
    const workerCheckbox = page.locator('label').first().locator('input[type="checkbox"]');
    if (await workerCheckbox.count() === 0) { test.skip(true, 'No workers available to assign'); return; }
    await workerCheckbox.check();
    await page.locator('form button:has-text("Create Session")').click();
    await expect(page.locator('text=Create Cleaning Session')).not.toBeVisible({ timeout: 8_000 });

    const dateStr = new Date().toISOString().split('T')[0];
    const sessionId = `${societyId}_${tower}_${dateStr}`;
    await expect.poll(async () => {
      const snap = await adminDb().collection('cleaningSessions').doc(sessionId).get();
      return snap.data()?.totalCars;
    }, { timeout: 10_000 }).toBe(1);

    const snap = await adminDb().collection('cleaningSessions').doc(sessionId).get();
    expect(snap.data()?.cars?.[0]?.carPlate).toBe('PW 00 SC 0001');
  });

});
