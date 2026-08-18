import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '@/lib/firebase/admin';
import { buildSessionCars, type SocietyCarSourceCustomer } from '@pc/firebase';
import { runMonitoredCron } from '@/lib/cron-monitor';

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

    for (const societyDoc of societiesSnap.docs) {
      try {
        const config = societyDoc.data();
        const { societyId, tower, cleaningSchedule, cleaningDays } = config;

        // Default worker(s) for this tower, set on the society doc via
        // societies-mgmt's "Tower worker assignments" panel — a session is
        // now born already assigned instead of always needing a manual
        // "Reassign" on the schedule page. Absent for un-configured
        // towers/societies, which fall back to [] exactly as before.
        const societySnap = await db.collection('societies').doc(societyId).get();
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

        async function createSessionIfMissing(sessionId: string, cleaningDate: Date, sessionType: 'wash' | 'deep-clean') {
          const existing = await db.collection('cleaningSessions').doc(sessionId).get();
          if (existing.exists) return false;

          const cars = buildSessionCars(customersSnap.docs.map(d => d.data() as SocietyCarSourceCustomer), cleaningDate);
          const skippedCars = cars.filter(c => c.status === 'skipped').length;

          await db.collection('cleaningSessions').doc(sessionId).set({
            societyId,
            societyName:   config.societyName,
            tower,
            sessionType,
            scheduledDate: cleaningDate,
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
          return true;
        }

        for (const cleaningDate of cleaningDates) {
          try {
            const sessionId = `${societyId}_${towerSlug}_${cleaningDate.toISOString().split('T')[0]}`;
            if (await createSessionIfMissing(sessionId, cleaningDate, 'wash')) sessionsCreated++;
          } catch (err: unknown) {
            console.error('[CRON] Session creation error:', err instanceof Error ? err.message : String(err));
            errors++;
          }
        }

        // Deep-clean add-on — an extra, separately-scheduled session type layered
        // on top of the regular wash above. The tower config only stores a
        // frequency label, not a specific weekday, so:
        //   'daily'    -> every day the crew is already there (same as wash days)
        //   'weekly'   -> the earliest wash weekday (e.g. Mon/Wed/Fri tower -> Monday)
        //   'one-time' -> the next wash-day occurrence, generated exactly once ever
        const deepClean = config.deepClean as { frequency?: 'weekly' | 'daily' | 'one-time'; fee?: number; oneTimeGeneratedAt?: unknown } | undefined;
        if (deepClean?.frequency) {
          try {
            let deepCleaningDates: Date[] = [];
            if (deepClean.frequency === 'daily') {
              deepCleaningDates = cleaningDates;
            } else if (deepClean.frequency === 'weekly') {
              const earliestWeekday = [...weekdays].sort((a, b) => a - b)[0];
              deepCleaningDates = cleaningDates.filter(d => d.getDay() === earliestWeekday);
            } else if (deepClean.frequency === 'one-time' && !deepClean.oneTimeGeneratedAt && cleaningDates.length > 0) {
              deepCleaningDates = [cleaningDates[0]];
            }

            for (const cleaningDate of deepCleaningDates) {
              const sessionId = `${societyId}_${towerSlug}_${cleaningDate.toISOString().split('T')[0]}_deep`;
              if (await createSessionIfMissing(sessionId, cleaningDate, 'deep-clean')) {
                sessionsCreated++;
                if (deepClean.frequency === 'one-time') {
                  await societyDoc.ref.update({ 'deepClean.oneTimeGeneratedAt': FieldValue.serverTimestamp() });
                }
              }
            }
          } catch (err: unknown) {
            console.error('[CRON] Deep-clean session creation error:', err instanceof Error ? err.message : String(err));
            errors++;
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
