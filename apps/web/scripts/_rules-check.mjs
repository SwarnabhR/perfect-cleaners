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

const { initializeApp, cert, getApps } = await import('firebase-admin/app');
const { getFirestore, Timestamp } = await import('firebase-admin/firestore');
if (!getApps().length) {
  initializeApp({ credential: cert({
    projectId: ENV.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: ENV.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: ENV.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }) });
}
const db = getFirestore();

const uid = `pw_test_rulescheck_${Date.now()}`;
await db.collection('workers').doc(uid).set({
  name: 'PW_TEST_RulesCheck Worker', phone: `+919${String(Date.now()).slice(-9)}`,
  isOnline: true, rating: 5, totalJobs: 0, createdAt: Timestamp.now(),
});
const sessionRef = await db.collection('cleaningSessions').add({
  societyId: 'pw_test_rulescheck', societyName: 'PW_TEST_RulesCheck Society', tower: 'Tower RC',
  scheduledDate: Timestamp.now(), status: 'scheduled',
  cars: [], totalCars: 1, completedCars: 0, skippedCars: 0,
  workerIds: [uid], workerNames: ['PW_TEST_RulesCheck Worker'], // array only, no singular workerId
  createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
});
console.log('Seeded worker', uid, 'and session', sessionRef.id);

const BASE = 'http://localhost:3000';
const firebaseConfig = {
  apiKey: ENV.NEXT_PUBLIC_FIREBASE_API_KEY, authDomain: ENV.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: ENV.NEXT_PUBLIC_FIREBASE_PROJECT_ID, storageBucket: ENV.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, appId: ENV.NEXT_PUBLIC_FIREBASE_APP_ID,
};
async function signInWithBypass(page, u) {
  const res = await page.request.get(`${BASE}/api/test/firebase-token?uid=${u}`);
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
const consoleErrors = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') consoleErrors.push(m.text()); });
await page.goto(`${BASE}/worker/login`);
await signInWithBypass(page, uid);
await page.waitForTimeout(1000);
await page.goto(`${BASE}/worker/dashboard`);
await page.waitForTimeout(4000);
const txt = await page.textContent('body');
console.log('Dashboard shows the session card?', txt.includes('Tower RC'));
console.log('\n--- console errors/warnings on the page ---');
consoleErrors.forEach(e => console.log(e));
await browser.close();
process.exit(0);
