import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const env = {};
for (const l of readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../.env.local'), 'utf-8').split('\n')) {
  const t = l.trim(); if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('='); env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^"(.*)"$/, '$1');
}
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
initializeApp({ credential: cert({ projectId: env.FIREBASE_ADMIN_PROJECT_ID, clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL, privateKey: env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\n/g, '\n') }) });
const db = getFirestore();
const DO_DELETE = process.argv.includes('--delete');
const FAKE_PHONE = /^\+?91(9811300\d\d|98765020\d\d)$/;
const COLS = ['customers','customerSocietyRecords','pendingApprovals','bookings','workers','societies','societyBillingConfig','cleaningSessions','cleaningLogs','paymentLogs','notifications'];
const isFake = (id, d) => /^(demo_|pay_demo|pay_society_|log_|approval_|enroll_)/.test(id)
  || /^admin_91(9811300\d\d)$/.test(id)
  || Object.entries(d).some(([k, v]) => typeof v === 'string' && (/^demo_(society|cust|worker|booking)_/.test(v) || (/phone/i.test(k) && FAKE_PHONE.test(v.replace(/\s/g, '')))));
const hits = [];
for (const c of COLS) {
  const snap = await db.collection(c).get();
  const mine = snap.docs.filter(d => isFake(d.id, d.data()));
  console.log(`${c}: ${mine.length} of ${snap.size}`);
  for (const d of mine) { hits.push(d.ref); if (!DO_DELETE && mine.length <= 40) console.log('   ', d.id, '|', d.data().customerName || d.data().name || d.data().societyName || ''); }
}
if (DO_DELETE) {
  for (const ref of hits) { await db.recursiveDelete(ref); }
  console.log('Deleted', hits.length, 'documents (with subcollections)');
}
process.exit(0);
