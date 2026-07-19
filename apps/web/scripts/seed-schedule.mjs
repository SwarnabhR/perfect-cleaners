/**
 * seed-schedule.mjs — creates society billing configs, customer enrollments,
 * and cleaning sessions for the current + next week so the full worker-to-admin
 * workflow can be tested live today.
 *
 * Usage (from apps/web/):
 *   node scripts/seed-schedule.mjs
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

function ts(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(0, 0, 0, 0);
  return Timestamp.fromDate(d);
}

// ── Config ──────────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SOCIETY_TOWERS = {
  demo_society_uniworld_001: {
    name: 'Uniworld City',
    towers: [
      { tower: 'Tower A', fee: 599, schedule: 'Mon, Wed, Fri · 7:00 AM' },
      { tower: 'Tower B', fee: 599, schedule: 'Mon, Wed, Fri · 7:00 AM' },
      { tower: 'Tower C', fee: 549, schedule: 'Mon, Wed, Fri · 9:00 AM' },
      { tower: 'Tower D', fee: 549, schedule: 'Mon, Wed, Fri · 9:00 AM' },
    ],
  },
  demo_society_dlf_002: {
    name: 'DLF Capital Greens',
    towers: [
      { tower: 'Greens I',   fee: 699, schedule: 'Tue, Thu, Sat · 7:30 AM' },
      { tower: 'Greens II',  fee: 699, schedule: 'Tue, Thu, Sat · 7:30 AM' },
      { tower: 'Greens III', fee: 649, schedule: 'Tue, Thu, Sat · 9:00 AM' },
    ],
  },
  demo_society_mahagun_003: {
    name: 'Mahagun Moderne',
    towers: [
      { tower: 'North Wing',  fee: 499, schedule: 'Mon, Wed, Fri, Sun · 6:30 AM' },
      { tower: 'South Wing',  fee: 499, schedule: 'Mon, Wed, Fri, Sun · 6:30 AM' },
      { tower: 'East Wing',   fee: 499, schedule: 'Mon, Wed, Fri, Sun · 9:00 AM' },
      { tower: 'West Wing',   fee: 499, schedule: 'Mon, Wed, Fri, Sun · 9:00 AM' },
      { tower: 'Central',     fee: 449, schedule: 'Mon, Wed, Fri, Sun · 2:00 PM' },
    ],
  },
};

function parseWeekdays(scheduleStr) {
  const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const daysMatch = scheduleStr?.match(/^(.*?)\s*·/);
  const daysStr = daysMatch ? daysMatch[1] : (scheduleStr || 'Mon, Wed, Fri');
  return daysStr.split(',').map(d => dayMap[d.trim()]).filter(d => d !== undefined);
}

function getCleaningDatesForRange(startDate, endDate, weekdays) {
  const dates = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    if (weekdays.includes(current.getDay())) dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// ── Seed: societyBillingConfig ──────────────────────────────────────────────────

async function seedBillingConfigs() {
  console.log('\n── 1. societyBillingConfig ────────────────────────────────────');
  let created = 0, skipped = 0;

  for (const [societyId, info] of Object.entries(SOCIETY_TOWERS)) {
    for (const t of info.towers) {
      const docId = `${societyId}_${t.tower}`;
      const ref = db.collection('societyBillingConfig').doc(docId);
      const snap = await ref.get();
      if (snap.exists) { skipped++; continue; }

      const weekdays = parseWeekdays(t.schedule);
      await ref.set({
        societyId,
        societyName: info.name,
        tower: t.tower,
        monthlyFee: t.fee,
        cleaningDays: weekdays,
        cleaningSchedule: t.schedule,
        currency: 'INR',
        billingDay: 1,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      created++;
      console.log(`  ✓  societyBillingConfig/${docId}  (${info.name} · ${t.tower} · ₹${t.fee})`);
    }
  }
  return { created, skipped };
}

// ── Seed: customerSocietyRecords ────────────────────────────────────────────────

const CUSTOMER_ENROLLMENTS = [
  // ── Uniworld City (Tower A) ──────────────────────────────────────────────────
  {
    id: 'enroll_rahul_uniworld',
    customerId: 'demo_cust_rahul_001', customerName: 'Rahul Mehta',  customerPhone: '+919876502001',
    societyId: 'demo_society_uniworld_001', societyName: 'Uniworld City',
    tower: 'Tower A', unitNumber: '1204',
    cars: [
      { plate: 'DL 01 AB 1234', make: 'Mercedes-Benz', model: 'GLE 450' },
    ],
    preferredCleaningTime: 7, status: 'active', signupSource: 'self_signup',
    monthlyFee: 599, paymentStatus: 'verified',
  },
  {
    id: 'enroll_priya_uniworld',
    customerId: 'demo_cust_priya_002', customerName: 'Priya Sharma',  customerPhone: '+919876502002',
    societyId: 'demo_society_uniworld_001', societyName: 'Uniworld City',
    tower: 'Tower A', unitNumber: '0805',
    cars: [
      { plate: 'DL 02 EF 9012', make: 'Audi', model: 'Q5' },
    ],
    preferredCleaningTime: 7, status: 'active', signupSource: 'bulk_import',
    monthlyFee: 599, paymentStatus: 'verified',
  },
  // ── Uniworld City (Tower C) ──────────────────────────────────────────────────
  {
    id: 'enroll_amit_uniworld',
    customerId: 'demo_cust_amit_003', customerName: 'Amit Gupta',  customerPhone: '+919876502003',
    societyId: 'demo_society_uniworld_001', societyName: 'Uniworld City',
    tower: 'Tower C', unitNumber: '1602',
    cars: [
      { plate: 'HR 26 GH 3456', make: 'Honda', model: 'City' },
    ],
    preferredCleaningTime: 9, status: 'active', signupSource: 'bulk_import',
    monthlyFee: 549, paymentStatus: 'verified',
  },
  // ── DLF Capital Greens (Greens I) ────────────────────────────────────────────
  {
    id: 'enroll_sanjay_dlf',
    customerId: 'demo_cust_sanjay_005', customerName: 'Sanjay Kapoor',  customerPhone: '+919876502005',
    societyId: 'demo_society_dlf_002', societyName: 'DLF Capital Greens',
    tower: 'Greens I', unitNumber: 'A-204',
    cars: [
      { plate: 'DL 03 KL 2345', make: 'Toyota', model: 'Fortuner' },
      { plate: 'DL 03 MN 6789', make: 'Hyundai', model: 'Creta' },
    ],
    preferredCleaningTime: 7, status: 'active', signupSource: 'self_signup',
    monthlyFee: 699, paymentStatus: 'verified',
  },
  // ── DLF Capital Greens (Greens II) ───────────────────────────────────────────
  {
    id: 'enroll_divya_dlf',
    customerId: 'demo_cust_divya_006', customerName: 'Divya Nair',  customerPhone: '+919876502006',
    societyId: 'demo_society_dlf_002', societyName: 'DLF Capital Greens',
    tower: 'Greens II', unitNumber: 'C-1101',
    cars: [
      { plate: 'KA 04 OP 1111', make: 'Kia', model: 'Seltos' },
    ],
    preferredCleaningTime: 9, status: 'active', signupSource: 'bulk_import',
    monthlyFee: 699, paymentStatus: 'verified',
  },
  // ── Mahagun Moderne (North Wing) ─────────────────────────────────────────────
  {
    id: 'enroll_rohit_mahagun',
    customerId: 'demo_cust_rohit_007', customerName: 'Rohit Agarwal',  customerPhone: '+919876502007',
    societyId: 'demo_society_mahagun_003', societyName: 'Mahagun Moderne',
    tower: 'North Wing', unitNumber: 'NB-302',
    cars: [
      { plate: 'MH 12 QR 4444', make: 'Tata', model: 'Nexon EV' },
    ],
    preferredCleaningTime: 7, status: 'active', signupSource: 'self_signup',
    monthlyFee: 499, paymentStatus: 'pending_payment',
  },
  // ── Mahagun Moderne (South Wing) ─────────────────────────────────────────────
  {
    id: 'enroll_neha_mahagun',
    customerId: 'demo_cust_neha_004', customerName: 'Neha Patel',  customerPhone: '+919876502004',
    societyId: 'demo_society_mahagun_003', societyName: 'Mahagun Moderne',
    tower: 'South Wing', unitNumber: 'SW-518',
    cars: [
      { plate: 'UP 16 IJ 7890', make: 'Maruti Suzuki', model: 'Baleno' },
    ],
    preferredCleaningTime: 9, status: 'active', signupSource: 'bulk_import',
    monthlyFee: 499, paymentStatus: 'verified',
  },
  // ── Mahagun Moderne (East Wing) — pending enrollment ─────────────────────────
  {
    id: 'enroll_kavita_mahagun',
    customerId: 'demo_cust_kavita_008', customerName: 'Kavita Singh',  customerPhone: '+919876502008',
    societyId: 'demo_society_mahagun_003', societyName: 'Mahagun Moderne',
    tower: 'East Wing', unitNumber: 'EW-701',
    cars: [
      { plate: 'DL 05 ZZ 9999', make: 'Maruti Suzuki', model: 'Swift' },
    ],
    preferredCleaningTime: 14, status: 'pending', signupSource: 'self_signup',
    monthlyFee: 499, paymentStatus: 'not_verified',
  },
];

async function seedEnrollments() {
  console.log('\n── 2. customerSocietyRecords ────────────────────────────────');
  let created = 0, skipped = 0;

  for (const record of CUSTOMER_ENROLLMENTS) {
    const { id, ...data } = record;
    const ref = db.collection('customerSocietyRecords').doc(id);
    const snap = await ref.get();
    if (snap.exists) { skipped++; continue; }

    await ref.set({
      ...data,
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      skipDates: [],
      rescheduledSlots: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    created++;
    console.log(`  ✓  customerSocietyRecords/${id}  (${data.customerName} → ${data.societyName} · ${data.tower})`);
  }
  return { created, skipped };
}

// ── Seed: cleaningSessions ──────────────────────────────────────────────────────

async function seedCleaningSessions() {
  console.log('\n── 3. cleaningSessions ──────────────────────────────────────');
  let created = 0, skipped = 0;

  // Generate sessions from today through the end of next week
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 13); // today + 13 days covers this week + next week

  const WORKER_MAP = {
    demo_society_uniworld_001: {
      workerIds: ['demo_worker_ravi_001', 'demo_worker_aakash_003'],
      workerNames: ['Ravi Kumar', 'Aakash Singh'],
    },
    demo_society_dlf_002: {
      workerIds: ['demo_worker_deepak_005'],
      workerNames: ['Deepak Verma'],
    },
    demo_society_mahagun_003: {
      workerIds: ['demo_worker_suresh_002', 'demo_worker_manoj_004'],
      workerNames: ['Suresh Yadav', 'Manoj Sharma'],
    },
  };

  // Map enrollments to car data per tower for session building
  const enrollmentCars = {};
  for (const e of CUSTOMER_ENROLLMENTS) {
    if (e.status !== 'active') continue;
    const key = `${e.societyId}:${e.tower}`;
    if (!enrollmentCars[key]) enrollmentCars[key] = [];
    for (const car of e.cars) {
      enrollmentCars[key].push({
        customerId: e.customerId,
        customerName: e.customerName,
        unitNumber: e.unitNumber || '',
        carPlate: car.plate,
        carMake: car.make,
        carModel: car.model,
        preferredTime: e.preferredCleaningTime,
        status: 'pending',
      });
    }
  }

  for (const [societyId, info] of Object.entries(SOCIETY_TOWERS)) {
    for (const t of info.towers) {
      const weekdays = parseWeekdays(t.schedule);
      const dates = getCleaningDatesForRange(today, endDate, weekdays);
      const towerSlug = t.tower.trim().replace(/\s+/g, '-');
      const workers = WORKER_MAP[societyId] || { workerIds: [], workerNames: [] };

      for (const date of dates) {
        const dateStr = date.toISOString().split('T')[0];
        const sessionId = `${societyId}_${towerSlug}_${dateStr}`;

        const ref = db.collection('cleaningSessions').doc(sessionId);
        const snap = await ref.get();
        if (snap.exists) { skipped++; continue; }

        const key = `${societyId}:${t.tower}`;
        const cars = enrollmentCars[key] || [];

        const isToday = date.toDateString() === today.toDateString();
        const status = isToday ? 'scheduled' : 'scheduled';

        await ref.set({
          societyId,
          societyName: info.name,
          tower: t.tower,
          scheduledDate: Timestamp.fromDate(date),
          status,
          cars,
          totalCars: cars.length,
          completedCars: 0,
          skippedCars: 0,
          workerIds: workers.workerIds,
          workerNames: workers.workerNames,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        created++;
        console.log(`  ✓  cleaningSessions/${sessionId}  (${info.name} · ${t.tower} · ${dateStr} · ${cars.length} cars)`);
      }
    }
  }
  return { created, skipped };
}

// ── Run ─────────────────────────────────────────────────────────────────────────

console.log('\n🔧  Seeding society schedule data into Firestore…\n');

const billingRes = await seedBillingConfigs();
const enrollRes  = await seedEnrollments();
const sessRes    = await seedCleaningSessions();

const totalCreated = billingRes.created + enrollRes.created + sessRes.created;
const totalSkipped = billingRes.skipped + enrollRes.skipped + sessRes.skipped;

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Billing Configs  — created ${billingRes.created}, skipped ${billingRes.skipped}
  Enrollments      — created ${enrollRes.created}, skipped ${enrollRes.skipped}
  Sessions         — created ${sessRes.created}, skipped ${sessRes.skipped}
  ──────────────────────────────────
  Total            — created ${totalCreated}, skipped ${totalSkipped}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Done. You can now test the full workflow:

  Admin routes:
    /cleaning-schedule   — view sessions, assign/reassign workers
    /live-cleaning       — real-time car tracking per session
    /tower-billing       — billing config per tower
    /customer-enrollments — manage enrolled residents
    /pending-approvals   — approve Kavita Singh's signup

  Worker mobile:
    Worker home tab shows their assigned society and todays cars
    Mark cars done → live-updates admin dashboard

  Tip: Sessions are created for today through the next 13 days.
`);
process.exit(0);
