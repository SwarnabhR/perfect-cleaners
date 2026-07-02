/**
 * Auth guard tests — every protected route redirects unauthenticated users
 * to the correct login page, preserving the original path in the ?from param.
 *
 * All tests run WITHOUT stored auth state (plain browser.newContext()).
 */
import { test, expect, type Browser } from '@playwright/test';

async function unauthedPage(browser: Browser) {
  const ctx  = await browser.newContext();
  const page = await ctx.newPage();
  return { page, ctx };
}

// ── Customer account routes ──────────────────────────────────────────────────

const CUSTOMER_PROTECTED = [
  '/account',
  '/account/profile',
  '/account/wallet',
];

for (const route of CUSTOMER_PROTECTED) {
  test(`${route} redirects unauthenticated customer to /signin`, async ({ browser }) => {
    const { page, ctx } = await unauthedPage(browser);
    await page.goto(route);
    await page.waitForURL(/\/signin/, { timeout: 10_000 });
    expect(page.url()).toContain('/signin');
    await ctx.close();
  });

  test(`${route} preserves ?from param in redirect`, async ({ browser }) => {
    const { page, ctx } = await unauthedPage(browser);
    await page.goto(route);
    await page.waitForURL(/\/signin/, { timeout: 10_000 });
    expect(decodeURIComponent(page.url())).toContain(route);
    await ctx.close();
  });
}

// ── Worker routes ────────────────────────────────────────────────────────────

const WORKER_PROTECTED = [
  '/worker/dashboard',
  '/worker/jobs',
  '/worker/cleaning-logs',
  '/worker/profile',
];

for (const route of WORKER_PROTECTED) {
  test(`${route} redirects unauthenticated worker to /worker/login`, async ({ browser }) => {
    const { page, ctx } = await unauthedPage(browser);
    await page.goto(route);
    await page.waitForURL(/\/worker\/login/, { timeout: 10_000 });
    expect(page.url()).toContain('/worker/login');
    await ctx.close();
  });

  test(`${route} preserves ?from param in worker redirect`, async ({ browser }) => {
    const { page, ctx } = await unauthedPage(browser);
    await page.goto(route);
    await page.waitForURL(/\/worker\/login/, { timeout: 10_000 });
    expect(decodeURIComponent(page.url())).toContain(route);
    await ctx.close();
  });
}

// ── Admin routes ─────────────────────────────────────────────────────────────

const ADMIN_PROTECTED = [
  '/dashboard',
  '/bookings',
  '/workers',
  '/customers',
  '/societies-mgmt',
  '/services-mgmt',
  '/promotions',
  '/analytics',
  '/settings',
  '/billing',
];

for (const route of ADMIN_PROTECTED) {
  test(`${route} redirects unauthenticated admin to /login`, async ({ browser }) => {
    const { page, ctx } = await unauthedPage(browser);
    await page.goto(route);
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toMatch(/\/login/);
    // Must show the admin sign-in form
    await expect(page.locator('h1')).toContainText('Sign in');
    await ctx.close();
  });
}

// ── Public pages stay accessible ─────────────────────────────────────────────

const PUBLIC_PAGES = ['/', '/for-societies', '/services', '/about', '/contact', '/faq', '/signin'];

for (const route of PUBLIC_PAGES) {
  test(`${route} is accessible without authentication`, async ({ browser }) => {
    const { page, ctx } = await unauthedPage(browser);
    await page.goto(route);
    await page.waitForLoadState('load');
    // Should NOT redirect to a login page
    expect(page.url()).not.toMatch(/\/(signin|login|worker\/login)\?from/);
    await ctx.close();
  });
}
