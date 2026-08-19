/**
 * seed-demo-swarnabh.mjs — one-off: wires up the client-demo scenario for
 * worker phone +917978718104 (Swarnabh, existing live worker account).
 *
 * 1. Assigns the worker to Princess park / Tower A (towerWorkerAssignments).
 * 2. Adds 2 new active demo customerSocietyRecords to that tower.
 * 3. Appends their cars into TODAY's already-live cleaningSessions doc
 *    (status stays whatever it already is — inprogress — not reset) and
 *    assigns the worker onto it so the worker app shows the queue today.
 *
 * Usage (from apps/web/): node scripts/seed-demo-swarnabh.mjs
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

const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore, FieldValue, Timestamp } = await import('firebase-admin/firestore');
initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore();

const WORKER_ID = 'PATSzQw8DuSAr5png6uu9Qjh6lL2';
const WORKER_NAME = 'Swarnabh';
const SOCIETY_ID = 'demo_society_uniworld_001';
const SOCIETY_NAME = 'Uniworld City'; // matches societyName already used on customerSocietyRecords/sessions for this society
const TOWER = 'Tower A';

const DEMO_CUSTOMERS = [
  {
    customerName: 'Ananya Kapoor', customerPhone: '+919811300019',
    unitNumber: '1207', parkingNumber: 'P-12',
    cars: [{ plate: 'DL 01 ZK 4141', make: 'Kia', model: 'Seltos' }],
    preferredCleaningTime: 7, preferredCleaningDays: [1, 3, 5],
    tier: 'premium', paymentStatus: 'paid', paymentMethod: 'upi',
  },
  {
    customerName: 'Devansh Rao', customerPhone: '+919811300020',
    unitNumber: '1408', parkingNumber: 'P-14',
    cars: [{ plate: 'DL 01 ZL 6262', make: 'Maruti Suzuki', model: 'Baleno' }],
    preferredCleaningTime: 9, preferredCleaningDays: [1, 3, 5],
    tier: 'normal', paymentStatus: 'paid', paymentMethod: 'phone',
  },
];

function digitsOf(phone) { return (phone || '').replace(/\D/g, ''); }

console.log('\n1. Assigning worker to Princess park / Tower A…');
const socRef = db.collection('societies').doc(SOCIETY_ID);
const socSnap = await socRef.get();
const currentAssignments = socSnap.data()?.towerWorkerAssignments ?? {};
const nextAssignments = {
  ...currentAssignments,
  [TOWER]: Array.from(new Set([...(currentAssignments[TOWER] ?? []), WORKER_ID])),
};
await socRef.update({ towerWorkerAssignments: nextAssignments });
console.log(`   towerWorkerAssignments['${TOWER}'] = ${JSON.stringify(nextAssignments[TOWER])}`);

console.log('\n2. Seeding demo customerSocietyRecords…');
const billingSnap = await db.collection('societyBillingConfig').doc(`${SOCIETY_ID}_${TOWER}`).get();
const billing = billingSnap.data();
const newCarsForSession = [];
let residentsAdded = 0, vehiclesAdded = 0;

for (const c of DEMO_CUSTOMERS) {
  const digits = digitsOf(c.customerPhone);
  const customerId = `admin_${digits}`;
  const recordId = `${customerId}_${SOCIETY_ID}_${TOWER}`;
  const recRef = db.collection('customerSocietyRecords').doc(recordId);
  if ((await recRef.get()).exists) {
    console.log(`   ~ ${recordId} already exists, skipping`);
    continue;
  }
  const monthlyFee = billing?.tierPricing?.[c.tier] ?? billing?.monthlyFee ?? 599;
  await recRef.set({
    customerId, customerName: c.customerName, customerPhone: c.customerPhone,
    societyId: SOCIETY_ID, societyName: SOCIETY_NAME, tower: TOWER,
    unitNumber: c.unitNumber, parkingNumber: c.parkingNumber,
    cars: c.cars,
    preferredCleaningTime: c.preferredCleaningTime, preferredCleaningDays: c.preferredCleaningDays,
    signupSource: 'bulk_import', status: 'active',
    tier: c.tier, billingFrequency: 'monthly', deepCleanEnabled: false,
    monthlyFee,
    nextBillingDate: Timestamp.fromDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)),
    paymentStatus: c.paymentStatus, paymentMethod: c.paymentMethod,
    paymentNotes: 'Client demo seed',
    skipDates: [], rescheduledSlots: [],
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  });
  console.log(`   + customerSocietyRecords/${recordId} (${c.customerName})`);

  const custRef = db.collection('customers').doc(customerId);
  if (!(await custRef.get()).exists) {
    await custRef.set({
      id: customerId, name: c.customerName, phone: c.customerPhone,
      email: `${digits}@example.com`, role: 'customer', onboardingComplete: true,
      vehicles: c.cars.map((v, i) => ({
        id: `v${i + 1}`, make: v.make, model: v.model, year: 2023,
        type: 'sedan', registration: v.plate, color: 'White',
      })),
      societyId: SOCIETY_ID, societyName: SOCIETY_NAME, unitNumber: c.unitNumber, tower: TOWER,
      walletBalance: 0, outstandingBalance: 0,
      createdAt: FieldValue.serverTimestamp(),
    });
    console.log(`   + customers/${customerId}`);
  }

  newCarsForSession.push({
    customerId, customerName: c.customerName, customerPhone: c.customerPhone,
    unitNumber: c.unitNumber, parkingNumber: c.parkingNumber,
    carPlate: c.cars[0].plate, carMake: c.cars[0].make, carModel: c.cars[0].model,
    preferredTime: c.preferredCleaningTime, status: 'pending',
  });
  residentsAdded++;
  vehiclesAdded += c.cars.length;
}

if (residentsAdded > 0) {
  await socRef.update({
    activeResidents: FieldValue.increment(residentsAdded),
    vehicleCount: FieldValue.increment(vehiclesAdded),
  });
  console.log(`   societies/${SOCIETY_ID} activeResidents +${residentsAdded}, vehicleCount +${vehiclesAdded}`);
}

console.log("\n3. Appending into TODAY's live cleaningSessions doc + assigning worker…");
const today = new Date(); today.setHours(0, 0, 0, 0);
const dk = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
const slug = TOWER.replace(/\s+/g, '-');
const sessionId = `${SOCIETY_ID}_${slug}_${dk}`;
const sessRef = db.collection('cleaningSessions').doc(sessionId);
const sessSnap = await sessRef.get();
if (!sessSnap.exists) {
  console.log(`   ✗ ${sessionId} does not exist — nothing to append to (unexpected)`);
} else {
  const existing = sessSnap.data();
  const existingPlates = new Set((existing.cars || []).map(c => c.carPlate));
  const toAppend = newCarsForSession.filter(c => !existingPlates.has(c.carPlate));
  await sessRef.update({
    cars: FieldValue.arrayUnion(...toAppend),
    totalCars: FieldValue.increment(toAppend.length),
    workerIds: FieldValue.arrayUnion(WORKER_ID),
    workerNames: FieldValue.arrayUnion(WORKER_NAME),
    updatedAt: FieldValue.serverTimestamp(),
  });
  console.log(`   ✓ ${sessionId}: +${toAppend.length} car(s), worker "${WORKER_NAME}" assigned (status untouched: ${existing.status})`);
}

console.log('\nDone.\n');
process.exit(0);
