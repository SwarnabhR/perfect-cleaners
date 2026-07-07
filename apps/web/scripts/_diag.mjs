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
const snap = await db.collection('cleaningSessions')
  .where('workerIds', 'array-contains', ENV.TEST_WORKER_UID)
  .get();
console.log('Sessions with this worker in workerIds:', snap.docs.length);
snap.docs.forEach(d => {
  const x = d.data();
  console.log('-', d.id, '| status=', x.status, '| society=', x.societyName, '| tower=', x.tower, '| cars=', x.cars?.length, '| totalCars=', x.totalCars, '| completedCars=', x.completedCars);
});
process.exit(0);
