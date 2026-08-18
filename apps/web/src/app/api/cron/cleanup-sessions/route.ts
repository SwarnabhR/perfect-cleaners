import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '@/lib/firebase/admin';
import { runMonitoredCron } from '@/lib/cron-monitor';

// Runs nightly at 00:30 IST (19:00 UTC) via cron-jobs.org.
// Auto-completes any CleaningSession that is still 'inprogress' from a
// previous calendar day — prevents the admin dashboard from filling with
// stale open sessions when workers forget to tap "complete".
export async function GET(req: NextRequest) {
  return runMonitoredCron(req, 'cleanup-sessions', async () => {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const db = adminFirestore();

    // Start of today in IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const todayIST  = new Date(now.getTime() + istOffset);
    todayIST.setUTCHours(0, 0, 0, 0);
    const todayISTStart = new Date(todayIST.getTime() - istOffset); // back to UTC

    // Fetch only inprogress sessions — no compound index needed.
    // Date filtering is done in memory (collection stays small).
    const snap = await db
      .collection('cleaningSessions')
      .where('status', 'in', ['scheduled', 'inprogress'])
      .get();

    const stale = snap.docs.filter(d => {
      const scheduled = d.data().scheduledDate?.toDate?.() as Date | undefined;
      return scheduled && scheduled < todayISTStart;
    });

    if (stale.length === 0) {
      return NextResponse.json({ ok: true, closed: 0 });
    }

    const CHUNK = 499;
    for (let i = 0; i < stale.length; i += CHUNK) {
      const batch = db.batch();
      stale.slice(i, i + CHUNK).forEach(d => {
        // Any car still pending/in_progress must be flipped to 'skipped'
        // here, same as the manual "complete" action does — otherwise it
        // stays 'pending' forever inside a session that's now 'done', which
        // makes it invisible everywhere (resolveWorkerTodoCars and the Live
        // Cleaning board both skip 'done' sessions entirely) without ever
        // having actually been cleaned or explicitly marked unavailable.
        const data = d.data();
        const cars = (data.cars as Record<string, unknown>[] | undefined) ?? [];
        const updatedCars = cars.map(c =>
          c.status === 'done' || c.status === 'skipped' ? c : { ...c, status: 'skipped' }
        );
        const skippedCars = updatedCars.filter(c => c.status === 'skipped').length;

        const wasScheduled = data.status === 'scheduled';
        batch.update(d.ref, {
          status:             wasScheduled ? 'missed' : 'done',
          cars:               updatedCars,
          skippedCars,
          ...(wasScheduled ? { missedAt: FieldValue.serverTimestamp(), missedReason: 'session_expired' } : { completedAt: FieldValue.serverTimestamp() }),
          autoClosedBySystem: true,
        });
      });
      await batch.commit();
    }

    console.log(`[cleanup-sessions] auto-closed ${stale.length} stale sessions`);
    return NextResponse.json({ ok: true, closed: stale.length });
  } catch (err: unknown) {
    console.error('[cleanup-sessions]', err);
    return NextResponse.json({ error: toErrMsg(err) }, { status: 500 });
  }
  });
}
