import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '@/lib/firebase/admin';
import { buildSessionCars, computeSessionStartAt, resolveTowerStartMinutes, type SocietyCarSourceCustomer } from '@pc/firebase';
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

        // One session per tower/date can contain both regular and deep-clean
        // checklist rows; this avoids ID collisions when a customer selects daily.
        const candidates = cleaningDates.map(cleaningDate => ({
          sessionId: `${societyId}_${towerSlug}_${cleaningDate.toISOString().split('T')[0]}`,
          cleaningDate,
        }));
        const sourceCustomers = customersSnap.docs.map(d => d.data() as SocietyCarSourceCustomer);
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

            const washCars = buildSessionCars(sourceCustomers, candidate.cleaningDate, 'wash');
            const deepCarsForDate = sourceCustomers
              .filter(owner => owner.deepCleanEnabled === true && (owner.deepCleanFrequency === 'daily'
                || owner.deepCleanFrequency === 'one-time' && owner.deepCleanOneTimeScheduledDate && sameDate(owner.deepCleanOneTimeScheduledDate, candidate.cleaningDate)
                || (owner.deepCleanFrequency ?? 'weekly') === 'weekly' && (owner.deepCleanDay ?? weekdays.slice().sort((a, b) => a - b)[0]) === candidate.cleaningDate.getDay()))
              .flatMap(owner => buildSessionCars([owner], candidate.cleaningDate, 'deep-clean'));
            const cars = [...washCars, ...deepCarsForDate.filter(deep => !washCars.some(wash => wash.customerId === deep.customerId && wash.carPlate === deep.carPlate))];
            const skippedCars = cars.filter(c => c.status === 'skipped').length;

            batch.set(refs[i], {
              societyId,
              societyName:   config.societyName,
              tower,
              sessionType:   deepCarsForDate.length ? 'deep-clean' : 'wash',
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
              totalCars:     cars.length - skippedCars,
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
        console.error('[CRON] Society processing error:', err instanceof Error ? err.message : String(err));
        errors++;
      }
    }

    // Customer subscriptions can request a weekly deep clean even when their
    // tower has no society-wide deep-clean configuration. Schedule each opted-in
    // record on its chosen weekday, using the normal society crew and slot.
    const optedInSnap = await db.collection('customerSocietyRecords')
      .where('status', '==', 'active')
      .get();
    for (const customerDoc of optedInSnap.docs) {
      const customer = customerDoc.data();
      if (customer.deepCleanEnabled !== true) continue;
      if (!customer.societyId || !customer.tower) continue;
      const key = `${customer.societyId}__${customer.tower}`;
      const towerConfigDoc = societiesSnap.docs.find(d => `${d.data().societyId}__${d.data().tower}` === key);
      const towerConfig = towerConfigDoc?.data();
      const frequency = customer.deepCleanFrequency ?? 'weekly';
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const windowStart = new Date(today); windowStart.setDate(windowStart.getDate() + 1);
      const defaultDay = Array.isArray(towerConfig?.cleaningDays) && towerConfig.cleaningDays.length
        ? [...towerConfig.cleaningDays].sort((a: number, b: number) => a - b)[0] : 1;
      const deepDay = typeof customer.deepCleanDay === 'number' ? customer.deepCleanDay : defaultDay;
      let dates = frequency === 'daily'
        ? Array.from({ length: 14 }, (_, i) => { const d = new Date(windowStart); d.setDate(d.getDate() + i); return d; })
        : getCleaningDatesInWindow(windowStart, 14, [deepDay]);
      if (frequency === 'daily' && Array.isArray(customer.preferredCleaningDays) && customer.preferredCleaningDays.length) {
        dates = dates.filter(d => customer.preferredCleaningDays.includes(d.getDay()));
      }
      if (frequency === 'one-time' && customer.deepCleanOneTimeScheduledDate) {
        const scheduled = customer.deepCleanOneTimeScheduledDate.toDate?.() ?? new Date(customer.deepCleanOneTimeScheduledDate);
        dates = scheduled >= windowStart ? [scheduled] : [];
      } else if (frequency === 'one-time') {
        dates = dates.slice(0, 1);
      }
      const societySnap = await getSociety(customer.societyId);
      const workerIds = (societySnap.data()?.towerWorkerAssignments as Record<string, string[]> | undefined)?.[customer.tower] ?? [];
      const workerNames = workerIds.map(id => workerNamesById.get(id) ?? 'Worker');
      const source = customer as SocietyCarSourceCustomer;
      const towerSlug = String(customer.tower).trim().replace(/\s+/g, '-');
      for (const date of dates) {
        const dateKey = date.toISOString().split('T')[0];
        const sessionId = `${customer.societyId}_${towerSlug}_${dateKey}`;
        const ref = db.collection('cleaningSessions').doc(sessionId);
        const startMinutes = towerConfig
          ? resolveTowerStartMinutes(towerConfig as { cleaningTimeMinutes?: number | null; cleaningSchedule?: string })
          : 540;
        const cars = buildSessionCars([source], date, 'deep-clean');
        if (cars.length === 0) continue;
        const dailyWashDate = frequency === 'daily' && Array.isArray(customer.preferredCleaningDays)
          && customer.preferredCleaningDays.includes(date.getDay());
        const towerWashDate = Array.isArray(towerConfig?.cleaningDays)
          ? towerConfig.cleaningDays.includes(date.getDay())
          : parseWeekdaysFromSchedule((towerConfig?.cleaningSchedule as string | undefined) ?? '').includes(date.getDay());
        if (dailyWashDate || towerWashDate) {
          const regularCars = buildSessionCars([source], date, 'wash');
          for (const regular of regularCars) {
            if (!cars.some(car => car.carPlate === regular.carPlate && car.customerId === regular.customerId)) cars.push(regular);
          }
        }
        try {
          let created = false;
          await db.runTransaction(async tx => {
            const existing = await tx.get(ref);
            if (existing.exists) {
              const data = existing.data()!;
              if (data.status !== 'scheduled') return;
              const current = (data.cars as Record<string, unknown>[] | undefined) ?? [];
              const otherCustomers = current.filter(car => car.customerId !== customer.customerId);
              const keepDone = current.filter(car => car.customerId === customer.customerId && (car.status === 'done' || car.status === 'in_progress'));
              const merged = [...otherCustomers, ...cars.filter(car => !keepDone.some(done => done.carPlate === car.carPlate)), ...keepDone];
              const skippedCars = merged.filter(car => car.status === 'skipped').length;
              tx.update(ref, { cars: merged, totalCars: merged.length - skippedCars, skippedCars, updatedAt: FieldValue.serverTimestamp() });
              return;
            }
            const skippedCars = cars.filter(car => car.status === 'skipped').length;
            tx.set(ref, {
              societyId: customer.societyId, societyName: customer.societyName ?? '', tower: customer.tower,
              sessionType: dailyWashDate || towerWashDate ? 'wash' : 'deep-clean', scheduledDate: date, startAt: computeSessionStartAt(date, startMinutes),
              status: 'scheduled', cars, totalCars: cars.length - skippedCars, completedCars: 0, skippedCars,
              workerIds, workerNames, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
            });
            created = true;
          });
          if (created) {
            sessionsCreated++;
          }
        } catch (err) {
          console.error('[CRON] Customer deep-clean session error:', customerDoc.id, err instanceof Error ? err.message : String(err));
          errors++;
        }
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

function sameDate(value: unknown, date: Date): boolean {
  const raw = value as { toDate?: () => Date } | Date | string | number;
  const candidate = raw && typeof (raw as { toDate?: () => Date }).toDate === 'function'
    ? (raw as { toDate: () => Date }).toDate()
    : new Date(raw as Date | string | number);
  return candidate.getFullYear() === date.getFullYear()
    && candidate.getMonth() === date.getMonth()
    && candidate.getDate() === date.getDate();
}
