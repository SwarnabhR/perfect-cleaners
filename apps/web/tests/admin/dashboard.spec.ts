import { test, expect } from '../fixtures/admin';

test.describe('Admin Dashboard', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('loads the dashboard page', async ({ page }) => {
    await expect(page.locator('.admin-page-root')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('renders KPI cards', async ({ page }) => {
    // Wait for at least one KPI card to appear
    const cards = page.locator('.admin-page-root .kpi-grid-4');
    await expect(cards).toBeVisible();
  });

  test('sidebar navigation is visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('.sidebar-static')).toBeVisible();
    await expect(page.locator('.sidebar-static').getByText('Workers')).toBeVisible();
    await expect(page.locator('.sidebar-static').getByText('Societies')).toBeVisible();
    await expect(page.locator('.sidebar-static').getByText('Schedule')).toBeVisible();
  });

  test('top bar search is present', async ({ page }) => {
    await expect(page.locator('input[placeholder="Search cleaning sessions…"]')).toBeVisible();
  });

  test('top bar search navigates to live cleaning board', async ({ page }) => {
    const search = page.locator('input[placeholder="Search cleaning sessions…"]');
    await search.fill('test customer');
    await search.press('Enter');
    await page.waitForURL(/\/live-cleaning/, { timeout: 8_000 });
  });

  test('theme toggle button is present', async ({ page }) => {
    const toggleBtn = page.locator('button[aria-label*="light mode"], button[aria-label*="dark mode"]');
    await expect(toggleBtn).toBeVisible();
  });

  test('alerts button opens popover', async ({ page }) => {
    await page.click('button:has-text("Alerts")');
    await expect(page.locator('text=No new alerts.')).toBeVisible();
  });

  test('sidebar links navigate to correct pages', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const links = [
      { text: 'Societies',  url: /\/societies-mgmt/ },
      { text: 'Workers',    url: /\/workers/   },
      { text: 'Customers',  url: /\/customers/  },
    ];

    for (const { text, url } of links) {
      await page.goto('/dashboard');
      await page.click(`.sidebar-static a:has-text("${text}")`);
      await page.waitForURL(url, { timeout: 10_000 });
      await expect(page.locator('.admin-page-root')).toBeVisible();
    }
  });

  test('unauthenticated access redirects to login', async ({ browser }) => {
    // New context with no stored auth state
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto('/dashboard');
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expect(page.locator('h1')).toContainText('Sign in');
    await ctx.close();
  });

});
