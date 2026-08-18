const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const projectId   = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey  = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');

initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore();

const COLLECTIONS = [
  'bookings', 'customers', 'workers', 'cleaningSessions', 'cleaningLogs',
  'paymentLogs', 'stats', 'otpVerifications', 'appWaitlist', 'contactInquiries',
  'support', 'societies', 'promotions', 'customerSocietyRecords',
  'pendingApprovals', 'societyBillingConfig', 'notifications', 'transactions',
  'billingRecords', 'admins',
];

(async () => {
  for (const col of COLLECTIONS) {
    const snap = await db.collection(col).limit(1).get();
    const countSnap = await db.collection(col).count().get();
    console.log(col.padEnd(24), snap.empty ? 'EMPTY' : `count~${countSnap.data().count}`);
  }
  process.exit(0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
