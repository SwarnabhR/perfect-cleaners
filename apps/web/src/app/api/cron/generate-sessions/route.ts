import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '@/lib/firebase/admin';
import { buildSessionCars, type SocietyCarSourceCustomer } from '@pc/firebase/src/societyCars';
import { computeSessionStartAt, resolveTowerStartMinutes } from '@pc/firebase/src/sessionTime';
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
    const configsByTower = new Map<string, Record<string, unknown>>();
    const configuredTowers = new Set<string>();
    societiesSnap.docs.forEach(doc => {
      const config = doc.data() as Record<string, unknown>;
      const key = towerKey(String(config.societyId ?? ''), String(config.tower ?? ''));
      configsByTower.set(key, config);
      configuredTowers.add(key);
    });
    let sessionsCreated = 0;
    let errors = 0;

    // Fetched once up front (not per society) so resolving a tower's default
    // worker roster below doesn't cost an extra read per worker per tower.
    const workerNamesById = new Map<string, string>();
    const workersSnap = await db.collection('workers').get();
    workersSnap.docs.forEach(d => workerNamesById.set(d.id, (d.data().name as string | undefined) ?? 'Worker'));

    // Customer-specific deep-clean enrollment can be enabled for a society
    // tower without society billing configuration. Include those active towers
    // as schedule sources, using the customer's selected day (and Monday as
    // the default wash day) until an operator configures a tower schedule.
    const activeRecords = await db.collection('customerSocietyRecords').where('status', '==', 'active').get();
    activeRecords.docs.forEach(doc => {
      const record = doc.data();
      const societyId = String(record.societyId ?? '');
      const tower = String(record.tower ?? '');
      if (!societyId || !tower) return;
      const key = towerKey(societyId, tower);
      if (!configsByTower.has(key)) {
        configsByTower.set(key, {
          societyId,
          tower,
          societyName: record.societyName ?? societyId,
          cleaningDays: Array.isArray(record.preferredCleaningDays) && record.preferredCleaningDays.length > 0
            ? record.preferredCleaningDays : [1],
          cleaningTimeMinutes: typeof record.preferredCleaningTime === 'number' ? record.preferredCleaningTime * 60 : 9 * 60,
        });
      }
    });

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

    for (const [towerKeyValue, config] of configsByTower) {
      try {
        const societyId = String(config.societyId ?? '');
        const tower = String(config.tower ?? '');
        const cleaningSchedule = config.cleaningSchedule as string | undefined;

        // Default worker(s) for this tower, set on the society doc via
        // societies-mgmt's "Tower worker assignments" panel — a session is
        // now born already assigned instead of always needing a manual
        // "Reassign" on the schedule page. Absent for un-configured
        // towers/societies, which fall back to [] exactly as before.
        const societySnap = await getSociety(societyId);
        const towerWorkerAssignments = societySnap.data()?.towerWorkerAssignments as Record<string, string[]> | undefined;
        const assignedWorkerIds = towerWorkerAssignments?.[tower] ?? [];
        const assignedWorkerNames = assignedWorkerIds.map(id => workerNamesById.get(id) ?? 'Worker');

        if (!configuredTowers.has(towerKeyValue)) {
          const weekdaySet = new Set<number>();
          activeRecords.docs.forEach(doc => {
            const record = doc.data();
            if (record.societyId !== societyId || record.tower !== tower) return;
            (Array.isArray(record.preferredCleaningDays) && record.preferredCleaningDays.length ? record.preferredCleaningDays : [1])
              .forEach((day: number) => weekdaySet.add(day));
          });
          config.cleaningDays = [...weekdaySet];
          config.cleaningTimeMinutes ??= 9 * 60;
        }

        const towerCleaningDays = config.cleaningDays;
        const weekdays: number[] = Array.isArray(towerCleaningDays) && towerCleaningDays.length > 0
          ? towerCleaningDays as number[]
          : parseWeekdaysFromSchedule(cleaningSchedule as string | undefined);

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

        const sourceCustomers = customersSnap.docs.map(d => ({ ...d.data(), id: d.id }) as SocietyCarSourceCustomer & { id: string });
        const deepDates = sourceCustomers.flatMap(customer => deepCleanDatesForCustomer(customer, windowStart, 14, weekdays));
        const allDatesByKey = new Map<string, Date>();
        [...cleaningDates, ...deepDates].forEach(date => allDatesByKey.set(date.toISOString().slice(0, 10), date));
        const candidates = [...allDatesByKey.values()].map(cleaningDate => ({
          sessionId: `${societyId}_${towerSlug}_${cleaningDate.toISOString().split('T')[0]}`,
          cleaningDate,
        }));
        const activeCandidates = candidates;

        if (activeCandidates.length > 0) {
          const refs = activeCandidates.map(c => db.collection('cleaningSessions').doc(c.sessionId));
          // select() with no fields fetches document *existence* without any
          // field data — the cars array on an existing session can be large
          // and is never looked at here.
          const existingSnaps = await db.getAll(...refs, { fieldMask: [] });

          // Resolved once per tower from the config already in hand. start-sessions
          // reads the stored startAt instead of re-deriving this on every run.
          const startMinutes = resolveTowerStartMinutes(config as { cleaningTimeMinutes?: number | null; cleaningSchedule?: string });

          const batch = db.batch();
          let queued = 0;

          activeCandidates.forEach((candidate, i) => {
            if (existingSnaps[i].exists) return;

            const washOwners = sourceCustomers.filter(owner => cleaningDates.some(date => sameDate(date, candidate.cleaningDate))
              && (!owner.preferredCleaningDays?.length || owner.preferredCleaningDays.includes(candidate.cleaningDate.getDay())));
            const washCars = buildSessionCars(washOwners, candidate.cleaningDate, 'wash');
            const deepCarsForDate = sourceCustomers
              .filter(owner => deepCleanDatesForCustomer(owner, candidate.cleaningDate, 1, weekdays).length > 0)
              .flatMap(owner => buildSessionCars([owner], candidate.cleaningDate, 'deep-clean'));
            const cars = [...washCars];
            for (const deepCar of deepCarsForDate) {
              const existing = cars.findIndex(wash => wash.customerId === deepCar.customerId && wash.carPlate === deepCar.carPlate);
              if (existing >= 0) {
                cars[existing] = {
                  ...cars[existing],
                  services: { ...(cars[existing].services ?? {}), deepClean: { status: deepCar.status === 'skipped' ? 'skipped' : 'pending' } },
                };
              } else {
                cars.push({ ...deepCar, services: { deepClean: { status: deepCar.status === 'skipped' ? 'skipped' : 'pending' } } });
              }
            }
            const skippedCars = cars.reduce((total, car) => total + Object.values(car.services ?? {}).filter(task => task.status === 'skipped').length, 0);
            const totalTasks = cars.reduce((total, car) => total + Object.values(car.services ?? {}).filter(task => task.status !== 'skipped').length, 0);
            if (cars.length === 0) return;

            batch.set(refs[i], {
              societyId,
              societyName:   config.societyName,
              tower,
              sessionType:   'wash',
              scheduledDate: candidate.cleaningDate,
              // The instant this session becomes due. start-sessions queries on
              // this directly — a session written without it would never be
              // picked up, since Firestore excludes docs missing an inequality
              // field from the result set entirely.
              startAt:       computeSessionStartAt(candidate.cleaningDate, startMinutes),
              status:        'scheduled',
              cars,
              // Denominator for the "done/total" progress ring is the actual work —
              // skipped cars are shown to the worker but can never be marked done.
              totalCars:     totalTasks,
              completedCars: 0,
              skippedCars,
              workerIds:     assignedWorkerIds,
              workerNames:   assignedWorkerNames,
              createdAt:     FieldValue.serverTimestamp(),
              updatedAt:     FieldValue.serverTimestamp(),
            });
            queued++;
          });

          // Stamped in the same batch as the session it refers to, so the
          // "generated exactly once ever" guarantee can't be broken by the
          // write landing while a later failure leaves the flag unset.
          if (queued > 0) {
            await batch.commit();
            sessionsCreated += queued;
          }
        }
      } catch (err: unknown) {
        console.error('[CRON] Tower processing error:', towerKeyValue, err instanceof Error ? err.message : String(err));
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

function towerKey(societyId: string, tower: string): string { return `${societyId}::${tower}`; }

function parseWeekdaysFromSchedule(scheduleStr: string | undefined): number[] {
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
    if (weekdays.includes(date.getDay())) dates.push(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
  }
  return dates;
}

function deepCleanDatesForCustomer(
  customer: SocietyCarSourceCustomer,
  startDate: Date,
  days: number,
  towerDays: number[],
): Date[] {
  if (customer.deepCleanEnabled !== true) return [];
  const frequency = customer.deepCleanFrequency ?? 'weekly';
  if (frequency === 'one-time') {
    const raw = customer.deepCleanOneTimeScheduledDate as { toDate?: () => Date } | Date | string | number | undefined;
    if (!raw) return [];
    const date = typeof (raw as { toDate?: () => Date }).toDate === 'function'
      ? (raw as { toDate: () => Date }).toDate()
      : new Date(raw as Date | string | number);
    if (Number.isNaN(date.getTime())) return [];
    const localMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startMidnight = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    return localMidnight >= startMidnight ? [localMidnight] : [];
  }
  if (frequency === 'daily') {
    const everyDay = Array.from({ length: days }, (_, i) => { const d = new Date(startDate); d.setDate(d.getDate() + i); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); });
    return everyDay.filter(d => towerDays.includes(d.getDay()));
  }
  const defaultDay = towerDays.slice().sort((a, b) => a - b)[0] ?? 1;
  return getCleaningDatesInWindow(startDate, days, [customer.deepCleanDay ?? defaultDay]);
}

function sameDate(value: unknown, date: Date): boolean {
  const raw = value as { toDate?: () => Date } | Date | string | number;
  const candidate = raw && typeof (raw as { toDate?: () => Date }).toDate === 'function'
    ? (raw as { toDate: () => Date }).toDate()
    : new Date(raw as Date | string | number);
  return candidate.getFullYear() === date.getFullYear()
    && candidate.getMonth() === date.getMonth()
    && candidate.getDate() === date.getDate();
}
