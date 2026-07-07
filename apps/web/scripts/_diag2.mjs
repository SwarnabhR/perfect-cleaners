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
const { getFirestore } = await import('firebase-admin/firestore');
if (!getApps().length) {
  initializeApp({ credential: cert({
    projectId: ENV.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: ENV.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: ENV.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }) });
}
const db = getFirestore();
const snap = await db.collection('cleaningLogs').where('customerId', '==', 'e2e_verify_customer_001').get();
console.log('cleaningLogs for e2e_verify_customer_001:', snap.docs.length);
snap.docs.forEach(d => console.log('-', JSON.stringify(d.data())));
process.exit(0);
