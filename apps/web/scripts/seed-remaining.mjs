/**
 * seed-remaining.mjs — fills the remaining gaps for full prod-level testing:
 *   - pendingApprovals (for /pending-approvals page)
 *   - cleaningLogs     (for /customer-enrollments month counts)
 *   - paymentLogs      (for /billing payment history)
 *   - stats/income     (for /billing aggregated revenue)
 *   - Mixed car statuses on today's sessions (for /live-cleaning realism)
 *
 * Usage (from apps/web/):
 *   node scripts/seed-remaining.mjs
 *
 * Safe to run multiple times — skips docs that already exist.
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
  console.error('Could not read apps/web/.env.local');
  process.exit(1);
}

const projectId   = envVars.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = envVars.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey  = envVars.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('Missing Firebase Admin credentials in .env.local');
  process.exit(1);
}

const { initializeApp, cert, getApps } = await import('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = await import('firebase-admin/firestore');

if (!getApps().length) initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });

const db = getFirestore();

function ts(daysAgo) {
  return Timestamp.fromMillis(Date.now() - daysAgo * 86_400_000);
}
function tsFuture(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(0, 0, 0, 0);
  return Timestamp.fromDate(d);
}

// ── 1. pendingApprovals ─────────────────────────────────────────────────────────

const PENDING_APPROVALS = [
  {
    id: 'approval_kavita_mahagun',
    societyId: 'demo_society_mahagun_003',
    societyName: 'Mahagun Moderne',
    tower: 'East Wing',
    customerId: 'demo_cust_kavita_008',
    customerName: 'Kavita Singh',
    customerPhone: '+919876502008',
    carPlate: 'DL 05 ZZ 9999',
    carMake: 'Maruti Suzuki',
    carModel: 'Swift',
    preferredCleaningTime: 14,
    preferredCleaningDays: [1, 3, 5],
    status: 'pending',
    submittedAt: ts(2),
  },
  {
    id: 'approval_vikas_noida',
    societyId: 'demo_society_uniworld_001',
    societyName: 'Uniworld City',
    tower: 'Tower B',
    customerName: 'Vikas Gupta',
    customerPhone: '+919888800011',
    carPlate: 'UP 14 XY 5678',
    carMake: 'Hyundai',
    carModel: 'i20',
    preferredCleaningTime: 9,
    status: 'pending',
    submittedAt: ts(1),
  },
  {
    id: 'approval_ananya_dlf',
    societyId: 'demo_society_dlf_002',
    societyName: 'DLF Capital Greens',
    tower: 'Greens III',
    customerName: 'Ananya Reddy',
    customerPhone: '+919888800022',
    carPlate: 'DL 04 PQ 9012',
    carMake: 'Volkswagen',
    carModel: 'Taigun',
    preferredCleaningTime: 7,
    preferredCleaningDays: [2, 4, 6],
    status: 'pending',
    submittedAt: ts(0),
  },
];

async function seedPendingApprovals() {
  console.log('\n── 1. pendingApprovals ────────────────────────────────────────');
  let created = 0, skipped = 0;
  for (const record of PENDING_APPROVALS) {
    const { id, ...data } = record;
    const ref = db.collection('pendingApprovals').doc(id);
    const snap = await ref.get();
    if (snap.exists) { skipped++; continue; }
    await ref.set(data);
    created++;
    console.log(`  ✓  pendingApprovals/${id}  (${data.customerName} → ${data.societyName} · ${data.tower})`);
  }
  return { created, skipped };
}

// ── 2. cleaningLogs ─────────────────────────────────────────────────────────────

const CLEANING_LOGS = [
  // Rahul Mehta — Uniworld Tower A — last 3 cleans
  { id:'log_rahul_01', customerId:'demo_cust_rahul_001', customerName:'Rahul Mehta', societyId:'demo_society_uniworld_001', societyName:'Uniworld City', unitNumber:'1204', vehicleRegistration:'DL 01 AB 1234', vehicleMake:'Mercedes-Benz', vehicleModel:'GLE 450', workerId:'demo_worker_ravi_001', workerName:'Ravi Kumar', cleanedAt:ts(4), serviceType:'exterior', servicePrice:0, billed:true, notificationSent:true, rating:5, ratedAt:ts(3) },
  { id:'log_rahul_02', customerId:'demo_cust_rahul_001', customerName:'Rahul Mehta', societyId:'demo_society_uniworld_001', societyName:'Uniworld City', unitNumber:'1204', vehicleRegistration:'DL 01 AB 1234', vehicleMake:'Mercedes-Benz', vehicleModel:'GLE 450', workerId:'demo_worker_aakash_003', workerName:'Aakash Singh', cleanedAt:ts(7), serviceType:'exterior', servicePrice:0, billed:true, notificationSent:true, rating:4, ratedAt:ts(6) },
  { id:'log_rahul_03', customerId:'demo_cust_rahul_001', customerName:'Rahul Mehta', societyId:'demo_society_uniworld_001', societyName:'Uniworld City', unitNumber:'1204', vehicleRegistration:'DL 01 AB 1234', vehicleMake:'Mercedes-Benz', vehicleModel:'GLE 450', workerId:'demo_worker_ravi_001', workerName:'Ravi Kumar', cleanedAt:ts(11), serviceType:'exterior', servicePrice:0, billed:true, notificationSent:true, rating:5, ratedAt:ts(10) },
  // Priya Sharma — Uniworld Tower A
  { id:'log_priya_01', customerId:'demo_cust_priya_002', customerName:'Priya Sharma', societyId:'demo_society_uniworld_001', societyName:'Uniworld City', unitNumber:'0805', vehicleRegistration:'DL 02 EF 9012', vehicleMake:'Audi', vehicleModel:'Q5', workerId:'demo_worker_ravi_001', workerName:'Ravi Kumar', cleanedAt:ts(4), serviceType:'exterior', servicePrice:0, billed:true, notificationSent:true, rating:5, ratedAt:ts(3) },
  { id:'log_priya_02', customerId:'demo_cust_priya_002', customerName:'Priya Sharma', societyId:'demo_society_uniworld_001', societyName:'Uniworld City', unitNumber:'0805', vehicleRegistration:'DL 02 EF 9012', vehicleMake:'Audi', vehicleModel:'Q5', workerId:'demo_worker_aakash_003', workerName:'Aakash Singh', cleanedAt:ts(9), serviceType:'exterior', servicePrice:0, billed:true, notificationSent:true, rating:4, ratedAt:ts(8) },
  // Sanjay Kapoor — DLF Greens I
  { id:'log_sanjay_01', customerId:'demo_cust_sanjay_005', customerName:'Sanjay Kapoor', societyId:'demo_society_dlf_002', societyName:'DLF Capital Greens', unitNumber:'A-204', vehicleRegistration:'DL 03 KL 2345', vehicleMake:'Toyota', vehicleModel:'Fortuner', workerId:'demo_worker_deepak_005', workerName:'Deepak Verma', cleanedAt:ts(5), serviceType:'exterior', servicePrice:0, billed:true, notificationSent:true, rating:5, ratedAt:ts(4) },
  { id:'log_sanjay_02', customerId:'demo_cust_sanjay_005', customerName:'Sanjay Kapoor', societyId:'demo_society_dlf_002', societyName:'DLF Capital Greens', unitNumber:'A-204', vehicleRegistration:'DL 03 MN 6789', vehicleMake:'Hyundai', vehicleModel:'Creta', workerId:'demo_worker_deepak_005', workerName:'Deepak Verma', cleanedAt:ts(5), serviceType:'exterior', servicePrice:0, billed:true, notificationSent:true, rating:4, ratedAt:ts(4) },
  // Rohit Agarwal — Mahagun North Wing
  { id:'log_rohit_01', customerId:'demo_cust_rohit_007', customerName:'Rohit Agarwal', societyId:'demo_society_mahagun_003', societyName:'Mahagun Moderne', unitNumber:'NB-302', vehicleRegistration:'MH 12 QR 4444', vehicleMake:'Tata', vehicleModel:'Nexon EV', workerId:'demo_worker_suresh_002', workerName:'Suresh Yadav', cleanedAt:ts(6), serviceType:'exterior', servicePrice:0, billed:false, notificationSent:true },
  // Neha Patel — Mahagun South Wing
  { id:'log_neha_01', customerId:'demo_cust_neha_004', customerName:'Neha Patel', societyId:'demo_society_mahagun_003', societyName:'Mahagun Moderne', unitNumber:'SW-518', vehicleRegistration:'UP 16 IJ 7890', vehicleMake:'Maruti Suzuki', vehicleModel:'Baleno', workerId:'demo_worker_manoj_004', workerName:'Manoj Sharma', cleanedAt:ts(8), serviceType:'exterior', servicePrice:0, billed:true, notificationSent:true, rating:3, ratedAt:ts(7) },
  // Divya Nair — DLF Greens II
  { id:'log_divya_01', customerId:'demo_cust_divya_006', customerName:'Divya Nair', societyId:'demo_society_dlf_002', societyName:'DLF Capital Greens', unitNumber:'C-1101', vehicleRegistration:'KA 04 OP 1111', vehicleMake:'Kia', vehicleModel:'Seltos', workerId:'demo_worker_deepak_005', workerName:'Deepak Verma', cleanedAt:ts(10), serviceType:'exterior', servicePrice:0, billed:true, notificationSent:true, rating:4, ratedAt:ts(9) },
  // Amit Gupta — Uniworld Tower C
  { id:'log_amit_01', customerId:'demo_cust_amit_003', customerName:'Amit Gupta', societyId:'demo_society_uniworld_001', societyName:'Uniworld City', unitNumber:'1602', vehicleRegistration:'HR 26 GH 3456', vehicleMake:'Honda', vehicleModel:'City', workerId:'demo_worker_aakash_003', workerName:'Aakash Singh', cleanedAt:ts(6), serviceType:'exterior', servicePrice:0, billed:true, notificationSent:true, rating:4, ratedAt:ts(5) },
];

async function seedCleaningLogs() {
  console.log('\n── 2. cleaningLogs ────────────────────────────────────────────');
  let created = 0, skipped = 0;
  for (const record of CLEANING_LOGS) {
    const { id, ...data } = record;
    const ref = db.collection('cleaningLogs').doc(id);
    const snap = await ref.get();
    if (snap.exists) { skipped++; continue; }
    await ref.set(data);
    created++;
    console.log(`  ✓  cleaningLogs/${id}  (${data.customerName} — ${data.vehicleRegistration})`);
  }
  return { created, skipped };
}

// ── 3. paymentLogs + stats/income ──────────────────────────────────────────────

const PAYMENT_LOGS = [
  { id:'pay_demo_001', customerId:'demo_cust_rahul_001', customerName:'Rahul Mehta', amount:9000,  type:'booking', bookingRef:'PC-A1B2C3', societyName:null, method:'UPI',   paidAt:ts(85), notes:'Razorpay tx: pay_demo_001' },
  { id:'pay_demo_002', customerId:'demo_cust_rahul_001', customerName:'Rahul Mehta', amount:14500, type:'booking', bookingRef:'PC-D4E5F6', societyName:null, method:'UPI',   paidAt:ts(70), notes:'Razorpay tx: pay_demo_002' },
  { id:'pay_demo_003', customerId:'demo_cust_rahul_001', customerName:'Rahul Mehta', amount:8500,  type:'booking', bookingRef:'PC-G7H8I9', societyName:null, method:'Card',  paidAt:ts(55), notes:'Razorpay tx: pay_demo_003' },
  { id:'pay_demo_004', customerId:'demo_cust_rahul_001', customerName:'Rahul Mehta', amount:12000, type:'booking', bookingRef:'PC-J1K2L3', societyName:null, method:'UPI',   paidAt:ts(40), notes:'Razorpay tx: pay_demo_004' },
  { id:'pay_demo_005', customerId:'demo_cust_rahul_001', customerName:'Rahul Mehta', amount:9500,  type:'booking', bookingRef:'PC-M4N5O6', societyName:null, method:'NB',    paidAt:ts(25), notes:'Razorpay tx: pay_demo_005' },
  { id:'pay_demo_006', customerId:'demo_cust_rahul_001', customerName:'Rahul Mehta', amount:8000,  type:'booking', bookingRef:'PC-P7Q8R9', societyName:null, method:'UPI',   paidAt:ts(12), notes:'Razorpay tx: pay_demo_006' },
  { id:'pay_demo_007', customerId:'demo_cust_sanjay_005', customerName:'Sanjay Kapoor', amount:8000,  type:'booking', bookingRef:'PC-S1T2U3', societyName:null, method:'UPI',   paidAt:ts(75), notes:'Razorpay tx: pay_demo_007' },
  { id:'pay_demo_008', customerId:'demo_cust_sanjay_005', customerName:'Sanjay Kapoor', amount:11500, type:'booking', bookingRef:'PC-V4W5X6', societyName:null, method:'Card',  paidAt:ts(50), notes:'Razorpay tx: pay_demo_008' },
  { id:'pay_demo_009', customerId:'demo_cust_sanjay_005', customerName:'Sanjay Kapoor', amount:7000,  type:'booking', bookingRef:'PC-Y7Z8A9', societyName:null, method:'UPI',   paidAt:ts(30), notes:'Razorpay tx: pay_demo_009' },
  { id:'pay_demo_010', customerId:'demo_cust_sanjay_005', customerName:'Sanjay Kapoor', amount:6000,  type:'booking', bookingRef:'PC-B1C2D3', societyName:null, method:'NB',    paidAt:ts(10), notes:'Razorpay tx: pay_demo_010' },
  { id:'pay_society_uni_001', customerId:'demo_cust_rahul_001', customerName:'Rahul Mehta', amount:599,  type:'society_fee', bookingRef:null, societyName:'Uniworld City',        method:'Phone', paidAt:ts(15), notes:'Jun 2026 monthly — collected at gate' },
  { id:'pay_society_uni_002', customerId:'demo_cust_priya_002', customerName:'Priya Sharma', amount:599,  type:'society_fee', bookingRef:null, societyName:'Uniworld City',        method:'UPI',   paidAt:ts(15), notes:'Jun 2026 monthly — UPI' },
  { id:'pay_society_dlf_001', customerId:'demo_cust_sanjay_005', customerName:'Sanjay Kapoor', amount:1398, type:'society_fee', bookingRef:null, societyName:'DLF Capital Greens',  method:'UPI',   paidAt:ts(14), notes:'Jun 2026 monthly (2 cars) — UPI' },
  { id:'pay_society_mah_001', customerId:'demo_cust_rohit_007', customerName:'Rohit Agarwal', amount:499,  type:'society_fee', bookingRef:null, societyName:'Mahagun Moderne',     method:'Card',  paidAt:ts(13), notes:'Jun 2026 monthly — autopay' },
];

const INCOME_STATS = {
  totalRevenue: 118146,
  societyRevenue: 3095,
  bookingRevenue: 115051,
  pendingPayouts: 0,
  monthRevenue: 25846,
  monthSocietyRevenue: 3095,
  lastUpdated: ts(0),
};

async function seedPaymentLogs() {
  console.log('\n── 3. paymentLogs ─────────────────────────────────────────────');
  let created = 0, skipped = 0;
  for (const record of PAYMENT_LOGS) {
    const { id, ...data } = record;
    const ref = db.collection('paymentLogs').doc(id);
    const snap = await ref.get();
    if (snap.exists) { skipped++; continue; }
    await ref.set(data);
    created++;
    console.log(`  ✓  paymentLogs/${id}  (${data.customerName} · ₹${data.amount} · ${data.type})`);
  }

  // stats/income
  const statsRef = db.collection('stats').doc('income');
  const statsSnap = await statsRef.get();
  if (!statsSnap.exists) {
    await statsRef.set(INCOME_STATS);
    created++;
    console.log(`  ✓  stats/income  (₹${INCOME_STATS.totalRevenue.toLocaleString('en-IN')} total revenue)`);
  } else {
    skipped++;
    console.log(`  -  stats/income  (already exists, skipped)`);
  }
  return { created, skipped: skipped };
}

// ── 4. Update today's sessions with mixed car statuses ─────────────────────────

async function updateSessionCarStatuses() {
  console.log('\n── 4. Session car statuses (mixed for live testing) ────────────');
  let updated = 0, skipped = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const targetSessions = [
    // Uniworld Tower A — 2 cars, mark Rahuls as done, Priyas as in_progress
    { id: `demo_society_uniworld_001_Tower-A_${todayStr}`, cars: [
      { customerId: 'demo_cust_rahul_001', status: 'done',     cleanedBy: 'demo_worker_ravi_001',   cleanedAt: Timestamp.fromMillis(Date.now() - 2 * 3600_000) },
      { customerId: 'demo_cust_priya_002', status: 'in_progress' },
    ]},
    // Uniworld Tower C — mark Amits car as done
    { id: `demo_society_uniworld_001_Tower-C_${todayStr}`, cars: [
      { customerId: 'demo_cust_amit_003',  status: 'done',     cleanedBy: 'demo_worker_aakash_003', cleanedAt: Timestamp.fromMillis(Date.now() - 1 * 3600_000) },
    ]},
    // DLF Greens I — Sanjays 2 cars, mark both done (early today)
    { id: `demo_society_dlf_002_Greens-I_${todayStr}`, cars: [
      { customerId: 'demo_cust_sanjay_005', status: 'done',     cleanedBy: 'demo_worker_deepak_005', cleanedAt: Timestamp.fromMillis(Date.now() - 5 * 3600_000) },
    ]},
    // Mahagun North Wing — Rohits car in_progress
    { id: `demo_society_mahagun_003_North-Wing_${todayStr}`, cars: [
      { customerId: 'demo_cust_rohit_007', status: 'in_progress' },
    ]},
  ];

  for (const target of targetSessions) {
    const ref = db.collection('cleaningSessions').doc(target.id);
    const snap = await ref.get();
    if (!snap.exists) { skipped++; console.log(`  -  ${target.id}  (not found, skipped)`); continue; }

    const data = snap.data();
    const existingCars = data.cars || [];

    // Build new cars array, overlaying the updated statuses
    const updateMap = {};
    for (const c of target.cars) updateMap[c.customerId] = c;

    const newCars = existingCars.map(car => {
      const update = updateMap[car.customerId];
      if (!update) return car;
      return {
        ...car,
        status: update.status,
        ...(update.status === 'done' ? { cleanedBy: update.cleanedBy, cleanedAt: update.cleanedAt } : {}),
        ...(update.status === 'in_progress' ? { cleanedBy: null, cleanedAt: null } : {}),
      };
    });

    const completedCount = newCars.filter(c => c.status === 'done').length;
    const inProgressCount = newCars.filter(c => c.status === 'in_progress').length;

    // If all cars done, mark session as done
    const newStatus = completedCount === newCars.length && newCars.length > 0
      ? 'done'
      : (inProgressCount > 0 ? 'inprogress' : 'scheduled');

    await ref.update({
      cars: newCars,
      completedCars: completedCount,
      status: newStatus,
      ...(newStatus === 'done' ? { completedAt: FieldValue.serverTimestamp() } : {}),
      ...(newStatus === 'inprogress' ? { startedAt: FieldValue.serverTimestamp() } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });
    updated++;
    console.log(`  ✓  ${target.id}  → status: ${newStatus}, ${completedCount} done, ${inProgressCount} in_progress`);
  }

  return { updated, skipped };
}

// ── Run ─────────────────────────────────────────────────────────────────────────

console.log('\n🔧  Seeding remaining data for full workflow testing…\n');

const aRes = await seedPendingApprovals();
const cRes = await seedCleaningLogs();
const pRes = await seedPaymentLogs();
const uRes = await updateSessionCarStatuses();

const totalCreated = aRes.created + cRes.created + pRes.created;
const totalUpdated = uRes.updated;

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  pendingApprovals — created ${aRes.created}, skipped ${aRes.skipped}
  cleaningLogs     — created ${cRes.created}, skipped ${cRes.skipped}
  paymentLogs+stats — created ${pRes.created}, skipped ${pRes.skipped}
  Session updates  — ${uRes.updated} updated, ${uRes.skipped} skipped
  ──────────────────────────────────
  Total new docs   — created ${totalCreated}, updated ${totalUpdated}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Done. Full workflow now testable:

  /pending-approvals   → 3 signups awaiting review (Kavita, Vikas, Ananya)
  /customer-enrollments → cleaningLogs appear in "This Month" column
  /billing             → paymentLogs history + income stats visible
  /live-cleaning       → today's sessions show done/in-progress/pending cars

  Try: Approve Kavita → see status update live on /customer-enrollments
`);
process.exit(0);
