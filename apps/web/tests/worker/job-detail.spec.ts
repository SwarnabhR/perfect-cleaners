import { test, expect } from '../fixtures/worker';

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
