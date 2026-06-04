import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminFirestore } from '@/lib/firebase/admin';

// Runs nightly at 00:30 IST (19:00 UTC) via Vercel Cron.
// Auto-completes any CleaningSession that is still 'inprogress' from a
// previous calendar day — prevents the admin dashboard from filling with
// stale open sessions when workers forget to tap "complete".
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const db = adminFirestore();

  // Sessions scheduled before the start of today (IST midnight = yesterday 18:30 UTC)
  const todayISTStart = new Date();
  todayISTStart.setUTCHours(18, 30, 0, 0); // 18:30 UTC = 00:00 IST
  // If it's before 18:30 UTC right now, "today IST" started yesterday at 18:30 UTC
  if (new Date() < todayISTStart) {
    todayISTStart.setUTCDate(todayISTStart.getUTCDate() - 1);
  }

  const snap = await db
    .collection('cleaningSessions')
    .where('status', '==', 'inprogress')
    .where('scheduledDate', '<', Timestamp.fromDate(todayISTStart))
    .get();

  if (snap.empty) {
    return NextResponse.json({ ok: true, closed: 0 });
  }

  const CHUNK = 499;
  for (let i = 0; i < snap.docs.length; i += CHUNK) {
    const batch = db.batch();
    snap.docs.slice(i, i + CHUNK).forEach(d =>
      batch.update(d.ref, {
        status:      'done',
        completedAt: FieldValue.serverTimestamp(),
        autoClosedBySystem: true,
      }),
    );
    await batch.commit();
  }

  console.log(`[cleanup-sessions] auto-closed ${snap.docs.length} stale sessions`);
  return NextResponse.json({ ok: true, closed: snap.docs.length });
}
