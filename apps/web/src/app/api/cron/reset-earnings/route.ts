import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

// Runs daily at 00:00 IST (18:30 UTC) via Vercel Cron.
// Resets earnings.today every day, earnings.week every Monday,
// earnings.month on the 1st. Mirrors the Cloud Function resetDailyEarnings.
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const db = adminFirestore();

  // IST is UTC+5:30 — when this cron fires at 18:30 UTC it is midnight IST
  const now            = new Date();
  const isMonday       = now.getUTCDay() === 1;   // Mon after midnight IST = Tue UTC at 18:30
  const isFirstOfMonth = (() => {
    // Check what day it is in IST
    const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    return ist.getUTCDate() === 1;
  })();

  const earningsFields: Record<string, number> = { today: 0 };
  if (isMonday)       earningsFields.week  = 0;
  if (isFirstOfMonth) earningsFields.month = 0;

  console.log('[reset-earnings] resetting stat carsCompletedToday and earnings:', Object.keys(earningsFields).join(', '));

  // Batch writes — Firestore caps at 500 ops per batch
  const CHUNK = 499;

  // Stat field lives on the worker doc itself (worker-readable).
  const workersSnap = await db.collection('workers').get();
  for (let i = 0; i < workersSnap.docs.length; i += CHUNK) {
    const batch = db.batch();
    workersSnap.docs.slice(i, i + CHUNK).forEach(d => batch.update(d.ref, { carsCompletedToday: 0 }));
    await batch.commit();
  }

  // Pay figures live in the separate admin-only workerEarnings collection.
  const earningsSnap = await db.collection('workerEarnings').get();
  for (let i = 0; i < earningsSnap.docs.length; i += CHUNK) {
    const batch = db.batch();
    earningsSnap.docs.slice(i, i + CHUNK).forEach(d => batch.update(d.ref, earningsFields));
    await batch.commit();
  }

  console.log(`[reset-earnings] done — ${workersSnap.docs.length} workers, ${earningsSnap.docs.length} earnings records reset`);
  return NextResponse.json({
    ok: true,
    workers: workersSnap.docs.length,
    earningsRecords: earningsSnap.docs.length,
    earningsFields: Object.keys(earningsFields),
  });
}
