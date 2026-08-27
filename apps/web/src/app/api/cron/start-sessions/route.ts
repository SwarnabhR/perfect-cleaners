import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '@/lib/firebase/admin';
import { runMonitoredCron } from '@/lib/cron-monitor';
import { startOfIstDay } from '@pc/firebase';

// Runs every 5 minutes but almost always matches nothing, so it finishes in
// well under a second. The limit is stated rather than inherited.
export const maxDuration = 60;

/** Promote scheduled sessions once their tower's configured cleaning time
 * arrives. Run this endpoint every five minutes. */
export async function GET(req: NextRequest) {
  return runMonitoredCron(req, 'start-sessions', async () => {
    const db = adminFirestore();

    // Sessions carry the instant they become due (startAt, written by
    // generate-sessions via computeSessionStartAt), so the whole decision is a
    // single indexed query that normally returns nothing.
    //
    // This used to read EVERY session with status == 'scheduled' — ~77 docs —
    // then re-derive each tower's start time from societyBillingConfig and
    // compare clock minutes in memory. At a run every 5 minutes that was ~22k
    // Firestore reads a day from this job alone, most of the 50k/day free-tier
    // allowance, and it grew with every session ever created.
    //
    // NOTE: Firestore excludes documents that lack the inequality field, so a
    // session written without startAt is invisible here and would never start.
    // scripts/backfill-session-start-at.mjs exists to close that gap for
    // sessions created before this field did.
    //
    // The lower bound is not an optimisation, it is the semantics: `startAt <=
    // now` alone stays true forever, so a session that was never started on its
    // day would get picked up and started days later. Only sessions due earlier
    // TODAY (IST) are startable; anything older is cleanup-sessions' business to
    // mark missed.
    const now = new Date();
    const snap = await db.collection('cleaningSessions')
      .where('status', '==', 'scheduled')
      .where('startAt', '>=', startOfIstDay(now))
      .where('startAt', '<=', now)
      .get();

    let started = 0;

    for (const session of snap.docs) {
      // Conditional promotion inside a transaction — an overlapping cron run
      // (or a worker tapping "start" at the same moment) re-reads the doc and
      // finds it already inprogress, so startedAt is only ever written once.
      const didStart = await db.runTransaction(async t => {
        const fresh = await t.get(session.ref);
        if (fresh.data()?.status !== 'scheduled') return false;
        t.update(session.ref, {
          status: 'inprogress',
          startedAt: FieldValue.serverTimestamp(),
          startedBySystem: true,
          updatedAt: FieldValue.serverTimestamp(),
        });
        return true;
      });
      if (didStart) started++;
    }

    return NextResponse.json({ success: true, started, inspected: snap.size, timestamp: new Date().toISOString() });
  });
}
