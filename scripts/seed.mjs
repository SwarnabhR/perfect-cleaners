/**
 * Seed script — sets up test admin / worker / customer and prints curl test commands.
 *
 * Run from repo root:
 *   node scripts/seed.mjs
 *
 * Auth model (web app — all three use email + password):
 *   Admin    → email + password  (web admin dashboard)
 *   Worker   → email + password  (web worker job page)
 *   Customer → email + password  (web customer flows)
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);

// ── Parse apps/web/.env.local ──────────────────────────────────────────────
function loadEnv(filePath) {
  const env = {};
  for (const line of readFileSync(filePath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val   = trimmed.slice(idx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[key] = val;
  }
  return env;
}

const env = loadEnv(resolve(__dirname, '../apps/web/.env.local'));

// ── Firebase Admin ─────────────────────────────────────────────────────────
const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey:  env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const auth       = admin.auth();
const db         = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const API_KEY    = env.NEXT_PUBLIC_FIREBASE_API_KEY;

// ── Seed config ────────────────────────────────────────────────────────────
const ADMIN_USER = {
  email:    'workspace.swarnabh@gmail.com',
  phone:    '+917978718104',
  password: 'Admin@123',
  name:     'Swarnabh R',
};
const WORKER_USER = {
  email:    'worker.ravi@perfectcleaners.in',
  phone:    '+919888800001',
  password: 'Worker@123',
  name:     'Ravi Kumar',
};
const CUSTOMER_USER = {
  email:    'customer.rahul@perfectcleaners.in',
  phone:    '+919888800002',
  password: 'Customer@123',
  name:     'Rahul Sharma',
};

// ── Helpers ────────────────────────────────────────────────────────────────
async function clearCollection(col) {
  const snap = await db.collection(col).get();
  if (snap.empty) { console.log(`  ${col}: already empty`); return; }
  const batch = db.batch();
  snap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
  console.log(`  Cleared ${snap.size} doc(s) from /${col}`);
}

async function deleteAuthIfExists(identifier, byPhone = false) {
  try {
    const u = byPhone
      ? await auth.getUserByPhoneNumber(identifier)
      : await auth.getUserByEmail(identifier);
    await auth.deleteUser(u.uid);
    console.log(`  Removed auth user: ${identifier}`);
  } catch { /* not found */ }
}

// Admin: email + password auth
async function createAdminUser({ email, phone, password, name }) {
  await deleteAuthIfExists(email, false);
  await deleteAuthIfExists(phone, true);
  const u = await auth.createUser({ email, phoneNumber: phone, password, displayName: name, emailVerified: true });
  console.log(`  Created (email+password): ${name}  uid=${u.uid}`);
  return u.uid;
}

// ── Step 1 — clear Firestore ───────────────────────────────────────────────
console.log('\n── 1. Clearing Firestore collections ────────────────────────');
await clearCollection('admins');
await clearCollection('workers');
await clearCollection('customers');

// ── Step 2 — create users ──────────────────────────────────────────────────
console.log('\n── 2. Creating auth users + Firestore docs ──────────────────');

const adminUid = await createAdminUser(ADMIN_USER);
await db.collection('admins').doc(adminUid).set({
  name:      ADMIN_USER.name,
  email:     ADMIN_USER.email,
  phone:     ADMIN_USER.phone,
  role:      'superadmin',
  createdAt: FieldValue.serverTimestamp(),
});
console.log(`     admins/${adminUid}`);

const workerUid = await createAdminUser(WORKER_USER);
await db.collection('workers').doc(workerUid).set({
  id:        workerUid,
  name:      WORKER_USER.name,
  phone:     WORKER_USER.phone,
  isOnline:  true,
  rating:    4.8,
  totalJobs: 12,
  earnings:  { today: 0, week: 800, month: 4200 },
  createdAt: FieldValue.serverTimestamp(),
});
console.log(`     workers/${workerUid}`);

const customerUid = await createAdminUser(CUSTOMER_USER);
await db.collection('customers').doc(customerUid).set({
  id:        customerUid,
  name:      CUSTOMER_USER.name,
  phone:     CUSTOMER_USER.phone,
  email:     CUSTOMER_USER.email,
  vehicles:  [],
  createdAt: FieldValue.serverTimestamp(),
});
console.log(`     customers/${customerUid}`);

// ── Step 3 — seed a test booking ───────────────────────────────────────────
const bookingRef  = db.collection('bookings').doc();
const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
await bookingRef.set({
  id:             bookingRef.id,
  customerId:     customerUid,
  customerName:   CUSTOMER_USER.name,
  customerPhone:  CUSTOMER_USER.phone,
  workerId:       workerUid,
  workerName:     WORKER_USER.name,
  serviceIds:     ['exterior-wash'],
  vehicle:        { id: 'v1', make: 'Maruti', model: 'Swift', year: 2022, type: 'hatchback', registration: 'DL 01 AB 1234', color: 'White' },
  status:         'assigned',
  paymentStatus:  'pending',
  scheduledAt,
  address:        { line1: 'Sector 18, Noida', city: 'Noida', pincode: '201301', coordinates: { latitude: 28.57, longitude: 77.32 } },
  priceBreakdown: { subtotal: 500, tax: 90, total: 590 },
  photos:         { before: [], after: [] },
  bookingRef:     'PC-TEST01',
  createdAt:      FieldValue.serverTimestamp(),
  updatedAt:      FieldValue.serverTimestamp(),
});
console.log(`     bookings/${bookingRef.id}  (status: assigned, total: ₹590)`);

// ── Summary ────────────────────────────────────────────────────────────────
console.log('\n── 3. UIDs ──────────────────────────────────────────────────');
console.log(`  Admin    UID : ${adminUid}   phone: ${ADMIN_USER.phone}`);
console.log(`  Worker   UID : ${workerUid}   phone: ${WORKER_USER.phone}`);
console.log(`  Customer UID : ${customerUid}   phone: ${CUSTOMER_USER.phone}`);
console.log(`  Booking  ID  : ${bookingRef.id}`);

const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
console.log(`
── 4. Get ID tokens ─────────────────────────────────────────

  Admin (email+password):
    curl -s -X POST "${signInUrl}" \\
      -H "Content-Type: application/json" \\
      -d '{"email":"${ADMIN_USER.email}","password":"${ADMIN_USER.password}","returnSecureToken":true}'

  Worker (email+password):
    curl -s -X POST "${signInUrl}" \\
      -H "Content-Type: application/json" \\
      -d '{"email":"${WORKER_USER.email}","password":"${WORKER_USER.password}","returnSecureToken":true}'

  Customer (email+password):
    curl -s -X POST "${signInUrl}" \\
      -H "Content-Type: application/json" \\
      -d '{"email":"${CUSTOMER_USER.email}","password":"${CUSTOMER_USER.password}","returnSecureToken":true}'

── 5. Test API endpoints (with dev server running on :3000) ──

  # notify-assigned  — ADMIN token required
  curl -s -X POST http://localhost:3000/api/worker/notify-assigned \\
    -H "Content-Type: application/json" \\
    -H "Authorization: Bearer ADMIN_TOKEN" \\
    -d '{
      "bookingId":"${bookingRef.id}",
      "workerId":"${workerUid}",
      "workerName":"${WORKER_USER.name}",
      "serviceIds":["exterior-wash"],
      "customerName":"${CUSTOMER_USER.name}",
      "scheduledAt":"${scheduledAt.toISOString()}"
    }'

  # job-complete  — WORKER token required
  curl -s -X POST http://localhost:3000/api/worker/job-complete \\
    -H "Content-Type: application/json" \\
    -H "Authorization: Bearer WORKER_TOKEN" \\
    -d '{
      "bookingId":"${bookingRef.id}",
      "customerId":"${customerUid}",
      "total":590,
      "serviceIds":["exterior-wash"]
    }'

── 6. Admin web login ────────────────────────────────────────
  URL      : http://localhost:3000/login
  Username : ${ADMIN_USER.email}
  Password : ${ADMIN_USER.password}
`);

await admin.app().delete();
process.exit(0);
