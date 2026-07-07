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
const { getFirestore, FieldValue } = await import('firebase-admin/firestore');
if (!getApps().length) {
  initializeApp({ credential: cert({
    projectId: ENV.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: ENV.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: ENV.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }) });
}
const db = getFirestore();
const ref = await db.collection('cleaningSessions').add({
  societyId: 'demo_society_uniworld_001',
  societyName: 'Uniworld City',
  tower: 'Tower A',
  workerId: ENV.TEST_WORKER_UID,
  workerName: 'Swarnabh',
  scheduledDate: new Date(),
  status: 'scheduled',
  totalCars: 5,
  completedCars: 0,
  createdAt: FieldValue.serverTimestamp(),
});
console.log('SESSION_ID=' + ref.id);
process.exit(0);
