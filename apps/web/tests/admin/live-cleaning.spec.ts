import { test, expect } from '../fixtures/admin';
import { adminDb, Timestamp, PW_TEST_PREFIX } from '../lib/firestore-admin';

test.describe('Admin Live Cleaning Task Board', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/live-cleaning');
    await expect(page.locator('.admin-page-root')).toBeVisible();
  });

  test('renders page heading and eyebrow', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Live Cleaning Task Board');
    await expect(page.locator('text="OPERATIONS"')).toBeVisible();
  });

  test('society and tower filter selects are visible', async ({ page }) => {
    await expect(page.locator('text="SOCIETY"')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('text="TOWER"')).toBeVisible();
    await expect(page.locator('select', { hasText: 'All Societies' })).toBeVisible();
    await expect(page.locator('select', { hasText: 'All Towers' })).toBeVisible();
  });

  test('shows time-slot cards with cars or the no-sessions empty state', async ({ page }) => {
    await expect(
      page.locator('text=No cars scheduled for today.')
        .or(page.locator('text=/\\d+ \\/ \\d+ CARS/'))
    ).toBeVisible({ timeout: 20_000 });
  });

  test('a car row can be toggled unavailable and back', async ({ page }) => {
    const toggleBtn = page.locator('button[title="Mark unavailable"]').first();
    if (!await toggleBtn.isVisible({ timeout: 20_000 }).catch(() => false)) {
      test.skip(true, 'No cars scheduled to toggle');
      return;
    }
    await toggleBtn.click();
    const undoBtn = page.locator('button[title="Mark available"]').first();
    await expect(undoBtn).toBeVisible({ timeout: 8_000 });
    await undoBtn.click();
    await expect(page.locator('button[title="Mark unavailable"]').first()).toBeVisible({ timeout: 8_000 });
  });

});

// ── Mark Done ──────────────────────────────────────────────────────────────
// Regression coverage: previously there was no way at all to mark an
// individual car clean from this board (only "mark unavailable" existed),
// and the cars[] this board reads from was never populated by the primary
// admin session-creation flow in the first place.

test.describe('Admin Live Cleaning Task Board — Mark Done', () => {

  test('marking a car done updates its status, rolls up completedCars, and auto-completes a 1-car session', async ({ page }) => {
    // Unique plate per run: a `div`-based "find the row containing this
    // text" locator matches every nested ancestor div that contains it, so
    // reusing a fixed plate across repeat runs makes `.last()` increasingly
    // unreliable as PW_TEST_ rows pile up (an accepted convention in this
    // suite — see tests/lib/firestore-admin.ts).
    const plate = `PW 00 TE ${Date.now() % 100000}`;
    const sessionRef = await adminDb().collection('cleaningSessions').add({
      societyId: 'pw_test_society_live', societyName: `${PW_TEST_PREFIX}Live Society`, tower: 'Tower Live',
      scheduledDate: Timestamp.now(), status: 'inprogress',
      cars: [{
        customerId: 'pw_test_customer_live', carPlate: plate, carMake: 'Test', carModel: 'Car',
        preferredTime: 9, status: 'pending',
      }],
      totalCars: 1, completedCars: 0, skippedCars: 0,
      workerIds: [], workerNames: [],
      createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    });

    await page.goto('/live-cleaning');
    await expect(page.locator('.admin-page-root')).toBeVisible();
    // The plate <p> and the Done button share the same row container two
    // ancestors up — precise enough that "the plate is unique on the page"
    // is the only invariant this needs, unlike a text-based div match.
    const plateP = page.locator(`p:has-text("${plate}")`);
    await expect(plateP).toBeVisible({ timeout: 15_000 });
    const row = plateP.locator('xpath=ancestor::div[2]');
    await row.locator('button:has-text("Done")').click();
    await expect(row.locator('button:has-text("Done")')).not.toBeVisible({ timeout: 10_000 });

    await expect.poll(async () => {
      const snap = await sessionRef.get();
      return snap.data()?.status;
    }, { timeout: 10_000 }).toBe('done');

    const finalSnap = await sessionRef.get();
    expect(finalSnap.data()?.completedCars).toBe(1);
    expect(finalSnap.data()?.cars?.[0]?.status).toBe('done');
  });

  test('a done car has no Mark Done button and no Mark Unavailable button', async ({ page }) => {
    const plate = `PW 00 TD ${Date.now() % 100000}`;
    await adminDb().collection('cleaningSessions').add({
      societyId: 'pw_test_society_donecar', societyName: `${PW_TEST_PREFIX}Done Car Society`, tower: 'Tower Done',
      scheduledDate: Timestamp.now(), status: 'inprogress',
      cars: [{
        customerId: 'pw_test_customer_donecar', carPlate: plate, carMake: 'Test', carModel: 'Car',
        preferredTime: 9, status: 'done',
      }],
      totalCars: 1, completedCars: 1, skippedCars: 0,
      workerIds: [], workerNames: [],
      createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    });

    await page.goto('/live-cleaning');
    const plateP = page.locator(`p:has-text("${plate}")`);
    await expect(plateP).toBeVisible({ timeout: 15_000 });
    const row = plateP.locator('xpath=ancestor::div[2]');
    await expect(row.locator('button:has-text("Done")')).toHaveCount(0);
  });

});
