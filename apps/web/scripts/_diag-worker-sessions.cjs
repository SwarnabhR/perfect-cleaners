const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const projectId   = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey  = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');

initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore();

const WORKER_UID = 'PATSzQw8DuSAr5png6uu9Qjh6lL2';

(async () => {
  const snap = await db.collection('cleaningSessions')
    .where('workerIds', 'array-contains', WORKER_UID)
    .get();
  console.log('sessions for worker:', snap.size);
  snap.docs.forEach(d => {
    const x = d.data();
    console.log('---', d.id, x.status, x.scheduledDate?.toDate?.()?.toISOString(), x.tower);
    (x.cars || []).forEach(c => {
      console.log('  car:', JSON.stringify({
        customerId: c.customerId, status: c.status, unitNumber: c.unitNumber,
        carPlate: c.carPlate, customerPhone: c.customerPhone, customerName: c.customerName,
        preferredTime: c.preferredTime,
      }));
    });
  });
  process.exit(0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
