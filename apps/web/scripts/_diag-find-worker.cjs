const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const projectId   = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey  = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');

initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore();

(async () => {
  const phoneVariants = ['+917978718104', '7978718104', '+91 7978718104', '917978718104'];
  for (const phone of phoneVariants) {
    const snap = await db.collection('workers').where('phone', '==', phone).get();
    if (!snap.empty) {
      snap.docs.forEach(d => console.log('MATCH', phone, '->', d.id, JSON.stringify(d.data())));
    } else {
      console.log('no match for', phone);
    }
  }

  const allSnap = await db.collection('workers').get();
  console.log('total workers:', allSnap.size);
  allSnap.docs.forEach(d => {
    const x = d.data();
    if ((x.name || '').toLowerCase().includes('swarnabh') || (x.phone || '').includes('7978718104')) {
      console.log('NAME/PHONE HIT', d.id, JSON.stringify(x));
    }
  });
  process.exit(0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
