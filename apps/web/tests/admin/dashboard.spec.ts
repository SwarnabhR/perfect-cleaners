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
    // The dashboard now renders more than one .kpi-grid-4 row (the original
    // revenue/jobs/workers row plus the society-programme row), so this has to
    // scope to the first rather than assert a bare locator resolves uniquely.
    const cards = page.locator('.admin-page-root .kpi-grid-4');
    await expect(cards.first()).toBeVisible();
  });

  test('sidebar navigation is visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('.sidebar-static')).toBeVisible();
    await expect(page.locator('.sidebar-static').getByText('Workers')).toBeVisible();
    await expect(page.locator('.sidebar-static').getByText('Societies')).toBeVisible();
    // The schedule entry is labelled "Session Monitor" (it still points at
    // /cleaning-schedule) — see NAV in (admin)/layout.tsx.
    await expect(page.locator('.sidebar-static').getByText('Session Monitor')).toBeVisible();
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
    // Scoped to the popover itself: its contents are either the empty-state
    // copy or a list of real cron/delivery alert links, so asserting on the
    // container (plus its ALERTS heading) works either way — and doesn't
    // accidentally match the sidebar's own hidden /notifications link.
    const popover = page.locator('.admin-dropdown-pop').first();
    await expect(popover).toBeVisible();
    await expect(popover.locator('text=ALERTS')).toBeVisible();
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
