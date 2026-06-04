/**
 * clear-data.mjs — wipes all transactional Firestore collections.
 * Preserves: admins, services, settings.
 *
 * Usage:
 *   node scripts/clear-data.mjs
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, '../.env.local');

let envVars = {};
try {
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
} catch {
  console.error('❌  Could not read apps/web/.env.local');
  process.exit(1);
}

const projectId   = envVars.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = envVars.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey  = envVars.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌  Missing Firebase Admin credentials in .env.local');
  process.exit(1);
}

const { initializeApp, cert, getApps } = await import('firebase-admin/app');
const { getFirestore }                  = await import('firebase-admin/firestore');

if (!getApps().length) {
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

const db = getFirestore();

const COLLECTIONS = [
  'bookings',
  'customers',
  'workers',
  'cleaningSessions',
  'cleaningLogs',
  'paymentLogs',
  'stats',
  'otpVerifications',
  'appWaitlist',
  'contactInquiries',
  'support',
  'societies',
  'promotions',
];

console.log('\n🗑️  Clearing Firestore data…\n');

for (const col of COLLECTIONS) {
  const ref  = db.collection(col);
  const snap = await ref.limit(1).get();
  if (snap.empty) {
    console.log(`  ○  ${col}  (already empty)`);
    continue;
  }
  await db.recursiveDelete(ref);
  console.log(`  ✓  ${col}  deleted`);
}

console.log('\n✅  Done. Firestore is clean.\n');
process.exit(0);
