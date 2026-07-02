/**
 * /account/cleaning — the society self-signup / recurring-cleaning schedule
 * page. Three states driven by customerSocietyRecords status, keyed by
 * customerId (== the signed-in Firebase Auth uid):
 *
 *   A. no record            → SelfSignupForm ("Join the society programme.")
 *   B. status === 'pending' → editable day/time prefs + SUBMITTED DETAILS
 *   C. status === 'active'  → YOUR PROGRAMME card, skip/undo-skip, RECENT CLEANINGS
 *
 * State A→B is exercised through the REAL self-signup form (fill + submit),
 * which writes pendingApprovals + customerSocietyRecords and the page's own
 * onSnapshot listener flips the UI to "pending" live, no reload needed. State
 * C can only be reached by an admin approving a request in real usage, so
 * it's seeded directly via the Firestore Admin SDK (tagged PW_TEST_ — no
 * isolated test project exists, see tests/lib/firestore-admin.ts).
 *
 * Each test signs in as its own fresh UID (not the shared TEST_CUSTOMER_UID)
 * so these three mutually-exclusive states never collide with each other.
 */
import { test, expect } from '@playwright/test';
import { signInWithBypassToken } from '../lib/auth-bypass';
import { adminDb, Timestamp, PW_TEST_PREFIX } from '../lib/firestore-admin';

function freshCustomer() {
  const ts = Date.now();
  return {
    uid:   `pw_test_customer_${ts}`,
    phone: `+919${String(ts).slice(-9)}`,
  };
}

async function signInFresh(page: import('@playwright/test').Page) {
  const { uid, phone } = freshCustomer();
  await page.goto('/signin');
  await signInWithBypassToken(page, uid, { persistence: 'session', phone });
  await page.waitForURL('**/account', { timeout: 15_000 });
  return { uid, phone };
}

test.describe('Customer Cleaning Schedule — not enrolled (state A)', () => {

  test('shows the self-signup form with all required fields', async ({ page }) => {
    await signInFresh(page);
    await page.click('a:has-text("Schedule")');
    await page.waitForURL('**/account/cleaning');
    await expect(page.locator('text=[NOT ENROLLED]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=Join the society programme.')).toBeVisible();
    await expect(page.locator('input[placeholder="Full name"]')).toBeVisible();
    await expect(page.locator('select').first()).toBeVisible(); // Society
    await expect(page.locator('input[placeholder="DL 01 AB 1234"]')).toBeVisible();
    await expect(page.locator('button:has-text("Request Enrolment")')).toBeVisible();
  });

  test('rejects a whitespace-only name on submit', async ({ page }) => {
    // Society AND tower must both be validly selected — otherwise the native
    // HTML5 `required` on those <select>s blocks the submit event before it
    // ever reaches the handler's own JS validation, and the whitespace-name
    // check we're actually testing never gets exercised.
    const societiesSnap = await adminDb().collection('societies').where('isActive', '==', true).limit(5).get();
    const withTower = societiesSnap.docs.find(d => (d.data().towers ?? []).length > 0);
    if (!withTower) { test.skip(true, 'No active society with a tower configured'); return; }
    const society = { name: withTower.data().name as string, tower: (withTower.data().towers as string[])[0] };

    await signInFresh(page);
    await page.click('a:has-text("Schedule")');
    await page.waitForURL('**/account/cleaning');
    await expect(page.locator('button:has-text("Request Enrolment")')).toBeVisible({ timeout: 10_000 });

    // Native `required` blocks an empty name, but not a whitespace one —
    // that's caught by the handler's own `.trim()` check instead.
    await page.fill('input[placeholder="Full name"]', '   ');
    await page.locator('select').first().selectOption({ label: society.name });
    const towerSelect = page.locator('select').nth(1);
    await expect(towerSelect.locator(`option:has-text("${society.tower}")`)).toHaveCount(1, { timeout: 5_000 });
    await towerSelect.selectOption({ label: society.tower });
    await page.fill('input[placeholder="DL 01 AB 1234"]', 'DL01AB1234');
    await page.click('button:has-text("Request Enrolment")');
    await expect(page.locator('text=Please fill in all required fields.')).toBeVisible({ timeout: 5_000 });
  });

});

test.describe('Customer Cleaning Schedule — self-signup submits and flips to pending (state A→B)', () => {

  test('submitting a valid enrolment request transitions live to [PENDING APPROVAL]', async ({ page }) => {
    // Needs a real active society with at least one tower — skip cleanly if none exist.
    const societiesSnap = await adminDb().collection('societies').where('isActive', '==', true).limit(5).get();
    const withTower = societiesSnap.docs.find(d => (d.data().towers ?? []).length > 0);
    if (!withTower) { test.skip(true, 'No active society with a tower configured'); return; }
    const society = { id: withTower.id, name: withTower.data().name as string, tower: (withTower.data().towers as string[])[0] };

    await signInFresh(page);
    await page.click('a:has-text("Schedule")');
    await page.waitForURL('**/account/cleaning');
    await expect(page.locator('input[placeholder="Full name"]')).toBeVisible({ timeout: 10_000 });

    await page.fill('input[placeholder="Full name"]', `${PW_TEST_PREFIX}Enrolment Tester`);
    await page.locator('select').first().selectOption({ label: society.name });
    // Tower <select> is the second one and only populates once society is chosen.
    const towerSelect = page.locator('select').nth(1);
    await expect(towerSelect.locator(`option:has-text("${society.tower}")`)).toHaveCount(1, { timeout: 5_000 });
    await towerSelect.selectOption({ label: society.tower });
    await page.fill('input[placeholder="DL 01 AB 1234"]', 'DL01PWTEST');
    await page.fill('input[placeholder="Maruti, Honda…"]', 'Maruti');
    await page.fill('input[placeholder="Swift, City…"]', 'Swift');

    await page.click('button:has-text("Request Enrolment")');

    // No reload — the page's own onSnapshot listener flips it to pending live.
    await expect(page.locator('text=[PENDING APPROVAL]')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('text=Your registration is under review.')).toBeVisible();
    await expect(page.locator('text=SUBMITTED DETAILS')).toBeVisible();
    await expect(page.locator(`text=${society.tower}`).first()).toBeVisible();
    await expect(page.locator('text=DL01PWTEST')).toBeVisible();
    // Day/time preference stays editable while pending (not locked).
    await expect(page.locator('text=PREFERRED CLEANING DAYS')).toBeVisible();
    await expect(page.locator('text=PREFERRED CLEANING TIME')).toBeVisible();
  });

});

test.describe('Customer Cleaning Schedule — active enrolment (state C, seeded)', () => {

  test('shows programme summary, lets a cleaning be skipped and un-skipped, and shows recent cleanings', async ({ page }) => {
    // Three Firestore Admin SDK round-trips (1 query + 2 writes) before the
    // browser even navigates — comfortably slower than a typical UI-only test.
    test.setTimeout(90_000);
    const societiesSnap = await adminDb().collection('societies').where('isActive', '==', true).limit(5).get();
    const withTower = societiesSnap.docs.find(d => (d.data().towers ?? []).length > 0);
    if (!withTower) { test.skip(true, 'No active society with a tower configured'); return; }
    const societyId   = withTower.id;
    const societyName = withTower.data().name as string;
    const tower        = (withTower.data().towers as string[])[0];

    const { uid, phone } = freshCustomer();
    await adminDb().collection('customerSocietyRecords').add({
      customerId:            uid,
      customerName:          `${PW_TEST_PREFIX}Active Tester`,
      customerPhone:         phone,
      societyId, societyName, tower,
      cars: [{ plate: 'DL01PWACTV', make: 'Hyundai', model: 'i20' }],
      preferredCleaningTime: 9,
      preferredCleaningDays: [1, 3, 5], // DayOfWeek: 0=Sun..6=Sat — Mon/Wed/Fri
      signupSource:          'self_signup',
      status:                'active',
      monthlyFee:            600,
      nextBillingDate:       Timestamp.fromMillis(Date.now() + 30 * 86_400_000),
      paymentStatus:         'verified',
      skipDates:             [],
      rescheduledSlots:      [],
      createdAt:             Timestamp.now(),
      updatedAt:             Timestamp.now(),
    });

    await adminDb().collection('cleaningLogs').add({
      societyId, societyName,
      vehicleRegistration: 'DL01PWACTV',
      vehicleMake: 'Hyundai', vehicleModel: 'i20',
      customerId: uid,
      customerName: `${PW_TEST_PREFIX}Active Tester`,
      unitNumber: tower,
      workerId: `${PW_TEST_PREFIX}worker`,
      workerName: `${PW_TEST_PREFIX}Worker`,
      cleanedAt: Timestamp.now(),
      serviceType: 'exterior',
      servicePrice: 150,
      photoUrls: [],
      notificationSent: false,
      billed: true,
    });

    await page.goto('/signin');
    await signInWithBypassToken(page, uid, { persistence: 'session', phone });
    await page.waitForURL('**/account', { timeout: 15_000 });
    await page.click('a:has-text("Schedule")');
    await page.waitForURL('**/account/cleaning');

    await expect(page.locator('text=YOUR PROGRAMME')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=ACTIVE')).toBeVisible();
    await expect(page.locator(`text=${societyName}`).first()).toBeVisible();
    await expect(page.locator('text=DL01PWACTV').first()).toBeVisible();
    await expect(page.locator('text=₹600')).toBeVisible();

    // Skip / undo-skip an upcoming cleaning
    await expect(page.locator('text=UPCOMING CLEANINGS')).toBeVisible({ timeout: 10_000 });
    const skipBtn = page.locator('button:has-text("Skip")').first();
    await expect(skipBtn).toBeVisible();
    await skipBtn.click();
    const undoBtn = page.locator('button:has-text("Undo skip")').first();
    await expect(undoBtn).toBeVisible({ timeout: 8_000 });
    await undoBtn.click();
    await expect(page.locator('button:has-text("Skip")').first()).toBeVisible({ timeout: 8_000 });

    // Recent cleaning log seeded above
    await expect(page.locator('text=RECENT CLEANINGS')).toBeVisible();
    await expect(page.locator(`text=cleaned by ${PW_TEST_PREFIX}Worker`)).toBeVisible();
  });

});
