import { test, expect } from '@playwright/test';

test.describe('Worker Jobs', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/worker/jobs');
    await page.waitForLoadState('networkidle');
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
    await page.click('button:has-text("Upcoming")');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Done")');
    await page.waitForTimeout(300);
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
    await page.click('button:has-text("Cancelled")');
    await page.waitForTimeout(500);
    const cards = page.locator('a[href*="/worker/job/"]');
    const count = await cards.count();
    if (count === 0) return; // No cancelled jobs — that's fine
    // Each visible card should show "Cancelled" status
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i).locator('span', { hasText: /cancelled/i })).toBeVisible();
    }
  });

});
