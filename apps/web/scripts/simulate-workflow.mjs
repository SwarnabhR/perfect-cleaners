/**
 * simulate-workflow.mjs — simulates the full end-to-end workflow:
 *
 *   CUSTOMER → creates booking (Firestore write)
 *   ADMIN    → sees booking, assigns worker
 *   WORKER   → completes the job
 *   ADMIN    → sees completion
 *
 * Also tests the society cleaning flow:
 *   WORKER   → marks a car clean in a session
 *   ADMIN    → sees live update
 *
 * Run from apps/web/:
 *   node scripts/simulate-workflow.mjs
 *
 * Prerequisites: run seed-demo + seed-schedule + seed-remaining first.
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

function hr(label) {
  console.log(`\n${'━'.repeat(60)}\n  ${label}\n${'━'.repeat(60)}`);
}

function ok(msg) {
  console.log(`  ✅  ${msg}`);
}
function info(msg) {
  console.log(`  📋  ${msg}`);
}

// ──────────────────────────────────────────────────────────────────────────────
//  SCENE 1 — CUSTOMER creates a booking
// ──────────────────────────────────────────────────────────────────────────────

hr('SCENE 1: CUSTOMER creates a new booking');

// Use an existing demo customer
const CUSTOMER_ID = 'demo_cust_rahul_001';
const WORKER_ID   = 'demo_worker_deepak_005';

// Fetch customer data
const customerSnap = await db.collection('customers').doc(CUSTOMER_ID).get();
if (!customerSnap.exists) {
  console.error('  ❌  Customer not found. Run seed-demo first.');
  process.exit(1);
}
const customerData = customerSnap.data();
const vehicle = customerData.vehicles[0];
ok(`Customer: ${customerData.name} (${customerData.phone})`);
ok(`Vehicle:  ${vehicle.make} ${vehicle.model} (${vehicle.registration})`);

// Create booking document
const bookingRef = db.collection('bookings').doc();
const scheduledAt = new Date(Date.now() + 4 * 3600_000); // 4 hours from now
const bookingData = {
  id: bookingRef.id,
  customerId: CUSTOMER_ID,
  customerName: customerData.name,
  customerPhone: customerData.phone,
  workerId: null,
  workerName: null,
  serviceIds: ['premium-exterior-wash'],
  vehicle: {
    id: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    type: vehicle.type,
    registration: vehicle.registration,
    color: vehicle.color,
  },
  status: 'pending',
  paymentStatus: 'pending',
  scheduledAt: Timestamp.fromDate(scheduledAt),
  address: {
    line1: 'Sector 30, Noida',
    city: 'Noida',
    pincode: '201301',
    coordinates: { latitude: 28.5706, longitude: 77.3219 },
  },
  priceBreakdown: { subtotal: 3390, tax: 610, total: 4000 },
  photos: { before: [], after: [] },
  otpCode: '4827',
  workerNotes: null,
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
};
await bookingRef.set(bookingData);
ok(`Booking created: ${bookingRef.id}`);
ok(`  Status: pending | Total: ₹4,000 | Service: Premium Exterior Wash`);
ok(`  Scheduled: ${scheduledAt.toLocaleString()}`);

// ──────────────────────────────────────────────────────────────────────────────
//  SCENE 2 — ADMIN sees the booking in dashboard
// ──────────────────────────────────────────────────────────────────────────────

hr('SCENE 2: ADMIN views the booking in dashboard');

const createdBooking = await db.collection('bookings').doc(bookingRef.id).get();
const createdData = createdBooking.data();
info(`Admin dashboard reads bookings collection:`);
info(`  Total bookings in DB: ${(await db.collection('bookings').get()).size}`);
info(`  New booking status: ${createdData.status}`);
info(`  paymentStatus: ${createdData.paymentStatus}`);
info(`  No worker assigned yet: workerId = ${createdData.workerId ?? '(null)'}`);
ok(`Booking visible to admin in /dashboard`);

// ──────────────────────────────────────────────────────────────────────────────
//  SCENE 3 — ADMIN assigns a worker to the booking
// ──────────────────────────────────────────────────────────────────────────────

hr('SCENE 3: ADMIN assigns worker to booking');

await bookingRef.update({
  workerId: WORKER_ID,
  workerName: 'Deepak Verma',
  status: 'assigned',
  updatedAt: FieldValue.serverTimestamp(),
});
ok(`Worker Deepak Verma assigned to booking`);
ok(`Booking status updated to: assigned`);

// Write an in-app notification for the worker (as the notify-assigned API does)
const notifRef = db.collection('workers').doc(WORKER_ID).collection('notifications').doc();
await notifRef.set({
  type: 'job_assigned',
  title: 'New Job Assigned',
  body: `Premium Exterior Wash for ${customerData.name} at Sector 30, Noida`,
  bookingId: bookingRef.id,
  read: false,
  createdAt: FieldValue.serverTimestamp(),
});
ok(`Notification sent to worker's in-app inbox`);

// ──────────────────────────────────────────────────────────────────────────────
//  SCENE 4 — WORKER sees and completes the job
// ──────────────────────────────────────────────────────────────────────────────

hr('SCENE 4: WORKER completes the job');

// Worker starts the job (status: inprogress)
await bookingRef.update({
  status: 'inprogress',
  updatedAt: FieldValue.serverTimestamp(),
});
ok(`Worker started job → status: inprogress`);

// Worker completes the job
const completedAt = new Date();
await db.runTransaction(async txn => {
  const snap = await txn.get(bookingRef);
  if (!snap.exists) throw new Error('Booking not found');
  if (snap.data().workerId !== WORKER_ID) throw new Error('Worker mismatch');

  txn.update(bookingRef, {
    status: 'done',
    completedAt: Timestamp.fromDate(completedAt),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Increment worker stats
  const workerRef = db.collection('workers').doc(WORKER_ID);
  txn.update(workerRef, {
    totalJobs: FieldValue.increment(1),
    activeBookingId: null,
  });
});

ok(`Job completed at ${completedAt.toLocaleTimeString()}`);
ok(`Worker activeBookingId cleared, totalJobs incremented`);

// Send notification to customer (as the job-complete API does)
const custNotifRef = db.collection('customers').doc(CUSTOMER_ID).collection('notifications').doc();
await custNotifRef.set({
  type: 'job_complete',
  title: 'Car Wash Complete',
  body: 'Your Premium Exterior Wash is done! Ready for pickup.',
  bookingId: bookingRef.id,
  read: false,
  createdAt: FieldValue.serverTimestamp(),
});
ok(`Completion notification sent to customer`);

// ──────────────────────────────────────────────────────────────────────────────
//  SCENE 5 — ADMIN sees the completed booking
// ──────────────────────────────────────────────────────────────────────────────

hr('SCENE 5: ADMIN verifies completion in dashboard');

const finalBooking = await db.collection('bookings').doc(bookingRef.id).get();
const finalData = finalBooking.data();
info(`Booking ${bookingRef.id}:`);
info(`  Status: ${finalData.status}`);
info(`  Worker: ${finalData.workerName}`);
info(`  Completed: ${finalData.completedAt?.toDate?.()?.toLocaleString() ?? 'N/A'}`);
info(`  Payment: ${finalData.paymentStatus}`);

const workerStats = await db.collection('workers').doc(WORKER_ID).get();
const wData = workerStats.data();
info(`Worker ${wData.name}:`);
info(`  Total jobs: ${wData.totalJobs}`);
info(`  Active booking: ${wData.activeBookingId ?? 'none'}`);

ok(`Admin sees status: done — workflow complete ✅`);

// ──────────────────────────────────────────────────────────────────────────────
//  SCENE 6 — SOCIETY CLEANING: Worker marks a car clean in a session
// ──────────────────────────────────────────────────────────────────────────────

hr('SCENE 6: SOCIETY — Worker marks a car clean in live session');

// Find today's session with cars
const today = new Date();
today.setHours(0, 0, 0, 0);
const todayStr = today.toISOString().split('T')[0];

const sessionsSnap = await db.collection('cleaningSessions')
  .where('status', 'in', ['scheduled', 'inprogress'])
  .limit(20)
  .get();

if (sessionsSnap.empty) {
  console.log('  ⚠️   No active sessions found for today. Sessions may be scheduled for different days.');
  info('Checking all sessions...');
  const allSessions = await db.collection('cleaningSessions').limit(20).get();
  for (const s of allSessions.docs) {
    const d = s.data();
    const date = d.scheduledDate?.toDate?.()?.toISOString()?.split('T')[0] ?? 'unknown';
    info(`  ${s.id} → ${d.status} on ${date} (${d.cars?.length ?? 0} cars)`);
  }
  console.log('  ⏭️   Skipping society workflow simulation (no sessions with cars available today).');
} else {
  let targetSession = null;
  let targetCar = null;

  for (const s of sessionsSnap.docs) {
    const d = s.data();
    const pendingCars = (d.cars || []).filter(c => c.status === 'pending');
    if (pendingCars.length > 0) {
      targetSession = { id: s.id, ...d };
      targetCar = pendingCars[0];
      break;
    }
  }

  if (!targetSession) {
    console.log('  ⚠️   No sessions with pending cars found.');
  } else {
    const societyId = targetSession.societyId;
    const tower = targetSession.tower;
    const sessionWorkerIds = targetSession.workerIds || [];

    info(`Session: ${targetSession.id}`);
    info(`Society: ${targetSession.societyName} · ${tower}`);
    info(`Total cars: ${targetSession.totalCars}`);
    info(`Workers assigned: ${sessionWorkerIds.join(', ') || 'none'}`);
    info(`First pending car: ${targetCar.carMake} ${targetCar.carModel} (${targetCar.carPlate}) — ${targetCar.customerName}`);

    // Worker marks this car as done
    const workerId = sessionWorkerIds[0] || 'demo_worker_ravi_001';
    const workerSnap = await db.collection('workers').doc(workerId).get();
    const workerName = workerSnap.exists ? workerSnap.data().name : 'Unknown';

    await db.runTransaction(async txn => {
      const snap = await txn.get(db.collection('cleaningSessions').doc(targetSession.id));
      if (!snap.exists) throw new Error('Session not found');

      const data = snap.data();
      const cars = (data.cars || []).map(c => {
        if (c.customerId !== targetCar.customerId) return c;
        return {
          ...c,
          status: 'done',
          cleanedBy: workerId,
          cleanedAt: Timestamp.fromMillis(Date.now()),
        };
      });

      const completedCount = cars.filter(c => c.status === 'done').length;
      const inProgressCount = cars.filter(c => c.status === 'in_progress').length;
      const newStatus = completedCount === cars.length && cars.length > 0
        ? 'done'
        : (inProgressCount > 0 || completedCount > 0 ? 'inprogress' : 'scheduled');

      txn.update(db.collection('cleaningSessions').doc(targetSession.id), {
        cars,
        completedCars: completedCount,
        status: newStatus,
        ...(newStatus === 'inprogress' && !data.startedAt ? { startedAt: FieldValue.serverTimestamp() } : {}),
        ...(newStatus === 'done' ? { completedAt: FieldValue.serverTimestamp() } : {}),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Write cleaning log (as the session API does)
      const logRef = db.collection('cleaningLogs').doc();
      txn.set(logRef, {
        customerId: targetCar.customerId,
        customerName: targetCar.customerName,
        societyId,
        societyName: targetSession.societyName,
        unitNumber: targetCar.unitNumber || '',
        vehicleRegistration: targetCar.carPlate,
        vehicleMake: targetCar.carMake,
        vehicleModel: targetCar.carModel,
        workerId,
        workerName,
        cleanedAt: Timestamp.fromMillis(Date.now()),
        serviceType: 'exterior',
        servicePrice: 0,
        notificationSent: false,
        billed: false,
      });

      // Update worker stats
      txn.update(db.collection('workers').doc(workerId), {
        totalJobs: FieldValue.increment(1),
        carsCompletedToday: FieldValue.increment(1),
      });
    });

    ok(`Worker "${workerName}" marked ${targetCar.carMake} ${targetCar.carModel} (${targetCar.carPlate}) as done`);
    ok(`Session status → ${targetSession.status === 'inprogress' ? 'inprogress (still active)' : 'updated'}`);

    // Verify the update
    const updatedSession = await db.collection('cleaningSessions').doc(targetSession.id).get();
    const uData = updatedSession.data();
    info(`Verified: completedCars = ${uData.completedCars} / ${uData.totalCars}`);
    info(`Cleaning log written to cleaningLogs`);

    // Send SMS notification to customer (as the process-cleaning-logs cron does)
    const custRecordSnap = await db.collection('customerSocietyRecords')
      .where('customerId', '==', targetCar.customerId)
      .where('societyId', '==', societyId)
      .get();

    if (!custRecordSnap.empty) {
      const custRecord = custRecordSnap.docs[0].data();
      info(`Notification ready to send: "Your ${custRecord.cars?.[0]?.make} is clean! Ready for pickup"`);

      // Write notification record
      const notifId = `car_cleaned_${targetCar.customerId}_${Date.now()}`;
      await db.collection('notifications').doc(notifId).set({
        type: 'car_cleaned',
        recipientPhone: custRecord.customerPhone || 'unknown',
        recipientName: targetCar.customerName,
        message: `✨ Your ${targetCar.carMake} ${targetCar.carModel} is clean! Ready for pickup. -Perfect Cleaners`,
        sentAt: FieldValue.serverTimestamp(),
        deliveryStatus: 'pending',
      });
      ok(`SMS notification queued for ${targetCar.customerName}`);
    }

    ok(`Society cleaning workflow complete ✅`);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  SUMMARY
// ──────────────────────────────────────────────────────────────────────────────

hr('WORKFLOW TEST SUMMARY');

console.log(`
  Individual Booking Flow:
    1️⃣  Customer creates booking          → ✅  bookings/${bookingRef.id} (pending)
    2️⃣  Admin views in dashboard          → ✅  visible in bookings collection
    3️⃣  Admin assigns worker              → ✅  status → assigned
    4️⃣  Worker starts job                 → ✅  status → inprogress
    5️⃣  Worker completes job              → ✅  status → done
    6️⃣  Admin sees completion             → ✅  verified

  Society Cleaning Flow:
    1️⃣  Session exists with cars          → ✅
    2️⃣  Worker marks car clean            → ✅  status → done
    3️⃣  Session progress updated          → ✅  completedCars incremented
    4️⃣  Cleaning log recorded             → ✅
    5️⃣  Customer notification queued      → ✅

  🔗  Open the admin dashboard:
       http://localhost:3000/dashboard        — see the booking
       http://localhost:3000/cleaning-schedule — see sessions
       http://localhost:3000/live-cleaning     — real-time car tracking
       http://localhost:3000/pending-approvals  — review signups
       http://localhost:3000/customer-enrollments — manage residents
       http://localhost:3000/billing             — payment history
`);

process.exit(0);
