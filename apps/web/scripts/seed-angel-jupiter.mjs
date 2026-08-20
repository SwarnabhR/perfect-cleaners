/**
 * seed-angel-jupiter.mjs — onboards a brand-new society, "Angel Jupiter"
 * (Tower C + Tower D), from a resident list handed over by ops. Every
 * resident here was given only a flat number, car plate/model, and a
 * parking spot on Ground / Basement 1 / Basement 2 — no phone numbers, so
 * these go straight to status: 'active' the same way the admin's "Add
 * customer" bulk-import does (see customer-enrollments/page.tsx
 * AddCustomerModal — this script mirrors that write shape).
 *
 * Creates/updates:
 *   1. societies/{id}                — new society, both towers, Anil assigned
 *   2. societyBillingConfig          — one doc per tower (Mon-Fri, ₹500 flat,
 *                                       availableParkingLevels: Ground/B1/B2)
 *   3. customerSocietyRecords        — one doc per resident (11 residents,
 *                                       14 vehicles — two flats each own a
 *                                       car + a two-wheeler, and D-1802 has
 *                                       two cars split across two parking
 *                                       levels, so it gets two records)
 *
 * Does NOT create cleaningSessions — the existing generate-sessions cron
 * picks these records up on its own schedule.
 *
 * Usage (from apps/web/): node scripts/seed-angel-jupiter.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env.local');
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

const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore, FieldValue, Timestamp } = await import('firebase-admin/firestore');
initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore();

const SOCIETY_NAME = 'Angel Jupiter';
const TOWERS = ['Tower C', 'Tower D'];
const WORKER_ID = 'FV09wMOZytZKtA2sLhRC1ZI8a212';
const WORKER_NAME = 'Anil';
const MONTHLY_FEE = 500;
const CLEANING_DAYS = [1, 2, 3, 4, 5]; // Mon-Fri
const PARKING_LEVELS = ['Ground', 'Basement 1', 'Basement 2'];
// One of these per resident — "random on different days" per the source list;
// picked by hand here (not Math.random()) so the seeded schedule is stable
// and reviewable rather than different every time this script is re-run.
const TIME_SLOTS = [8, 8.5, 9, 9.5, 10];

const RESIDENTS = [
  // Basement 2
  { tower: 'Tower D', unit: 'D-1403', parkingNumber: 'P231', parkingLevel: 'Basement 2', time: 8,
    cars: [{ plate: 'UP14FV6730', make: 'Maruti Suzuki', model: 'XL6', category: 'car' }] },
  { tower: 'Tower D', unit: 'D-1201', parkingNumber: 'P219', parkingLevel: 'Basement 2', time: 8.5,
    cars: [{ plate: 'UP14FA3617', make: 'Tata', model: 'Nexon', category: 'car' }] },

  // Basement 1
  { tower: 'Tower D', unit: 'D-204', parkingNumber: 'P85', parkingLevel: 'Basement 1', time: 9,
    cars: [{ plate: 'UP70GE2310', make: 'Maruti Suzuki', model: 'Brezza', category: 'car' }] },
  { tower: 'Tower D', unit: 'D-101', parkingNumber: 'P90', parkingLevel: 'Basement 1', time: 9.5,
    cars: [{ plate: 'UP14HA9381', make: 'Maruti Suzuki', model: 'Grand Vitara', category: 'car' }] },
  { tower: 'Tower D', unit: 'D-201', parkingNumber: '', parkingLevel: 'Basement 1', time: 10,
    cars: [{ plate: 'BR07R6831', make: 'Hyundai', model: 'Xcent', category: 'car' }] },
  { tower: 'Tower D', unit: 'D-1603', parkingNumber: '', parkingLevel: 'Basement 1', time: 8,
    cars: [
      { plate: 'DL8CBH6481', make: 'Hyundai', model: 'Venue', category: 'car' },
      { plate: 'PB02CS2055', make: '', model: 'Scooty', category: 'two-wheeler' },
    ] },
  // Same flat as the Ground-floor D-1802 record below — this resident has a
  // second car parked on a different level, so it's a separate enrollment
  // record (parkingLevel lives on the record, not per-vehicle).
  { tower: 'Tower D', unit: 'D-1802', identitySuffix: 'B1', parkingNumber: '', parkingLevel: 'Basement 1', time: 8.5,
    cars: [{ plate: 'UP14DZ6868', make: 'Honda', model: 'Amaze', category: 'car' }] },
  { tower: 'Tower C', unit: 'C-604', parkingNumber: '', parkingLevel: 'Basement 1', time: 9,
    cars: [
      { plate: 'UP14GR7500', make: '', model: '', category: 'car' },
      { plate: 'DL11SJ1415', make: '', model: 'Scooty', category: 'two-wheeler' },
    ] },

  // Ground
  { tower: 'Tower D', unit: 'D-1802', identitySuffix: 'G', parkingNumber: '', parkingLevel: 'Ground', time: 9.5,
    cars: [{ plate: 'UP16BU0909', make: 'Tata', model: 'Hexa', category: 'car' }] },
  { tower: 'Tower D', unit: 'D-604', parkingNumber: '', parkingLevel: 'Ground', time: 10,
    cars: [{ plate: 'UP14GB8554', make: 'Maruti Suzuki', model: 'Swift', category: 'car' }] },
  { tower: 'Tower D', unit: 'D-1102', parkingNumber: '', parkingLevel: 'Ground', time: 8,
    cars: [
      { plate: 'UP14EU5869', make: 'Honda', model: 'Amaze', category: 'car' },
      { plate: 'UP14GV7244', make: '', model: 'Scooty', category: 'two-wheeler' },
    ] },
];

function firstOfNextMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

console.log('\n1. Creating society "Angel Jupiter"…');
const socRef = db.collection('societies').doc();
const SOCIETY_ID = socRef.id;
await socRef.set({
  name: SOCIETY_NAME,
  address: '', city: '', pincode: '',
  towers: TOWERS,
  totalUnits: 0, // unknown — update from societies-mgmt once ops confirms the full unit count
  activeResidents: 0, vehicleCount: 0, // corrected below once records are written
  isActive: true,
  contractStart: Timestamp.now(),
  pricePerWash: MONTHLY_FEE,
  cleaningSchedule: 'Mon, Tue, Wed, Thu, Fri · 8:00-10:00 AM',
  contactPerson: { name: '', phone: '', role: 'Facility Manager', email: '' },
  assignedWorkerIds: [WORKER_ID],
  towerWorkerAssignments: { 'Tower C': [WORKER_ID], 'Tower D': [WORKER_ID] },
  createdAt: FieldValue.serverTimestamp(),
});
console.log(`   + societies/${SOCIETY_ID}`);

console.log('\n2. Writing per-tower billing config (Mon-Fri, ₹500 flat, parking levels)…');
for (const tower of TOWERS) {
  const configId = `${SOCIETY_ID}_${tower}`;
  await db.collection('societyBillingConfig').doc(configId).set({
    societyId: SOCIETY_ID, societyName: SOCIETY_NAME, tower,
    monthlyFee: MONTHLY_FEE,
    currency: 'INR', billingDay: 1,
    cleaningDays: CLEANING_DAYS,
    cleaningSchedule: 'Mon, Tue, Wed, Thu, Fri · 8:00-10:00 AM',
    billingFrequency: 'monthly',
    availableParkingLevels: PARKING_LEVELS,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  console.log(`   + societyBillingConfig/${configId}`);
}

console.log('\n3. Enrolling residents…');
let residentsAdded = 0, vehiclesAdded = 0;
for (const r of RESIDENTS) {
  const identity = r.unit.replace('-', '') + (r.identitySuffix ?? '');
  const customerId = `admin_${identity}`;
  const recordId = `${customerId}_${SOCIETY_ID}_${r.tower}`;

  await db.collection('customerSocietyRecords').doc(recordId).set({
    customerId,
    societyId: SOCIETY_ID, societyName: SOCIETY_NAME, tower: r.tower,
    unitNumber: r.unit,
    ...(r.parkingNumber ? { parkingNumber: r.parkingNumber } : {}),
    parkingLevel: r.parkingLevel,
    cars: r.cars,
    preferredCleaningTime: r.time,
    preferredCleaningDays: CLEANING_DAYS,
    signupSource: 'bulk_import',
    status: 'active',
    billingFrequency: 'monthly',
    deepCleanEnabled: false,
    monthlyFee: MONTHLY_FEE,
    nextBillingDate: Timestamp.fromDate(firstOfNextMonth()),
    paymentStatus: 'not_verified',
    skipDates: [], rescheduledSlots: [],
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  });
  console.log(`   + customerSocietyRecords/${recordId} (${r.unit}, ${r.parkingLevel}, ${r.cars.length} vehicle(s))`);
  residentsAdded++;
  vehiclesAdded += r.cars.length;
}

await socRef.update({
  activeResidents: FieldValue.increment(residentsAdded),
  vehicleCount: FieldValue.increment(vehiclesAdded),
});
console.log(`\n   societies/${SOCIETY_ID}: activeResidents=${residentsAdded}, vehicleCount=${vehiclesAdded}`);

console.log(`\nDone. Society ID: ${SOCIETY_ID}\n`);
process.exit(0);
