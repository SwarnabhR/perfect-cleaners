import { readFileSync } from 'node:fs';
const raw = readFileSync('c:/Users/finst/Projects/perfect-cleaners/apps/web/.env.local', 'utf-8');
const ENV = {};
for (const line of raw.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i === -1) continue;
  ENV[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^"(.*)"$/, '$1');
}
const { initializeApp, cert, getApps } = await import('firebase-admin/app');
const { getFirestore, Timestamp } = await import('firebase-admin/firestore');
if (!getApps().length) {
  initializeApp({ credential: cert({
    projectId: ENV.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: ENV.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: ENV.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }) });
}
const db = getFirestore();

// Re-create an active enrollment directly (skip the approval-queue re-test — already verified) so Tower A has a real customer to populate cars[] from.
await db.collection('customerSocietyRecords').doc('e2e_verify_customer_001_demo_society_uniworld_001_Tower A').set({
  customerId: 'e2e_verify_customer_001',
  customerName: 'Verify Customer',
  customerPhone: '+919999900099',
  societyId: 'demo_society_uniworld_001',
  societyName: 'Uniworld City',
  tower: 'Tower A',
  cars: [{ plate: 'DL 09 VF 0099', make: 'Tata', model: 'Punch' }],
  preferredCleaningTime: 9,
  preferredCleaningDays: [],
  signupSource: 'bulk_import',
  status: 'active',
  monthlyFee: 500,
  nextBillingDate: Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000),
  paymentStatus: 'verified',
  skipDates: [],
  rescheduledSlots: [],
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
});
console.log('Seeded active enrollment for verification.');
process.exit(0);
