/**
 * seed-demo.mjs — populates Firestore with demo data for testing.
 *
 * Usage (from apps/web/):
 *   node scripts/seed-demo.mjs
 *
 * Safe to run multiple times — skips documents that already exist.
 * To wipe all seeded data run:  node scripts/unseed-demo.mjs
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
const { getFirestore, Timestamp }      = await import('firebase-admin/firestore');

if (!getApps().length) initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });

const db = getFirestore();

function ts(daysAgo) {
  return Timestamp.fromMillis(Date.now() - daysAgo * 86_400_000);
}
function ref(code) { return `PC-${code}`; }

// ── Workers ───────────────────────────────────────────────────────────────────

const WORKERS = [
  {
    id: 'demo_worker_ravi_001',
    name: 'Ravi Kumar', phone: '+919876501001',
    isOnline: true, activeBookingId: null, rating: 4.8, totalJobs: 312,
    assignedSocietyId: 'demo_society_uniworld_001', assignedSocietyName: 'Uniworld City',
    createdAt: ts(180),
  },
  {
    id: 'demo_worker_suresh_002',
    name: 'Suresh Yadav', phone: '+919876501002',
    isOnline: true, activeBookingId: 'demo_booking_019', rating: 4.5, totalJobs: 187,
    assignedSocietyId: 'demo_society_mahagun_003', assignedSocietyName: 'Mahagun Moderne',
    createdAt: ts(130),
  },
  {
    id: 'demo_worker_aakash_003',
    name: 'Aakash Singh', phone: '+919876501003',
    isOnline: true, activeBookingId: null, rating: 4.7, totalJobs: 241,
    assignedSocietyId: 'demo_society_uniworld_001', assignedSocietyName: 'Uniworld City',
    createdAt: ts(210),
  },
  {
    id: 'demo_worker_manoj_004',
    name: 'Manoj Sharma', phone: '+919876501004',
    isOnline: false, activeBookingId: null, rating: 4.3, totalJobs: 98,
    assignedSocietyId: 'demo_society_mahagun_003', assignedSocietyName: 'Mahagun Moderne',
    createdAt: ts(90),
  },
  {
    id: 'demo_worker_deepak_005',
    name: 'Deepak Verma', phone: '+919876501005',
    isOnline: true, activeBookingId: null, rating: 4.9, totalJobs: 428,
    assignedSocietyId: 'demo_society_dlf_002', assignedSocietyName: 'DLF Capital Greens',
    createdAt: ts(365),
  },
];

// ── Customers ─────────────────────────────────────────────────────────────────

const CUSTOMERS = [
  {
    id: 'demo_cust_rahul_001',
    name: 'Rahul Mehta', phone: '+919876502001', email: 'rahul.mehta@example.com',
    role: 'customer', onboardingComplete: true, walletBalance: 1500, outstandingBalance: 0,
    referralCode: 'RAHUL2024',
    vehicles: [
      { id: 'v1', make: 'Mercedes-Benz', model: 'GLE 450', year: 2023, type: 'suv', registration: 'DL 01 AB 1234', color: 'Obsidian Black' },
      { id: 'v2', make: 'BMW', model: '5 Series', year: 2022, type: 'sedan', registration: 'DL 01 CD 5678', color: 'Alpine White' },
    ],
    createdAt: ts(400),
  },
  {
    id: 'demo_cust_priya_002',
    name: 'Priya Sharma', phone: '+919876502002', email: 'priya.sharma@example.com',
    role: 'customer', onboardingComplete: true, walletBalance: 800, outstandingBalance: 0,
    referralCode: 'PRIYA2024',
    vehicles: [{ id: 'v3', make: 'Audi', model: 'Q5', year: 2022, type: 'suv', registration: 'DL 02 EF 9012', color: 'Glacier White' }],
    createdAt: ts(280),
  },
  {
    id: 'demo_cust_amit_003',
    name: 'Amit Gupta', phone: '+919876502003', email: 'amit.gupta@example.com',
    role: 'customer', onboardingComplete: true, walletBalance: 200, outstandingBalance: 0,
    referralCode: 'AMIT2024',
    vehicles: [{ id: 'v4', make: 'Honda', model: 'City', year: 2021, type: 'sedan', registration: 'HR 26 GH 3456', color: 'Platinum White' }],
    createdAt: ts(180),
  },
  {
    id: 'demo_cust_neha_004',
    name: 'Neha Patel', phone: '+919876502004', email: 'neha.patel@example.com',
    role: 'customer', onboardingComplete: true, walletBalance: 0, outstandingBalance: 650,
    referralCode: 'NEHA2024',
    vehicles: [{ id: 'v5', make: 'Maruti Suzuki', model: 'Baleno', year: 2022, type: 'hatchback', registration: 'UP 16 IJ 7890', color: 'Pearl Arctic White' }],
    createdAt: ts(90),
  },
  {
    id: 'demo_cust_sanjay_005',
    name: 'Sanjay Kapoor', phone: '+919876502005', email: 'sanjay.kapoor@example.com',
    role: 'customer', onboardingComplete: true, walletBalance: 600, outstandingBalance: 0,
    referralCode: 'SANJAY24',
    vehicles: [
      { id: 'v6', make: 'Toyota', model: 'Fortuner', year: 2023, type: 'suv', registration: 'DL 03 KL 2345', color: 'Sparkling Black' },
      { id: 'v7', make: 'Hyundai', model: 'Creta', year: 2021, type: 'suv', registration: 'DL 03 MN 6789', color: 'Typhoon Silver' },
    ],
    createdAt: ts(320),
  },
  {
    id: 'demo_cust_divya_006',
    name: 'Divya Nair', phone: '+919876502006', email: 'divya.nair@example.com',
    role: 'customer', onboardingComplete: true, walletBalance: 350, outstandingBalance: 0,
    referralCode: 'DIVYA024',
    vehicles: [{ id: 'v8', make: 'Kia', model: 'Seltos', year: 2022, type: 'suv', registration: 'KA 04 OP 1111', color: 'Intelligency Blue' }],
    createdAt: ts(150),
  },
  {
    id: 'demo_cust_rohit_007',
    name: 'Rohit Agarwal', phone: '+919876502007', email: 'rohit.agarwal@example.com',
    role: 'customer', onboardingComplete: true, walletBalance: 0, outstandingBalance: 0,
    referralCode: 'ROHIT024',
    vehicles: [{ id: 'v9', make: 'Tata', model: 'Nexon EV', year: 2023, type: 'suv', registration: 'MH 12 QR 4444', color: 'Pristine White' }],
    createdAt: ts(60),
  },
  {
    id: 'demo_cust_kavita_008',
    name: 'Kavita Singh', phone: '+919876502008', email: 'kavita.singh@example.com',
    role: 'customer', onboardingComplete: false, walletBalance: 0, outstandingBalance: 0,
    referralCode: 'KAVIT024', vehicles: [],
    createdAt: ts(10),
  },
];

// ── Societies ─────────────────────────────────────────────────────────────────

const SOCIETIES = [
  {
    id: 'demo_society_uniworld_001',
    name: 'Uniworld City', address: 'Sector 30', city: 'Noida', pincode: '201301',
    towers: ['Tower A', 'Tower B', 'Tower C', 'Tower D'],
    totalUnits: 320, activeResidents: 187, vehicleCount: 214,
    isActive: true, pricePerWash: 99,
    cleaningSchedule: 'Mon, Wed, Fri · 7:00 AM',
    contactPerson: { name: 'Rajesh Sharma', phone: '+919876503001', email: 'rajesh@uniworld.in', role: 'Facility Manager' },
    assignedWorkerIds: ['demo_worker_ravi_001', 'demo_worker_aakash_003'],
    contractStart: ts(180), createdAt: ts(180),
  },
  {
    id: 'demo_society_dlf_002',
    name: 'DLF Capital Greens', address: 'Moti Nagar', city: 'Delhi', pincode: '110015',
    towers: ['Greens I', 'Greens II', 'Greens III'],
    totalUnits: 450, activeResidents: 312, vehicleCount: 389,
    isActive: true, pricePerWash: 119,
    cleaningSchedule: 'Tue, Thu, Sat · 7:30 AM',
    contactPerson: { name: 'Pradeep Mehta', phone: '+919876503002', email: 'pm@dlfcg.com', role: 'RWA President' },
    assignedWorkerIds: ['demo_worker_deepak_005'],
    contractStart: ts(120), createdAt: ts(120),
  },
  {
    id: 'demo_society_mahagun_003',
    name: 'Mahagun Moderne', address: 'Sector 78', city: 'Noida', pincode: '201309',
    towers: ['North Wing', 'South Wing', 'East Wing', 'West Wing', 'Central'],
    totalUnits: 520, activeResidents: 298, vehicleCount: 341,
    isActive: true, pricePerWash: 109,
    cleaningSchedule: 'Mon, Wed, Fri, Sun · 6:30 AM',
    contactPerson: { name: 'Sunita Verma', phone: '+919876503003', email: 'sunita@mahagun.in', role: 'Facility Manager' },
    assignedWorkerIds: ['demo_worker_suresh_002', 'demo_worker_manoj_004'],
    contractStart: ts(60), createdAt: ts(60),
  },
  {
    id: 'demo_society_supertech_004',
    name: 'Supertech Eco Village', address: 'Sector 137', city: 'Noida', pincode: '201305',
    towers: ['Block A', 'Block B', 'Block C'],
    totalUnits: 280, activeResidents: 89, vehicleCount: 102,
    isActive: false, pricePerWash: 89,
    cleaningSchedule: 'Mon, Thu · 8:00 AM',
    contactPerson: { name: 'Amit Joshi', phone: '+919876503004', email: 'ajoshi@supertech.com', role: 'Property Manager' },
    assignedWorkerIds: [],
    contractStart: ts(240), contractEnd: ts(30), createdAt: ts(240),
  },
];

// ── Bookings ──────────────────────────────────────────────────────────────────

const ADDR_NOIDA    = { line1: 'Sector 30, Noida',   city: 'Noida',   pincode: '201301', coordinates: { latitude: 28.5706, longitude: 77.3219 } };
const ADDR_DELHI    = { line1: 'Moti Nagar, Delhi',  city: 'Delhi',   pincode: '110015', coordinates: { latitude: 28.6538, longitude: 77.1487 } };
const ADDR_GURUGRAM = { line1: 'DLF Phase 2, Gurugram', city: 'Gurugram', pincode: '122002', coordinates: { latitude: 28.4763, longitude: 77.0929 } };
const ADDR_NOIDA_78 = { line1: 'Sector 78, Noida',   city: 'Noida',   pincode: '201309', coordinates: { latitude: 28.5933, longitude: 77.3684 } };

function booking({ id, code, cId, cName, cPhone, wId, wName, svcIds, vehicle, status, daysAgo, addr, subtotal, tax, total, payStatus, payId }) {
  const scheduled = ts(daysAgo);
  const created   = ts(daysAgo + 1);
  return {
    id, bookingRef: ref(code),
    customerId: cId, customerName: cName, customerPhone: cPhone,
    workerId: wId ?? null, workerName: wName ?? null,
    serviceIds: svcIds,
    vehicle,
    status,
    scheduledAt: scheduled,
    address: addr,
    priceBreakdown: { subtotal, tax, total },
    paymentStatus: payStatus,
    paymentId: payId ?? null,
    photos: { before: [], after: [] },
    otpCode: null,
    workerNotes: null,
    createdAt: created,
    updatedAt: scheduled,
    completedAt: status === 'done' ? scheduled : null,
  };
}

const V = {
  mercedesGLE:  { id: 'v1', make: 'Mercedes-Benz', model: 'GLE 450',  year: 2023, type: 'suv',      registration: 'DL 01 AB 1234', color: 'Obsidian Black'   },
  bmw5:         { id: 'v2', make: 'BMW',            model: '5 Series', year: 2022, type: 'sedan',    registration: 'DL 01 CD 5678', color: 'Alpine White'     },
  audiQ5:       { id: 'v3', make: 'Audi',           model: 'Q5',       year: 2022, type: 'suv',      registration: 'DL 02 EF 9012', color: 'Glacier White'    },
  hondaCity:    { id: 'v4', make: 'Honda',          model: 'City',     year: 2021, type: 'sedan',    registration: 'HR 26 GH 3456', color: 'Platinum White'   },
  fortuner:     { id: 'v6', make: 'Toyota',         model: 'Fortuner', year: 2023, type: 'suv',      registration: 'DL 03 KL 2345', color: 'Sparkling Black'  },
  creta:        { id: 'v7', make: 'Hyundai',        model: 'Creta',    year: 2021, type: 'suv',      registration: 'DL 03 MN 6789', color: 'Typhoon Silver'   },
  seltos:       { id: 'v8', make: 'Kia',            model: 'Seltos',   year: 2022, type: 'suv',      registration: 'KA 04 OP 1111', color: 'Intelligency Blue'},
  nexonEV:      { id: 'v9', make: 'Tata',           model: 'Nexon EV', year: 2023, type: 'suv',      registration: 'MH 12 QR 4444', color: 'Pristine White'   },
  baleno:       { id: 'v5', make: 'Maruti Suzuki',  model: 'Baleno',   year: 2022, type: 'hatchback', registration: 'UP 16 IJ 7890', color: 'Pearl Arctic White'},
};

const BOOKINGS = [
  // ── Rahul Mehta (total ₹61,500 paid) ──────────────────────────────────────
  booking({ id:'demo_booking_001', code:'A1B2C3', cId:'demo_cust_rahul_001', cName:'Rahul Mehta', cPhone:'+919876502001', wId:'demo_worker_deepak_005', wName:'Deepak Verma', svcIds:['premium-exterior-wash','interior-vacuum'], vehicle:V.mercedesGLE, status:'done', daysAgo:85, addr:ADDR_NOIDA,    subtotal:7627, tax:1373, total:9000,  payStatus:'paid', payId:'pay_demo_001' }),
  booking({ id:'demo_booking_002', code:'D4E5F6', cId:'demo_cust_rahul_001', cName:'Rahul Mehta', cPhone:'+919876502001', wId:'demo_worker_deepak_005', wName:'Deepak Verma', svcIds:['ceramic-coating'],                         vehicle:V.mercedesGLE, status:'done', daysAgo:70, addr:ADDR_NOIDA,    subtotal:12288, tax:2212, total:14500, payStatus:'paid', payId:'pay_demo_002' }),
  booking({ id:'demo_booking_003', code:'G7H8I9', cId:'demo_cust_rahul_001', cName:'Rahul Mehta', cPhone:'+919876502001', wId:'demo_worker_ravi_001',   wName:'Ravi Kumar',   svcIds:['premium-exterior-wash'],                   vehicle:V.bmw5,        status:'done', daysAgo:55, addr:ADDR_DELHI,    subtotal:7203, tax:1297, total:8500,  payStatus:'paid', payId:'pay_demo_003' }),
  booking({ id:'demo_booking_004', code:'J1K2L3', cId:'demo_cust_rahul_001', cName:'Rahul Mehta', cPhone:'+919876502001', wId:'demo_worker_aakash_003', wName:'Aakash Singh', svcIds:['full-detailing'],                          vehicle:V.mercedesGLE, status:'done', daysAgo:40, addr:ADDR_NOIDA,    subtotal:10169, tax:1831, total:12000, payStatus:'paid', payId:'pay_demo_004' }),
  booking({ id:'demo_booking_005', code:'M4N5O6', cId:'demo_cust_rahul_001', cName:'Rahul Mehta', cPhone:'+919876502001', wId:'demo_worker_deepak_005', wName:'Deepak Verma', svcIds:['premium-exterior-wash','interior-vacuum'], vehicle:V.bmw5,        status:'done', daysAgo:25, addr:ADDR_DELHI,    subtotal:8051, tax:1449, total:9500,  payStatus:'paid', payId:'pay_demo_005' }),
  booking({ id:'demo_booking_006', code:'P7Q8R9', cId:'demo_cust_rahul_001', cName:'Rahul Mehta', cPhone:'+919876502001', wId:'demo_worker_ravi_001',   wName:'Ravi Kumar',   svcIds:['premium-exterior-wash'],                   vehicle:V.mercedesGLE, status:'done', daysAgo:12, addr:ADDR_NOIDA,    subtotal:6780, tax:1220, total:8000,  payStatus:'paid', payId:'pay_demo_006' }),

  // ── Sanjay Kapoor (total ₹32,500 paid) ────────────────────────────────────
  booking({ id:'demo_booking_007', code:'S1T2U3', cId:'demo_cust_sanjay_005', cName:'Sanjay Kapoor', cPhone:'+919876502005', wId:'demo_worker_deepak_005', wName:'Deepak Verma', svcIds:['full-detailing'],           vehicle:V.fortuner, status:'done', daysAgo:75, addr:ADDR_DELHI,    subtotal:6780, tax:1220, total:8000,  payStatus:'paid', payId:'pay_demo_007' }),
  booking({ id:'demo_booking_008', code:'V4W5X6', cId:'demo_cust_sanjay_005', cName:'Sanjay Kapoor', cPhone:'+919876502005', wId:'demo_worker_aakash_003', wName:'Aakash Singh', svcIds:['ceramic-coating'],          vehicle:V.fortuner, status:'done', daysAgo:50, addr:ADDR_NOIDA,    subtotal:9746, tax:1754, total:11500, payStatus:'paid', payId:'pay_demo_008' }),
  booking({ id:'demo_booking_009', code:'Y7Z8A9', cId:'demo_cust_sanjay_005', cName:'Sanjay Kapoor', cPhone:'+919876502005', wId:'demo_worker_ravi_001',   wName:'Ravi Kumar',   svcIds:['premium-exterior-wash'],    vehicle:V.creta,    status:'done', daysAgo:30, addr:ADDR_DELHI,    subtotal:5932, tax:1068, total:7000,  payStatus:'paid', payId:'pay_demo_009' }),
  booking({ id:'demo_booking_010', code:'B1C2D3', cId:'demo_cust_sanjay_005', cName:'Sanjay Kapoor', cPhone:'+919876502005', wId:'demo_worker_suresh_002', wName:'Suresh Yadav', svcIds:['interior-vacuum','exterior-wash'], vehicle:V.creta, status:'done', daysAgo:10, addr:ADDR_NOIDA_78, subtotal:5085, tax:915, total:6000,  payStatus:'paid', payId:'pay_demo_010' }),

  // ── Priya Sharma (total ₹12,500 paid) ─────────────────────────────────────
  booking({ id:'demo_booking_011', code:'E4F5G6', cId:'demo_cust_priya_002', cName:'Priya Sharma', cPhone:'+919876502002', wId:'demo_worker_aakash_003', wName:'Aakash Singh', svcIds:['premium-exterior-wash'], vehicle:V.audiQ5, status:'done', daysAgo:60, addr:ADDR_DELHI,    subtotal:3814, tax:686, total:4500, payStatus:'paid', payId:'pay_demo_011' }),
  booking({ id:'demo_booking_012', code:'H7I8J9', cId:'demo_cust_priya_002', cName:'Priya Sharma', cPhone:'+919876502002', wId:'demo_worker_ravi_001',   wName:'Ravi Kumar',   svcIds:['interior-vacuum'],          vehicle:V.audiQ5, status:'done', daysAgo:35, addr:ADDR_DELHI,    subtotal:3220, tax:580, total:3800, payStatus:'paid', payId:'pay_demo_012' }),
  booking({ id:'demo_booking_013', code:'K1L2M3', cId:'demo_cust_priya_002', cName:'Priya Sharma', cPhone:'+919876502002', wId:'demo_worker_deepak_005', wName:'Deepak Verma', svcIds:['premium-exterior-wash'], vehicle:V.audiQ5, status:'done', daysAgo:15, addr:ADDR_GURUGRAM, subtotal:3559, tax:641, total:4200, payStatus:'paid', payId:'pay_demo_013' }),

  // ── Amit Gupta (total ₹11,300 paid) ───────────────────────────────────────
  booking({ id:'demo_booking_014', code:'N4O5P6', cId:'demo_cust_amit_003', cName:'Amit Gupta', cPhone:'+919876502003', wId:'demo_worker_suresh_002', wName:'Suresh Yadav', svcIds:['exterior-wash'],           vehicle:V.hondaCity, status:'done', daysAgo:45, addr:ADDR_NOIDA_78, subtotal:2966, tax:534, total:3500, payStatus:'paid', payId:'pay_demo_014' }),
  booking({ id:'demo_booking_015', code:'Q7R8S9', cId:'demo_cust_amit_003', cName:'Amit Gupta', cPhone:'+919876502003', wId:'demo_worker_manoj_004',  wName:'Manoj Sharma', svcIds:['interior-vacuum','exterior-wash'], vehicle:V.hondaCity, status:'done', daysAgo:20, addr:ADDR_NOIDA_78, subtotal:3390, tax:610, total:4000, payStatus:'paid', payId:'pay_demo_015' }),
  booking({ id:'demo_booking_016', code:'T1U2V3', cId:'demo_cust_amit_003', cName:'Amit Gupta', cPhone:'+919876502003', wId:'demo_worker_aakash_003', wName:'Aakash Singh', svcIds:['premium-exterior-wash'], vehicle:V.hondaCity, status:'done', daysAgo:5,  addr:ADDR_NOIDA,    subtotal:3220, tax:580, total:3800, payStatus:'paid', payId:'pay_demo_016' }),

  // ── Divya Nair ─────────────────────────────────────────────────────────────
  booking({ id:'demo_booking_017', code:'W4X5Y6', cId:'demo_cust_divya_006', cName:'Divya Nair', cPhone:'+919876502006', wId:'demo_worker_ravi_001', wName:'Ravi Kumar', svcIds:['exterior-wash'], vehicle:V.seltos, status:'done',      daysAgo:30, addr:ADDR_DELHI, subtotal:2373, tax:427, total:2800, payStatus:'paid', payId:'pay_demo_017' }),
  booking({ id:'demo_booking_018', code:'Z7A8B9', cId:'demo_cust_divya_006', cName:'Divya Nair', cPhone:'+919876502006', wId:null,                   wName:null,          svcIds:['full-detailing'],  vehicle:V.seltos, status:'cancelled', daysAgo:10, addr:ADDR_DELHI, subtotal:5932, tax:1068, total:7000, payStatus:'pending', payId:null }),

  // ── Rohit Agarwal, active booking ─────────────────────────────────────────
  booking({ id:'demo_booking_019', code:'C1D2E3', cId:'demo_cust_rohit_007', cName:'Rohit Agarwal', cPhone:'+919876502007', wId:'demo_worker_suresh_002', wName:'Suresh Yadav', svcIds:['premium-exterior-wash'], vehicle:V.nexonEV, status:'assigned', daysAgo:-1, addr:ADDR_NOIDA_78, subtotal:3390, tax:610, total:4000, payStatus:'pending', payId:null }),

  // ── Neha Patel ─────────────────────────────────────────────────────────────
  booking({ id:'demo_booking_020', code:'F4G5H6', cId:'demo_cust_neha_004', cName:'Neha Patel', cPhone:'+919876502004', wId:'demo_worker_manoj_004', wName:'Manoj Sharma', svcIds:['exterior-wash'], vehicle:V.baleno, status:'done', daysAgo:20, addr:ADDR_NOIDA, subtotal:1525, tax:275, total:1800, payStatus:'paid', payId:'pay_demo_020' }),

  // ── Kavita Singh, fresh pending ────────────────────────────────────────────
  booking({ id:'demo_booking_021', code:'I7J8K9', cId:'demo_cust_kavita_008', cName:'Kavita Singh', cPhone:'+919876502008', wId:null, wName:null, svcIds:['exterior-wash'], vehicle:{ id:'vtmp', make:'Maruti Suzuki', model:'Swift', year:2020, type:'hatchback', registration:'DL 05 ZZ 9999', color:'Red'}, status:'pending', daysAgo:0, addr:ADDR_DELHI, subtotal:1271, tax:229, total:1500, payStatus:'pending', payId:null }),
];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function seedCollection(col, records) {
  let created = 0, skipped = 0;
  for (const record of records) {
    const { id, ...data } = record;
    const docRef = db.collection(col).doc(id);
    const snap = await docRef.get();
    if (snap.exists) { skipped++; continue; }
    await docRef.set(data);
    created++;
    console.log(`  ✓  ${col}/${id}  (${data.name ?? data.bookingRef ?? id})`);
  }
  return { created, skipped };
}

async function updateWorkerSocieties() {
  for (const w of WORKERS) {
    if (!w.assignedSocietyId) continue;
    const docRef = db.collection('workers').doc(w.id);
    const snap = await docRef.get();
    if (!snap.exists) continue;
    const existing = snap.data();
    if (existing.assignedSocietyId === w.assignedSocietyId) continue;
    await docRef.update({ assignedSocietyId: w.assignedSocietyId, assignedSocietyName: w.assignedSocietyName });
    console.log(`  ↻  workers/${w.id}  society → ${w.assignedSocietyName}`);
  }
}

// ── Run ───────────────────────────────────────────────────────────────────────

console.log('\n🔧  Seeding demo data into Firestore…\n');

const wRes = await seedCollection('workers', WORKERS);
const cRes = await seedCollection('customers', CUSTOMERS);
const sRes = await seedCollection('societies', SOCIETIES);
const bRes = await seedCollection('bookings',  BOOKINGS);
await updateWorkerSocieties();

const totalCreated = wRes.created + cRes.created + sRes.created + bRes.created;
const totalSkipped = wRes.skipped + cRes.skipped + sRes.skipped + bRes.skipped;

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Workers    — created ${wRes.created}, skipped ${wRes.skipped}
  Customers  — created ${cRes.created}, skipped ${cRes.skipped}
  Societies  — created ${sRes.created}, skipped ${sRes.skipped}
  Bookings   — created ${bRes.created}, skipped ${bRes.skipped}
  ──────────────────────────────────
  Total      — created ${totalCreated}, skipped ${totalSkipped}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Done. Open the admin dashboard to see the data.
`);

process.exit(0);
