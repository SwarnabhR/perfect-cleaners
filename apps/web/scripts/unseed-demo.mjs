/**
 * unseed-demo.mjs — removes all demo documents created by seed-demo.mjs.
 *
 * Usage (from apps/web/):
 *   node scripts/unseed-demo.mjs
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

const { initializeApp, cert, getApps } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');

if (!getApps().length) {
  initializeApp({ credential: cert({
    projectId:   envVars.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: envVars.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey:  envVars.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }) });
}

const db = getFirestore();

const DEMO_IDS = {
  workers: [
    'demo_worker_ravi_001', 'demo_worker_suresh_002', 'demo_worker_aakash_003',
    'demo_worker_manoj_004', 'demo_worker_deepak_005',
  ],
  customers: [
    'demo_cust_rahul_001', 'demo_cust_priya_002', 'demo_cust_amit_003',
    'demo_cust_neha_004', 'demo_cust_sanjay_005', 'demo_cust_divya_006',
    'demo_cust_rohit_007', 'demo_cust_kavita_008',
  ],
  societies: [
    'demo_society_uniworld_001', 'demo_society_dlf_002',
    'demo_society_mahagun_003', 'demo_society_supertech_004',
  ],
  bookings: [
    'demo_booking_001', 'demo_booking_002', 'demo_booking_003', 'demo_booking_004',
    'demo_booking_005', 'demo_booking_006', 'demo_booking_007', 'demo_booking_008',
    'demo_booking_009', 'demo_booking_010', 'demo_booking_011', 'demo_booking_012',
    'demo_booking_013', 'demo_booking_014', 'demo_booking_015', 'demo_booking_016',
    'demo_booking_017', 'demo_booking_018', 'demo_booking_019', 'demo_booking_020',
    'demo_booking_021',
  ],
};

console.log('\n🗑️   Removing demo data from Firestore…\n');

let deleted = 0;
let missing = 0;

for (const [col, ids] of Object.entries(DEMO_IDS)) {
  for (const id of ids) {
    const ref = db.collection(col).doc(id);
    const snap = await ref.get();
    if (!snap.exists) { missing++; continue; }
    await ref.delete();
    deleted++;
    console.log(`  ✗  ${col}/${id}`);
  }
}

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Deleted ${deleted} documents  (${missing} already gone)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Demo data cleared.
`);

process.exit(0);
