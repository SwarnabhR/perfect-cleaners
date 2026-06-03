/**
 * seed-demo.mjs — populates Firestore with demo workers + customers for testing.
 *
 * Usage (from apps/web/):
 *   node scripts/seed-demo.mjs
 *
 * Reads Firebase Admin credentials from .env.local automatically.
 * Skips documents that already exist (safe to run multiple times).
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ── Parse .env.local ──────────────────────────────────────────────────────────

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
  console.error('❌  Could not read apps/web/.env.local — copy .env.local.example and fill in values.');
  process.exit(1);
}

const projectId   = envVars.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = envVars.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey  = envVars.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌  Missing FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY in .env.local');
  process.exit(1);
}

// ── Firebase Admin ─────────────────────────────────────────────────────────────

const { initializeApp, cert, getApps } = await import('firebase-admin/app');
const { getFirestore, Timestamp }      = await import('firebase-admin/firestore');

if (!getApps().length) {
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

const db = getFirestore();

// ── Demo data ─────────────────────────────────────────────────────────────────

const now = Timestamp.now();

function ts(daysAgo) {
  return Timestamp.fromMillis(Date.now() - daysAgo * 86_400_000);
}

const WORKERS = [
  {
    id: 'demo_worker_ravi_001',
    name: 'Ravi Kumar',
    phone: '+919876501001',
    isOnline: true,
    activeBookingId: null,
    rating: 4.8,
    totalJobs: 312,
    earnings: { today: 1200, week: 7400, month: 28600 },
    assignedSocietyId: null,
    assignedSocietyName: null,
    createdAt: ts(180),
  },
  {
    id: 'demo_worker_suresh_002',
    name: 'Suresh Yadav',
    phone: '+919876501002',
    isOnline: true,
    activeBookingId: 'demo_booking_001',
    rating: 4.5,
    totalJobs: 187,
    earnings: { today: 800, week: 5200, month: 19800 },
    assignedSocietyId: null,
    assignedSocietyName: null,
    createdAt: ts(130),
  },
  {
    id: 'demo_worker_aakash_003',
    name: 'Aakash Singh',
    phone: '+919876501003',
    isOnline: true,
    activeBookingId: null,
    rating: 4.7,
    totalJobs: 241,
    earnings: { today: 1400, week: 6800, month: 24200 },
    assignedSocietyId: null,
    assignedSocietyName: null,
    createdAt: ts(210),
  },
  {
    id: 'demo_worker_manoj_004',
    name: 'Manoj Sharma',
    phone: '+919876501004',
    isOnline: false,
    activeBookingId: null,
    rating: 4.3,
    totalJobs: 98,
    earnings: { today: 0, week: 3100, month: 12400 },
    assignedSocietyId: null,
    assignedSocietyName: null,
    createdAt: ts(90),
  },
  {
    id: 'demo_worker_deepak_005',
    name: 'Deepak Verma',
    phone: '+919876501005',
    isOnline: true,
    activeBookingId: null,
    rating: 4.9,
    totalJobs: 428,
    earnings: { today: 1800, week: 9200, month: 34500 },
    assignedSocietyId: null,
    assignedSocietyName: null,
    createdAt: ts(365),
  },
];

const CUSTOMERS = [
  {
    id: 'demo_cust_rahul_001',
    name: 'Rahul Mehta',
    phone: '+919876502001',
    email: 'rahul.mehta@example.com',
    role: 'customer',
    onboardingComplete: true,
    walletBalance: 1500,
    outstandingBalance: 0,
    referralCode: 'RAHUL2024',
    vehicles: [
      { id: 'v1', make: 'Mercedes-Benz', model: 'GLE 450', year: 2023, type: 'suv', registration: 'DL 01 AB 1234', color: 'Obsidian Black' },
      { id: 'v2', make: 'BMW', model: '5 Series', year: 2022, type: 'sedan', registration: 'DL 01 CD 5678', color: 'Alpine White' },
    ],
    createdAt: ts(400),
  },
  {
    id: 'demo_cust_priya_002',
    name: 'Priya Sharma',
    phone: '+919876502002',
    email: 'priya.sharma@example.com',
    role: 'customer',
    onboardingComplete: true,
    walletBalance: 800,
    outstandingBalance: 0,
    referralCode: 'PRIYA2024',
    vehicles: [
      { id: 'v3', make: 'Audi', model: 'Q5', year: 2022, type: 'suv', registration: 'DL 02 EF 9012', color: 'Glacier White' },
    ],
    createdAt: ts(280),
  },
  {
    id: 'demo_cust_amit_003',
    name: 'Amit Gupta',
    phone: '+919876502003',
    email: 'amit.gupta@example.com',
    role: 'customer',
    onboardingComplete: true,
    walletBalance: 200,
    outstandingBalance: 0,
    referralCode: 'AMIT2024',
    vehicles: [
      { id: 'v4', make: 'Honda', model: 'City', year: 2021, type: 'sedan', registration: 'HR 26 GH 3456', color: 'Platinum White' },
    ],
    createdAt: ts(180),
  },
  {
    id: 'demo_cust_neha_004',
    name: 'Neha Patel',
    phone: '+919876502004',
    email: 'neha.patel@example.com',
    role: 'customer',
    onboardingComplete: true,
    walletBalance: 0,
    outstandingBalance: 650,
    referralCode: 'NEHA2024',
    vehicles: [
      { id: 'v5', make: 'Maruti Suzuki', model: 'Baleno', year: 2022, type: 'hatchback', registration: 'UP 16 IJ 7890', color: 'Pearl Arctic White' },
    ],
    createdAt: ts(90),
  },
  {
    id: 'demo_cust_sanjay_005',
    name: 'Sanjay Kapoor',
    phone: '+919876502005',
    email: 'sanjay.kapoor@example.com',
    role: 'customer',
    onboardingComplete: true,
    walletBalance: 600,
    outstandingBalance: 0,
    referralCode: 'SANJAY24',
    vehicles: [
      { id: 'v6', make: 'Toyota', model: 'Fortuner', year: 2023, type: 'suv', registration: 'DL 03 KL 2345', color: 'Sparkling Black' },
      { id: 'v7', make: 'Hyundai', model: 'Creta', year: 2021, type: 'suv', registration: 'DL 03 MN 6789', color: 'Typhoon Silver' },
    ],
    createdAt: ts(320),
  },
  {
    id: 'demo_cust_divya_006',
    name: 'Divya Nair',
    phone: '+919876502006',
    email: 'divya.nair@example.com',
    role: 'customer',
    onboardingComplete: true,
    walletBalance: 350,
    outstandingBalance: 0,
    referralCode: 'DIVYA024',
    vehicles: [
      { id: 'v8', make: 'Kia', model: 'Seltos', year: 2022, type: 'suv', registration: 'KA 04 OP 1111', color: 'Intelligency Blue' },
    ],
    createdAt: ts(150),
  },
  {
    id: 'demo_cust_rohit_007',
    name: 'Rohit Agarwal',
    phone: '+919876502007',
    email: 'rohit.agarwal@example.com',
    role: 'customer',
    onboardingComplete: true,
    walletBalance: 0,
    outstandingBalance: 0,
    referralCode: 'ROHIT024',
    vehicles: [
      { id: 'v9', make: 'Tata', model: 'Nexon EV', year: 2023, type: 'suv', registration: 'MH 12 QR 4444', color: 'Pristine White' },
    ],
    createdAt: ts(60),
  },
  {
    id: 'demo_cust_kavita_008',
    name: 'Kavita Singh',
    phone: '+919876502008',
    email: 'kavita.singh@example.com',
    role: 'customer',
    onboardingComplete: false,
    walletBalance: 0,
    outstandingBalance: 0,
    referralCode: 'KAVIT024',
    vehicles: [],
    createdAt: ts(10),
  },
];

// ── Seed helpers ──────────────────────────────────────────────────────────────

async function seedCollection(collectionName, records) {
  let created = 0;
  let skipped = 0;

  for (const record of records) {
    const { id, ...data } = record;
    const ref = db.collection(collectionName).doc(id);
    const snap = await ref.get();

    if (snap.exists) {
      skipped++;
      continue;
    }

    await ref.set(data);
    created++;
    console.log(`  ✓  ${collectionName}/${id}  (${data.name})`);
  }

  return { created, skipped };
}

// ── Run ───────────────────────────────────────────────────────────────────────

console.log('\n🔧  Seeding demo data into Firestore…\n');

const wResult = await seedCollection('workers',   WORKERS);
const cResult = await seedCollection('customers', CUSTOMERS);

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Workers   — created ${wResult.created}, skipped ${wResult.skipped}
  Customers — created ${cResult.created}, skipped ${cResult.skipped}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Done. Open the admin dashboard to see the data.
`);

process.exit(0);
