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

// ── Known document IDs ──────────────────────────────────────────────────────────

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
  pendingApprovals: [
    'approval_kavita_mahagun', 'approval_vikas_noida', 'approval_ananya_dlf',
  ],
  cleaningLogs: [
    'log_rahul_01', 'log_rahul_02', 'log_rahul_03',
    'log_priya_01', 'log_priya_02',
    'log_sanjay_01', 'log_sanjay_02',
    'log_rohit_01', 'log_neha_01', 'log_divya_01', 'log_amit_01',
  ],
  paymentLogs: [
    'pay_demo_001', 'pay_demo_002', 'pay_demo_003', 'pay_demo_004',
    'pay_demo_005', 'pay_demo_006', 'pay_demo_007', 'pay_demo_008',
    'pay_demo_009', 'pay_demo_010',
    'pay_society_uni_001', 'pay_society_uni_002',
    'pay_society_dlf_001', 'pay_society_mah_001',
  ],
  customerSocietyRecords: [
    'enroll_rahul_uniworld', 'enroll_priya_uniworld', 'enroll_amit_uniworld',
    'enroll_sanjay_dlf', 'enroll_divya_dlf',
    'enroll_rohit_mahagun', 'enroll_neha_mahagun', 'enroll_kavita_mahagun',
  ],
};

// ── Pattern: delete all docs starting with "demo_" or "enroll_" or "approval_" or "log_" or "pay_" ──

async function deleteByPrefix(col, prefixes) {
  let deleted = 0;
  for (const prefix of prefixes) {
    const snap = await db.collection(col)
      .orderBy('__name__')
      .startAt(prefix)
      .endAt(prefix + '\uf8ff')
      .get();
    for (const doc of snap.docs) {
      await doc.ref.delete();
      deleted++;
      console.log(`  ✗  ${col}/${doc.id}`);
    }
  }
  return deleted;
}

// ── Delete known IDs ────────────────────────────────────────────────────────────

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

// ── Delete pattern-based collections ────────────────────────────────────────────

console.log('\n  ── Cleaning up dynamic collections ──\n');

// societyBillingConfig: IDs like "demo_society_*_Tower *"
const billingDeleted = await deleteByPrefix('societyBillingConfig', ['demo_society_']);
deleted += billingDeleted;

// cleaningSessions: IDs like "demo_society_*_2026-*"
const sessionDeleted = await deleteByPrefix('cleaningSessions', ['demo_society_']);
deleted += sessionDeleted;

// stats/income (single doc)
const statsRef = db.collection('stats').doc('income');
const statsSnap = await statsRef.get();
if (statsSnap.exists) {
  await statsRef.delete();
  deleted++;
  console.log('  ✗  stats/income');
} else {
  missing++;
}

// notifications created during workflow simulation (car_cleaned_*)
const notifDeleted = await deleteByPrefix('notifications', ['car_cleaned_']);
deleted += notifDeleted;

// Subcollection notifications under workers/customers
const workerNotifSnap = await db.collectionGroup('notifications').get();
for (const doc of workerNotifSnap.docs) {
  const parentPath = doc.ref.parent.path;
  if (parentPath.includes('demo_worker_') || parentPath.includes('demo_cust_')) {
    await doc.ref.delete();
    deleted++;
    console.log(`  ✗  ${doc.ref.path}`);
  }
}

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Deleted ${deleted} documents  (${missing} already gone)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Demo data cleared.
`);

process.exit(0);
