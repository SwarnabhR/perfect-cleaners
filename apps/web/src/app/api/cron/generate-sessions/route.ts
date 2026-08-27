import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '@/lib/firebase/admin';
import { buildSessionCars, type SocietyCarSourceCustomer } from '@pc/firebase';
import { runMonitoredCron } from '@/lib/cron-monitor';

// This job fans out over every tower and two weeks of dates. It now issues a
// handful of batched round trips instead of hundreds of sequential ones, but
// the ceiling is stated explicitly so a future society count can't quietly
// walk it back into cron-jobs.org's 30s cutoff.
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  return runMonitoredCron(req, 'generate-sessions', async () => {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const db = adminFirestore();
    console.log('[CRON] Generate sessions started at', new Date().toISOString());

    const societiesSnap = await db.collection('societyBillingConfig').get();
    let sessionsCreated = 0;
    let errors = 0;

    // Fetched once up front (not per society) so resolving a tower's default
    // worker roster below doesn't cost an extra read per worker per tower.
    const workerNamesById = new Map<string, string>();
    const workersSnap = await db.collection('workers').get();
    workersSnap.docs.forEach(d => workerNamesById.set(d.id, (d.data().name as string | undefined) ?? 'Worker'));

    // societyBillingConfig holds one doc per TOWER, so a society with four
    // towers used to re-read its societies/{id} doc four times. Cache by
    // societyId — the towerWorkerAssignments map it carries is per-society.
    const societyCache = new Map<string, FirebaseFirestore.DocumentSnapshot>();
    async function getSociety(societyId: string) {
      const hit = societyCache.get(societyId);
      if (hit) return hit;
      const snap = await db.collection('societies').doc(societyId).get();
      societyCache.set(societyId, snap);
      return snap;
    }

    for (const societyDoc of societiesSnap.docs) {
      try {
        const config = societyDoc.data();
        const { societyId, tower, cleaningSchedule, cleaningDays } = config;

        // Default worker(s) for this tower, set on the society doc via
        // societies-mgmt's "Tower worker assignments" panel — a session is
        // now born already assigned instead of always needing a manual
        // "Reassign" on the schedule page. Absent for un-configured
        // towers/societies, which fall back to [] exactly as before.
        const societySnap = await getSociety(societyId);
        const towerWorkerAssignments = societySnap.data()?.towerWorkerAssignments as Record<string, string[]> | undefined;
        const assignedWorkerIds = towerWorkerAssignments?.[tower] ?? [];
        const assignedWorkerNames = assignedWorkerIds.map(id => workerNamesById.get(id) ?? 'Worker');

        const weekdays: number[] = Array.isArray(cleaningDays) && cleaningDays.length > 0
          ? cleaningDays
          : parseWeekdaysFromSchedule(cleaningSchedule as string);

        const customersSnap = await db
          .collection('customerSocietyRecords')
          .where('societyId', '==', societyId)
          .where('tower', '==', tower)
          .where('status', '==', 'active')
          .get();

        // Rolling two-week horizon starting tomorrow (never today — a session
        // born mid-morning would auto-start at the next start-sessions tick,
        // surprising a crew that has already left; same-day gaps are what
        // scripts/generate-today-session.mjs is for). Creation is idempotent
        // (deterministic doc IDs + exists check), so runs overlap harmlessly
        // and a missed weekly run still leaves the following week fully
        // covered by the previous run's horizon.
        const windowStart = new Date();
        windowStart.setDate(windowStart.getDate() + 1);

        const cleaningDates = getCleaningDatesInWindow(windowStart, 14, weekdays);

        // Doc IDs become URL path segments (worker links to /session/<id>) — a raw
        // space in the tower name survives as literal "%20" through Next.js's
        // dynamic route params instead of being decoded back, which 404s. Slug it.
        const towerSlug = String(tower).trim().replace(/\s+/g, '-');

        // Deep-clean add-on — an extra, separately-scheduled session type layered
        // on top of the regular wash below. The tower config only stores a
        // frequency label, not a specific weekday, so:
        //   'daily'    -> every day the crew is already there (same as wash days)
        //   'weekly'   -> the earliest wash weekday (e.g. Mon/Wed/Fri tower -> Monday)
        //   'one-time' -> the next wash-day occurrence, generated exactly once ever
        const deepClean = config.deepClean as { frequency?: 'weekly' | 'daily' | 'one-time'; fee?: number; oneTimeGeneratedAt?: unknown } | undefined;
        let deepCleaningDates: Date[] = [];
        if (deepClean?.frequency === 'daily') {
          deepCleaningDates = cleaningDates;
        } else if (deepClean?.frequency === 'weekly') {
          const earliestWeekday = [...weekdays].sort((a, b) => a - b)[0];
          deepCleaningDates = cleaningDates.filter(d => d.getDay() === earliestWeekday);
        } else if (deepClean?.frequency === 'one-time' && !deepClean.oneTimeGeneratedAt && cleaningDates.length > 0) {
          deepCleaningDates = [cleaningDates[0]];
        }

        // Every candidate for this tower, wash and deep-clean together, so the
        // existence check and the writes each cost ONE round trip instead of
        // one per date. Previously this was a sequential get()+set() per date
        // per tower — roughly 270 serial round trips across all towers, which
        // is what pushed the job past cron-jobs.org's 30s limit.
        const candidates: { sessionId: string; cleaningDate: Date; sessionType: 'wash' | 'deep-clean' }[] = [
          ...cleaningDates.map(cleaningDate => ({
            sessionId: `${societyId}_${towerSlug}_${cleaningDate.toISOString().split('T')[0]}`,
            cleaningDate,
            sessionType: 'wash' as const,
          })),
          ...deepCleaningDates.map(cleaningDate => ({
            sessionId: `${societyId}_${towerSlug}_${cleaningDate.toISOString().split('T')[0]}_deep`,
            cleaningDate,
            sessionType: 'deep-clean' as const,
          })),
        ];

        if (candidates.length > 0) {
          const refs = candidates.map(c => db.collection('cleaningSessions').doc(c.sessionId));
          // select() with no fields fetches document *existence* without any
          // field data — the cars array on an existing session can be large
          // and is never looked at here.
          const existingSnaps = await db.getAll(...refs, { fieldMask: [] });
          const sourceCustomers = customersSnap.docs.map(d => d.data() as SocietyCarSourceCustomer);

          const batch = db.batch();
          let queued = 0;
          let createdDeepClean = false;

          candidates.forEach((candidate, i) => {
            if (existingSnaps[i].exists) return;

            const cars = buildSessionCars(sourceCustomers, candidate.cleaningDate);
            const skippedCars = cars.filter(c => c.status === 'skipped').length;

            batch.set(refs[i], {
              societyId,
              societyName:   config.societyName,
              tower,
              sessionType:   candidate.sessionType,
              scheduledDate: candidate.cleaningDate,
              status:        'scheduled',
              cars,
              // Denominator for the "done/total" progress ring is the actual work —
              // skipped cars are shown to the worker but can never be marked done.
              totalCars:     cars.length - skippedCars,
              completedCars: 0,
              skippedCars,
              workerIds:     assignedWorkerIds,
              workerNames:   assignedWorkerNames,
              createdAt:     FieldValue.serverTimestamp(),
              updatedAt:     FieldValue.serverTimestamp(),
            });
            queued++;
            if (candidate.sessionType === 'deep-clean') createdDeepClean = true;
          });

          // Stamped in the same batch as the session it refers to, so the
          // "generated exactly once ever" guarantee can't be broken by the
          // write landing while a later failure leaves the flag unset.
          if (createdDeepClean && deepClean?.frequency === 'one-time') {
            batch.update(societyDoc.ref, { 'deepClean.oneTimeGeneratedAt': FieldValue.serverTimestamp() });
          }

          if (queued > 0) {
            await batch.commit();
            sessionsCreated += queued;
          }
        }
      } catch (err: unknown) {
        console.error('[CRON] Society processing error:', err instanceof Error ? err.message : String(err));
        errors++;
      }
    }

    console.log('[CRON] Generate sessions completed. Created:', sessionsCreated, 'Errors:', errors);
    return NextResponse.json({
      success: true,
      message: 'Cleaning sessions generated',
      sessionsCreated,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('[CRON] Generate sessions failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: toErrMsg(err, 'Session generation failed') }, { status: 500 });
  }
  });
}

function parseWeekdaysFromSchedule(scheduleStr: string): number[] {
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const daysMatch = scheduleStr?.match(/^(.*?)\s*·/);
  const daysStr = daysMatch ? daysMatch[1] : (scheduleStr || 'Mon, Wed, Fri');
  return daysStr
    .split(',')
    .map(d => dayMap[d.trim()])
    .filter((d): d is number => d !== undefined);
}

function getCleaningDatesInWindow(startDate: Date, days: number, weekdays: number[]): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    if (weekdays.includes(date.getDay())) dates.push(new Date(date));
  }
  return dates;
}
