import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '@/lib/firebase/admin';
import { runMonitoredCron } from '@/lib/cron-monitor';

// Vercel's default function limit is well under what this used to need, and
// cron-jobs.org gives up at 30s. Both are now far more headroom than the job
// requires, but the limit is stated rather than inherited.
export const maxDuration = 60;

/** Promote today's scheduled sessions once their tower's configured cleaning
 * time arrives. Run this endpoint every five minutes. */
export async function GET(req: NextRequest) {
  return runMonitoredCron(req, 'start-sessions', async () => {
    const db = adminFirestore();
    const now = new Date();

    // Only sessions that could plausibly be due today. This previously read
    // EVERY scheduled session on every run and filtered in memory — at ~77
    // open scheduled docs and a run every 5 minutes that is ~22k Firestore
    // reads a day from this job alone, i.e. most of the 50k/day free-tier
    // allowance, and it grew with every society added.
    //
    // The window is deliberately ±36h rather than an exact IST midnight
    // boundary: generate-sessions writes scheduledDate as `new Date()` plus N
    // days, so it carries whatever time of day that run happened at, not
    // midnight. isDueToday below still does the exact IST comparison — this
    // range only has to be wide enough never to exclude a genuine match.
    const WINDOW_MS = 36 * 60 * 60 * 1000;
    const snap = await db.collection('cleaningSessions')
      .where('status', '==', 'scheduled')
      .where('scheduledDate', '>=', new Date(now.getTime() - WINDOW_MS))
      .where('scheduledDate', '<=', new Date(now.getTime() + WINDOW_MS))
      .get();
    let started = 0;

    // One billing-config read per society+tower per run, not per session.
    const startMinutesCache = new Map<string, number>();

    for (const session of snap.docs) {
      const data = session.data();
      const scheduled = data.scheduledDate?.toDate?.() as Date | undefined;
      if (!scheduled || !isDueToday(scheduled, now)) continue;

      const cacheKey = `${data.societyId}::${data.tower}`;
      let startMinutes = startMinutesCache.get(cacheKey);
      if (startMinutes === undefined) {
        const config = await db.collection('societyBillingConfig')
          .where('societyId', '==', data.societyId)
          .where('tower', '==', data.tower)
          .limit(1).get();
        const cfg = config.docs[0]?.data();
        // Structured field is authoritative; the display-string parse only
        // covers configs saved before cleaningTimeMinutes existed.
        const structured = cfg?.cleaningTimeMinutes;
        startMinutes = typeof structured === 'number'
          ? structured
          : parseStartMinutes(cfg?.cleaningSchedule as string | undefined) ?? 7 * 60;
        startMinutesCache.set(cacheKey, startMinutes);
      }
      if (minutesInIndia(now) < startMinutes) continue;

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

function isDueToday(scheduled: Date, now: Date): boolean {
  const istScheduled = new Date(scheduled.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  return istScheduled.getFullYear() === istNow.getFullYear()
    && istScheduled.getMonth() === istNow.getMonth()
    && istScheduled.getDate() === istNow.getDate();
}

function minutesInIndia(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(now);
  return Number(parts.find(p => p.type === 'hour')?.value ?? 0) * 60 + Number(parts.find(p => p.type === 'minute')?.value ?? 0);
}

function parseStartMinutes(schedule?: string): number | null {
  const match = schedule?.match(/(?:·|\|)\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i) ?? schedule?.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);
  const meridiem = match[3].toUpperCase();
  if (meridiem === 'AM' && hour === 12) hour = 0;
  if (meridiem === 'PM' && hour !== 12) hour += 12;
  return hour * 60 + minute;
}
