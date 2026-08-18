import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '@/lib/firebase/admin';
import { runMonitoredCron } from '@/lib/cron-monitor';

/** Promote today's scheduled sessions once their tower's configured cleaning
 * time arrives. Run this endpoint every five minutes. */
export async function GET(req: NextRequest) {
  return runMonitoredCron(req, 'start-sessions', async () => {
    const db = adminFirestore();
    const snap = await db.collection('cleaningSessions').where('status', '==', 'scheduled').get();
    const now = new Date();
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
