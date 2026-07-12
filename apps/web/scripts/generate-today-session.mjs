/**
 * generate-today-session.mjs — creates a cleaningSession for a given
 * society/tower/date, pulling active customerSocietyRecords and assigning a worker.
 * The generate-sessions cron only builds next week's schedule, so this fills
 * the gap for same-day (or "tomorrow") demos/testing.
 *
 * Usage (from apps/web/):
 *   node scripts/generate-today-session.mjs "<societyId>" "<tower>" "<workerId>" "<workerName>" [YYYY-MM-DD]
 *   (date defaults to today)
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, '../.env.local');

let envVars = {};
const raw = readFileSync(envPath, 'utf-8');
for (const line of raw.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim().replace(/^"(.*)"$/, '$1');
  envVars[key] = val;
}

const projectId   = envVars.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = envVars.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey  = envVars.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

const [societyId, tower, workerId, workerName, dateArg] = process.argv.slice(2);
if (!societyId || !tower || !workerId || !workerName) {
  console.error('Usage: node scripts/generate-today-session.mjs "<societyId>" "<tower>" "<workerId>" "<workerName>" [YYYY-MM-DD]');
  process.exit(1);
}

const { initializeApp, cert, getApps } = await import('firebase-admin/app');
const { getFirestore, FieldValue }     = await import('firebase-admin/firestore');

if (!getApps().length) {
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

const db = getFirestore();

const targetDate = dateArg ? new Date(`${dateArg}T00:00:00`) : new Date();
targetDate.setHours(0, 0, 0, 0);
// Build the date-key from local date parts, not toISOString(), which converts to
// UTC and rolls the calendar day back for any timezone ahead of UTC (e.g. IST).
const dateKey = [
  targetDate.getFullYear(),
  String(targetDate.getMonth() + 1).padStart(2, '0'),
  String(targetDate.getDate()).padStart(2, '0'),
].join('-');
// Doc IDs become URL path segments (worker links to /session/<id>) — spaces
// survive as literal "%20" through this Next.js version's dynamic route params
// instead of being decoded back, so a raw space in the tower name 404s. Slug it.
const towerSlug = tower.trim().replace(/\s+/g, '-');
const sessionId = `${societyId}_${towerSlug}_${dateKey}`;

const societySnap = await db.collection('societies').doc(societyId).get();
const societyName = societySnap.data()?.name ?? tower;

const customersSnap = await db
  .collection('customerSocietyRecords')
  .where('societyId', '==', societyId)
  .where('tower', '==', tower)
  .where('status', '==', 'active')
  .get();

const cars = customersSnap.docs.map(d => {
  const c = d.data();
  return {
    customerId:    c.customerId,
    carPlate:      c.cars?.[0]?.plate  || '',
    carMake:       c.cars?.[0]?.make   || '',
    carModel:      c.cars?.[0]?.model  || '',
    preferredTime: c.permanentTime || c.preferredCleaningTime || 9,
    status:        'pending',
  };
});

await db.collection('cleaningSessions').doc(sessionId).set({
  societyId,
  societyName,
  tower,
  scheduledDate: targetDate,
  status:        'scheduled',
  cars,
  totalCars:     cars.length,
  completedCars: 0,
  skippedCars:   0,
  workerIds:     [workerId],
  workerNames:   [workerName],
  createdAt:     FieldValue.serverTimestamp(),
  updatedAt:     FieldValue.serverTimestamp(),
}, { merge: true });

console.log(`\n✅  cleaningSessions/${sessionId}  —  ${cars.length} car(s), worker: ${workerName}\n`);
process.exit(0);
