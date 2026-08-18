const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const projectId   = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey  = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');

initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore();

(async () => {
  const allSnap = await db.collection('cleaningSessions').get();
  console.log('Total cleaningSessions docs:', allSnap.size);

  const byStatus = {};
  allSnap.docs.forEach(d => {
    const s = d.data().status;
    byStatus[s] = (byStatus[s] || 0) + 1;
  });
  console.log('By status:', JSON.stringify(byStatus, null, 2));

  const scheduledOrInprogress = allSnap.docs.filter(d => ['scheduled', 'inprogress'].includes(d.data().status));
  console.log('\nscheduled/inprogress count:', scheduledOrInprogress.length);
  scheduledOrInprogress.slice(0, 10).forEach(d => {
    const x = d.data();
    console.log(' ', d.id, x.status, x.societyName, x.tower, x.scheduledDate?.toDate?.()?.toISOString());
  });

  const billingSnap = await db.collection('societyBillingConfig').get();
  console.log('\nsocietyBillingConfig docs:', billingSnap.size);
  billingSnap.docs.forEach(d => console.log(' ', d.id));

  process.exit(0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
