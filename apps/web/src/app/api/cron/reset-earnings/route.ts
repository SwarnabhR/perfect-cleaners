import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

// Runs daily at 00:00 IST (18:30 UTC) via cron-jobs.org.
// Resets carsCompletedToday on every worker doc. Kept at this URL (despite the
// stale "reset-earnings" name) because the external cron-jobs.org schedule
// already points at this path — renaming the route would silently break it.
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const db = adminFirestore();

  console.log('[reset-earnings] resetting carsCompletedToday for all workers');

  // Batch writes — Firestore caps at 500 ops per batch
  const CHUNK = 499;
  const workersSnap = await db.collection('workers').get();
  for (let i = 0; i < workersSnap.docs.length; i += CHUNK) {
    const batch = db.batch();
    workersSnap.docs.slice(i, i + CHUNK).forEach(d => batch.update(d.ref, { carsCompletedToday: 0 }));
    await batch.commit();
  }

  console.log(`[reset-earnings] done — ${workersSnap.docs.length} workers reset`);
  return NextResponse.json({ ok: true, workers: workersSnap.docs.length });
}
