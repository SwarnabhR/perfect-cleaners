/**
 * Marketing / support surface — /for-societies (top-of-funnel entry point),
 * /contact (lead-capture form), /app (mobile-app waitlist), /societies
 * (legacy redirect). All run unauthenticated — no customer session needed.
 */
import { test, expect } from '@playwright/test';
import { PW_TEST_PREFIX } from '../lib/firestore-admin';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('For Societies (marketing entry point)', () => {

  test('renders heading and both CTAs link to /contact', async ({ page }) => {
    await page.goto('/for-societies');
    await expect(page.locator('text=For Residential Societies')).toBeVisible();
    await expect(page.locator('h1')).toContainText('One booking.');

    const registerCta = page.locator('a:has-text("Register your society")').first();
    await expect(registerCta).toBeVisible();
    expect(await registerCta.getAttribute('href')).toBe('/contact');

    const contactCta = page.locator('a:has-text("Contact Us")').first();
    await expect(contactCta).toBeVisible();
    expect(await contactCta.getAttribute('href')).toBe('/contact');
  });

});

test.describe('/societies legacy redirect', () => {

  test('redirects to /for-societies', async ({ page }) => {
    await page.goto('/societies');
    await page.waitForURL('**/for-societies');
    expect(page.url()).toContain('/for-societies');
  });

});

test.describe('Contact form', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  test('renders heading and enquiry-type options', async ({ page }) => {
    await expect(page.locator('text=[GET IN TOUCH]')).toBeVisible();
    await expect(page.locator('h1')).toContainText("We're Here");
    const options = page.locator('#cf-service option');
    await expect(options).toHaveCount(7); // placeholder + 6 SERVICES entries
    await expect(page.locator('#cf-service option', { hasText: 'List My Society' })).toHaveCount(1);
  });

  test('validates required name and message before submitting', async ({ page }) => {
    // Both fields have native HTML `required`, which blocks submission
    // before the handler's own JS check ever runs for a truly empty value —
    // whitespace-only passes `required` but still fails the handler's own
    // `.trim()` check, so it's the only way to exercise this message.
    await page.fill('#cf-name', '   ');
    await page.fill('#cf-message', '   ');
    await page.click('button:has-text("Send Message")');
    await expect(page.locator('text=Please fill in your name and message.')).toBeVisible({ timeout: 5_000 });
  });

  test('submitting a valid enquiry shows the success card', async ({ page }) => {
    await page.fill('#cf-name', `${PW_TEST_PREFIX}Contact Tester`);
    await page.fill('#cf-phone', '9876543210');
    await page.selectOption('#cf-service', 'society');
    await page.fill('#cf-message', 'PW_TEST — please ignore, automated coverage check.');
    await page.click('button:has-text("Send Message")');

    await expect(page.locator('text=Message received.')).toBeVisible({ timeout: 10_000 });
    // The footer also has a tel: link — scope to the success card in <main>.
    await expect(page.locator('main a[href="tel:+9197711241629"]')).toBeVisible();
  });

});

test.describe('App waitlist', () => {

  test('renders hero copy, feature pills and store badges', async ({ page }) => {
    await page.goto('/app');
    await expect(page.locator('h1')).toContainText('Your car, cared for.');
    await expect(page.locator('text=Live job tracker')).toBeVisible();
    await expect(page.locator('text=App Store')).toBeVisible();
    await expect(page.locator('text=Google Play')).toBeVisible();
    await expect(page.locator('text=Soon').first()).toBeVisible();
  });

  test('joining the waitlist with a valid number shows confirmation', async ({ page }) => {
    await page.goto('/app');
    const ts = Date.now();
    const phoneDigits = `9${String(ts).slice(-9)}`;
    await page.fill('#waitlist-phone', phoneDigits);
    await page.click('button:has-text("Notify me")');
    await expect(page.locator("text=You're on the list.")).toBeVisible({ timeout: 10_000 });
  });

  test('rejects an incomplete phone number', async ({ page }) => {
    await page.goto('/app');
    await expect(page.locator('button:has-text("Notify me")')).toBeDisabled();
    await page.fill('#waitlist-phone', '98765');
    await expect(page.locator('button:has-text("Notify me")')).toBeDisabled();
  });

});
