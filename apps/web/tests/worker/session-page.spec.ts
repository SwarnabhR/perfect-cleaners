import { test as base, expect as baseExpect } from '@playwright/test';
import { signInWithBypassToken } from '../lib/auth-bypass';
import { adminDb, Timestamp, PW_TEST_PREFIX } from '../lib/firestore-admin';

// Regression coverage for a bug found by hand: SessionClient.tsx called the
// session action API with no Authorization header at all, so every tap on
// START SESSION / +CAR CLEANED / MARK SESSION COMPLETE failed with
// "Unauthorized." regardless of who was signed in. Fixed by attaching the
// signed-in worker's Firebase ID token to the request.

base.describe('Worker session page (/session/[id])', () => {

  base('the assigned worker can start a scheduled session', async ({ page }) => {
    const ts  = Date.now();
    const uid = `pw_test_worker_${ts}`;
    const phone = `+919${String(ts).slice(-9)}`;
    await adminDb().collection('workers').doc(uid).set({
      name: `${PW_TEST_PREFIX}Session Page Worker`,
      phone, isOnline: true, rating: 5, totalJobs: 0,
      createdAt: Timestamp.now(),
    });
    const sessionRef = await adminDb().collection('cleaningSessions').add({
      societyId: 'pw_test_society_sp', societyName: `${PW_TEST_PREFIX}Session Page Society`, tower: 'Tower SP',
      workerId: uid, workerName: `${PW_TEST_PREFIX}Session Page Worker`,
      scheduledDate: Timestamp.now(), status: 'scheduled',
      totalCars: 5, completedCars: 0,
      createdAt: Timestamp.now(),
    });

    await page.goto('/worker/login');
    await signInWithBypassToken(page, uid);
    await page.waitForURL('**/worker/dashboard', { timeout: 15_000 });

    const [response] = await Promise.all([
      page.waitForResponse(r => r.url().includes(`/api/session/${sessionRef.id}`) && r.request().method() === 'POST'),
      (async () => {
        await page.goto(`/session/${sessionRef.id}`);
        await page.click('button:has-text("START SESSION")');
      })(),
    ]);

    baseExpect(response.status()).toBe(200);
    await baseExpect(page.locator('text=In progress')).toBeVisible({ timeout: 10_000 });
    await baseExpect(page.locator('text=Unauthorized')).not.toBeVisible();

    const snap = await sessionRef.get();
    baseExpect(snap.data()?.status).toBe('inprogress');
  });

  base('an unauthenticated visitor sees the page but cannot start the session', async ({ browser }) => {
    const ts  = Date.now();
    const sessionRef = await adminDb().collection('cleaningSessions').add({
      societyId: 'pw_test_society_sp2', societyName: `${PW_TEST_PREFIX}Session Page Society 2`, tower: 'Tower SP2',
      workerId: `pw_test_worker_${ts}_owner`, workerName: `${PW_TEST_PREFIX}Owner`,
      scheduledDate: Timestamp.now(), status: 'scheduled',
      totalCars: 2, completedCars: 0,
      createdAt: Timestamp.now(),
    });

    const ctx  = await browser.newContext(); // no signed-in user
    const page = await ctx.newPage();
    await page.goto(`/session/${sessionRef.id}`);
    await baseExpect(page.locator('button:has-text("START SESSION")')).toBeVisible({ timeout: 10_000 });
    await page.click('button:has-text("START SESSION")');
    // "Assigned to" in the page's own footer copy also substring-matches a
    // loose /sign/i pattern — anchor to the actual error copy instead.
    await baseExpect(page.locator('text=/need to be signed in|Unauthorized/i')).toBeVisible({ timeout: 10_000 });

    const snap = await sessionRef.get();
    baseExpect(snap.data()?.status).toBe('scheduled'); // unchanged
    await ctx.close();
  });

});
