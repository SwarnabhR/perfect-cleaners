import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const raw = readFileSync('c:/Users/finst/Projects/perfect-cleaners/apps/web/.env.local', 'utf-8');
const ENV = {};
for (const line of raw.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i === -1) continue;
  ENV[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^"(.*)"$/, '$1');
}
const BASE = 'http://localhost:3000';
const SHOTS = 'C:\\Users\\finst\\AppData\\Local\\Temp\\claude\\c--Users-finst-Projects-perfect-cleaners\\8d3f8157-0fc0-47dc-8df2-801b392d1a9d\\scratchpad\\shots';
const firebaseConfig = {
  apiKey: ENV.NEXT_PUBLIC_FIREBASE_API_KEY, authDomain: ENV.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: ENV.NEXT_PUBLIC_FIREBASE_PROJECT_ID, storageBucket: ENV.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, appId: ENV.NEXT_PUBLIC_FIREBASE_APP_ID,
};
async function signInWithBypass(page, uid) {
  const res = await page.request.get(`${BASE}/api/test/firebase-token?uid=${uid}`);
  const body = await res.json();
  if (!res.ok()) throw new Error(`firebase-token failed: ${JSON.stringify(body)}`);
  await page.evaluate(async ({ token, config }) => {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js');
    const { getAuth, signInWithCustomToken } = await import('https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js');
    const app = initializeApp(config);
    const auth = getAuth(app);
    await signInWithCustomToken(auth, token);
  }, { token: body.token, config: firebaseConfig });
  await page.reload();
}
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const browser = await chromium.launch();

try {
  const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const admin = await adminCtx.newPage();
  await admin.goto(`${BASE}/login`);
  await admin.fill('input[type="email"]', ENV.TEST_ADMIN_EMAIL);
  await admin.fill('input[type="password"]', ENV.TEST_ADMIN_PASSWORD);
  await admin.click('button[type="submit"]');
  await admin.waitForURL('**/dashboard', { timeout: 20000 });
  log('Admin logged in.');

  await admin.goto(`${BASE}/cleaning-schedule`);
  await admin.waitForTimeout(1500);
  await admin.click('text=Create Session');
  await admin.waitForTimeout(400);
  await admin.selectOption('select >> nth=0', { label: 'Uniworld City' });
  await admin.waitForTimeout(300);
  await admin.selectOption('select >> nth=1', { label: 'Tower A' });
  await admin.locator('label', { hasText: 'Swarnabh' }).locator('input[type="checkbox"]').check();
  await admin.locator('form button:has-text("Create Session")').click();
  await admin.waitForTimeout(1500);
  log('Created a new Tower A session with the fresh active enrollment in place.');

  await admin.goto(`${BASE}/live-cleaning`);
  await admin.waitForTimeout(1500);
  await admin.screenshot({ path: `${SHOTS}/20-live-cleaning-after-fix.png`, fullPage: true });
  const bodyTxt = await admin.textContent('body');
  log('Live-cleaning shows the seeded plate DL 09 VF 0099?', bodyTxt.includes('DL 09 VF 0099'));

  const doneBtn = admin.locator('button:has-text("Done")').first();
  const hasDoneBtn = await doneBtn.isVisible({ timeout: 5000 }).catch(() => false);
  log('Mark-Done button present on the board?', hasDoneBtn);
  if (hasDoneBtn) {
    await doneBtn.click();
    await admin.waitForTimeout(2000);
    await admin.screenshot({ path: `${SHOTS}/21-live-cleaning-marked-done.png`, fullPage: true });
    log('Clicked Mark Done.');
  }

  // Worker dashboard: does it now list the live session assignment?
  const workerCtx = await browser.newContext({ viewport: { width: 430, height: 900 } });
  const worker = await workerCtx.newPage();
  await worker.goto(`${BASE}/worker/login`);
  await signInWithBypass(worker, ENV.TEST_WORKER_UID);
  await worker.waitForTimeout(1000);
  await worker.goto(`${BASE}/worker/dashboard`);
  await worker.waitForTimeout(2000);
  await worker.screenshot({ path: `${SHOTS}/22-worker-dashboard-after-fix.png`, fullPage: true });
  const workerTxt = await worker.textContent('body');
  log('Worker dashboard now shows a live session card for Uniworld City?', /Uniworld City/.test(workerTxt));

  await browser.close();
} catch (err) {
  console.error('VERIFY SCRIPT ERROR:', err);
  await browser.close();
  process.exit(1);
}
