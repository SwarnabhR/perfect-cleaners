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

  const fields: Record<string, number> = { 'earnings.today': 0, 'carsCompletedToday': 0 };
  if (isMonday)       fields['earnings.week']  = 0;
  if (isFirstOfMonth) fields['earnings.month'] = 0;

  console.log('[reset-earnings] resetting:', Object.keys(fields).join(', '));

  const snap = await db.collection('workers').get();
  if (snap.empty) {
    console.log('[reset-earnings] no workers');
    return NextResponse.json({ ok: true, workers: 0 });
  }

  // Batch writes — Firestore caps at 500 ops per batch
  const CHUNK = 499;
  for (let i = 0; i < snap.docs.length; i += CHUNK) {
    const batch = db.batch();
    snap.docs.slice(i, i + CHUNK).forEach(d => batch.update(d.ref, fields));
    await batch.commit();
  }

  console.log(`[reset-earnings] done — ${snap.docs.length} workers reset`);
  return NextResponse.json({ ok: true, workers: snap.docs.length, fields: Object.keys(fields) });
}
