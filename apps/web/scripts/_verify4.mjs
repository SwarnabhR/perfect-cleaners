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
const firebaseConfig = {
  apiKey: ENV.NEXT_PUBLIC_FIREBASE_API_KEY, authDomain: ENV.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: ENV.NEXT_PUBLIC_FIREBASE_PROJECT_ID, storageBucket: ENV.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, appId: ENV.NEXT_PUBLIC_FIREBASE_APP_ID,
};
async function signInWithBypass(page, uid) {
  const res = await page.request.get(`${BASE}/api/test/firebase-token?uid=${uid}`);
  const body = await res.json();
  await page.evaluate(async ({ token, config }) => {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js');
    const { getAuth, signInWithCustomToken } = await import('https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js');
    const app = initializeApp(config);
    const auth = getAuth(app);
    await signInWithCustomToken(auth, token);
  }, { token: body.token, config: firebaseConfig });
  await page.reload();
}
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 430, height: 900 } });
const page = await ctx.newPage();
page.on('console', m => console.log('[console]', m.type(), m.text()));
await page.goto(`${BASE}/worker/login`);
await signInWithBypass(page, ENV.TEST_WORKER_UID);
await page.waitForTimeout(1000);
await page.goto(`${BASE}/worker/dashboard`);
await page.waitForTimeout(3000);
const txt = await page.textContent('body');
console.log('Shows Uniworld City Tower B (workerIds-array-only, scheduled)?', /Uniworld City.*Tower B|Tower B.*Uniworld City/.test(txt));
await browser.close();
