import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from './firebase/admin';
import { buildSessionCarsForCustomer, type SocietyCarSourceCustomer } from '@pc/firebase';
import { startOfIstDay } from '@pc/firebase';

function tsToDate(v: unknown): Date {
  const val = v as { toDate?: () => Date } | Date | string | number | undefined;
  return val && typeof (val as { toDate?: () => Date }).toDate === 'function'
    ? (val as { toDate: () => Date }).toDate()
    : new Date(val as string | number | Date);
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function countCars(cars: Record<string, unknown>[]) {
  const skippedCars = cars.reduce((count, car) => {
    const services = car.services as Record<string, { status?: string }> | undefined;
    return count + (services
      ? Object.values(services).filter(task => task.status === 'skipped').length
      : car.status === 'skipped' ? 1 : 0);
  }, 0);
  const totalCars = cars.reduce((count, car) => {
    const services = car.services as Record<string, { status?: string }> | undefined;
    return count + (services
      ? Object.values(services).filter(task => task.status !== 'skipped').length
      : car.status === 'skipped' ? 0 : 1);
  }, 0);
  const completedCars = cars.reduce((count, car) => {
    const services = car.services as Record<string, { status?: string }> | undefined;
    return count + (services
      ? Object.values(services).filter(task => task.status === 'done').length
      : car.status === 'done' ? 1 : 0);
  }, 0);
  return { totalCars, skippedCars, completedCars };
}

// Fields the worker sees on a session row — refreshed from the record on every
// resync so a changed flat number, parking slot, name or phone actually lands
// on the row rather than only status/time.
const MIRRORED_FIELDS = [
  'customerName', 'customerPhone', 'unitNumber', 'parkingNumber', 'parkingLevel',
  'carMake', 'carModel', 'vehicleCategory', 'status', 'preferredTime',
] as const;

/**
 * Patches any already-created but not-yet-started ('scheduled') cleaningSessions
 * doc for this customer's tower so it reflects the customerSocietyRecords doc
 * identified by recordId — used from the places that can each leave the two out
 * of sync otherwise:
 *
 *   - /api/customer/unavailability — a skip/reschedule/permanentTime change
 *     made after that week's session already exists (generate-sessions only
 *     ever creates a session once, it never rebuilds one that already exists
 *     — see createSessionIfMissing).
 *   - /api/admin/resync-sessions — a customer going 'active' via admin
 *     approval, or an admin editing a customer's address/vehicles on
 *     /customer-enrollments. createSessionIfMissing() only builds cars[] at
 *     creation time, so without this a newly-approved or newly-edited resident
 *     would stay invisible/stale on every worker's live list until the window
 *     naturally rolls forward.
 *
 * Reconciliation is a full diff for this customer's rows: missing vehicles are
 * added, changed address/vehicle fields are mirrored, and vehicles removed
 * from the record are dropped — but only rows no worker has touched
 * ('pending'/'skipped'); an 'in_progress'/'done' row is history and stays.
 */
export async function resyncUpcomingSessions(
  recordId: string,
  societyId: string,
  tower: string,
) {
  const db = adminFirestore();
  const startOfToday = startOfIstDay(new Date());
  const configSnap = await db.collection('societyBillingConfig')
    .where('societyId', '==', societyId).where('tower', '==', tower).limit(1).get();
  const configuredDays = configSnap.docs[0]?.data().cleaningDays as number[] | undefined;

  const allSessionsSnap = await db.collection('cleaningSessions')
    .where('societyId', '==', societyId)
    .where('status', '==', 'scheduled')
    .get();
  const sessions = allSessionsSnap.docs.filter(d => d.data().tower === tower);

  for (const sessionDoc of sessions) {
    const scheduledDate = tsToDate(sessionDoc.data().scheduledDate);
    if (startOfIstDay(scheduledDate) < startOfToday) continue;

    try {
      await db.runTransaction(async (t) => {
        const [sessionSnap, recordSnap] = await Promise.all([
          t.get(sessionDoc.ref),
          t.get(db.collection('customerSocietyRecords').doc(recordId)),
        ]);
        if (!sessionSnap.exists || !recordSnap.exists) return;
        const data = sessionSnap.data()!;
        if (data.status !== 'scheduled') return; // may have started since the initial query

        const cars = (data.cars as Record<string, unknown>[] | undefined) ?? [];
        const record = recordSnap.data() as SocietyCarSourceCustomer;
        const towerDays = configuredDays?.length ? configuredDays
          : record.preferredCleaningDays?.length ? record.preferredCleaningDays : [1, 3, 5];
        const isTowerWashDay = towerDays.includes(scheduledDate.getDay());
        const customerAllowsWashDay = !record.preferredCleaningDays?.length || record.preferredCleaningDays.includes(scheduledDate.getDay());
        // A customer can have more than one vehicle (car + two-wheeler) —
        // each gets its own session entry, matched by plate since customerId
        // alone no longer uniquely identifies a row.
        const frequency = (record as SocietyCarSourceCustomer & { deepCleanFrequency?: string }).deepCleanFrequency ?? 'weekly';
        const oneTimeDate = (record as SocietyCarSourceCustomer & { deepCleanOneTimeScheduledDate?: unknown }).deepCleanOneTimeScheduledDate;
        const oneTimeMatches = oneTimeDate ? isSameCalendarDay(tsToDate(oneTimeDate), scheduledDate) : false;
        const dateMatchesDeepPlan = record.deepCleanEnabled === true && (frequency === 'one-time'
          ? oneTimeMatches
          : frequency === 'daily'
            ? towerDays.includes(scheduledDate.getDay())
            : typeof record.deepCleanDay !== 'number' || record.deepCleanDay === scheduledDate.getDay());
        const legacyDeepOnly = data.sessionType === 'deep-clean' && !cars.some(car => car.services);
        const freshWashCars: Array<Record<string, unknown> & { customerId: string; carPlate: string; services?: Record<string, { status: string }> }> = legacyDeepOnly || !isTowerWashDay || !customerAllowsWashDay ? [] : buildSessionCarsForCustomer(record, scheduledDate)
          .map(car => ({ ...car, services: { wash: { status: car.status === 'skipped' ? 'skipped' as const : 'pending' as const } } }));
        const deepPlanActive = record.deepCleanEnabled === true && dateMatchesDeepPlan;
        const freshDeepCars: Array<Record<string, unknown> & { customerId: string; carPlate: string; services?: Record<string, { status: string }> }> = deepPlanActive
          ? buildSessionCarsForCustomer({ ...record, preferredCleaningDays: undefined, deepCleanEnabled: true }, scheduledDate, 'deep-clean')
            .map(car => ({ ...car, services: { deepClean: { status: car.status === 'skipped' ? 'skipped' as const : 'pending' as const } } }))
          : [];
        const freshCars: Array<Record<string, unknown> & { customerId: string; carPlate: string; services?: Record<string, { status: string }> }> = [...freshWashCars];
        for (const deep of freshDeepCars) {
          const existing = freshCars.findIndex(wash => wash.customerId === deep.customerId && wash.carPlate === deep.carPlate);
          if (existing < 0) freshCars.push(deep);
          else freshCars[existing] = { ...freshCars[existing], services: { ...freshCars[existing].services, ...(deep.services?.deepClean ? { deepClean: deep.services.deepClean } : {}) } };
        }
        const freshPlates = new Set(freshCars.map(f => f.carPlate));

        let updatedCars = cars;
        let changed = false;

        // Drop this customer's rows whose vehicle is gone from the record —
        // never remove one a worker has already started or finished.
        const reconciledCars: Record<string, unknown>[] = [];
        for (const current of updatedCars) {
          if (current.customerId !== record.customerId) {
            reconciledCars.push(current);
            continue;
          }
          const desired = freshCars.find(fresh => fresh.carPlate === current.carPlate);
          if (!desired) {
            const services = current.services as Record<string, { status?: string }> | undefined;
            if (!services) {
              if (current.status === 'pending' || current.status === 'skipped') { changed = true; continue; }
              reconciledCars.push(current);
              continue;
            }
            const preserved = Object.fromEntries(Object.entries(services).filter(([, task]) => task.status === 'done' || task.status === 'in_progress' || task.status === 'skipped'));
            if (Object.keys(preserved).length === 0) { changed = true; continue; }
            reconciledCars.push({ ...current, services: preserved });
            if (JSON.stringify(preserved) !== JSON.stringify(services)) changed = true;
            continue;
          }
          reconciledCars.push(current);
        }
        updatedCars = reconciledCars;

        for (const fresh of freshCars) {
          const idx = updatedCars.findIndex(c => c.customerId === fresh.customerId && c.carPlate === fresh.carPlate);
          if (idx === -1) {
            // Not on this session at all yet — the admin-approval call site
            // (session generated before this customer went active), or a
            // vehicle added to the record after the session already existed.
            updatedCars = [...updatedCars, fresh as unknown as Record<string, unknown>];
            changed = true;
            continue;
          }
          const cur = updatedCars[idx];
          const next: Record<string, unknown> = { ...cur };
          for (const f of MIRRORED_FIELDS) next[f] = fresh[f];
          const currentServices = (cur.services as Record<string, { status?: string; cleanedBy?: string; cleanedAt?: unknown }> | undefined) ?? {};
          const desiredServices = (fresh.services as Record<string, { status?: string }> | undefined) ?? {};
          const mergedServices: Record<string, { status?: string; cleanedBy?: string; cleanedAt?: unknown }> = {};
          for (const key of ['wash', 'deepClean'] as const) {
            const current = currentServices[key];
            const desired = desiredServices[key];
            if (desired) mergedServices[key] = current?.status === 'done'
              ? current
              : { ...desired, ...(current?.status === 'in_progress' ? current : {}) };
            else if (current?.status === 'done' || current?.status === 'in_progress' || current?.status === 'skipped') mergedServices[key] = current;
          }
          if (Object.keys(mergedServices).length) next.services = mergedServices;
          const rowChanged = MIRRORED_FIELDS.some(f => cur[f] !== next[f]) || JSON.stringify(cur.services ?? {}) !== JSON.stringify(next.services ?? {});
          if (rowChanged) {
            updatedCars = updatedCars.map((c, i) => (i === idx ? next : c));
            changed = true;
          }
        }
        if (!changed) return; // preferredCleaningDays now excludes this date entirely, or nothing moved — leave the existing entries alone

        t.update(sessionDoc.ref, {
          cars:      updatedCars,
          ...countCars(updatedCars),
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
    } catch (err: unknown) {
      // A resync failure must never block the caller's own write.
      console.warn(`[resyncUpcomingSessions] resync failed for session ${sessionDoc.id}:`, err instanceof Error ? err.message : err);
    }
  }
}

/**
 * Strips a customer's rows from the future 'scheduled' sessions of a tower they
 * no longer belong to — the destination resync in resyncUpcomingSessions only
 * touches the tower the record now lives at, so a customer moved to another
 * tower/society would otherwise keep showing up (as a stale, still-pending row)
 * on the origin tower's list until that window rolls over. Same safe-removal
 * rule as the reconcile above: only 'pending'/'skipped' rows go.
 */
export async function removeCustomerFromScheduledSessions(
  customerId: string,
  societyId: string,
  tower: string,
): Promise<void> {
  if (!customerId) return;
  const db = adminFirestore();
  const startOfToday = startOfIstDay(new Date());

  const sessionsSnap = await db.collection('cleaningSessions')
    .where('societyId', '==', societyId)
    .where('tower', '==', tower)
    .where('status', '==', 'scheduled')
    .get();

  for (const sessionDoc of sessionsSnap.docs) {
    const scheduledDate = tsToDate(sessionDoc.data().scheduledDate);
    if (startOfIstDay(scheduledDate) < startOfToday) continue;

    try {
      await db.runTransaction(async (t) => {
        const sessionSnap = await t.get(sessionDoc.ref);
        if (!sessionSnap.exists) return;
        const data = sessionSnap.data()!;
        if (data.status !== 'scheduled') return;

        const cars = (data.cars as Record<string, unknown>[] | undefined) ?? [];
        const kept = cars.filter(c =>
          c.customerId !== customerId
          || (c.status !== 'pending' && c.status !== 'skipped'));
        if (kept.length === cars.length) return;

        t.update(sessionDoc.ref, {
          cars:      kept,
          ...countCars(kept),
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
    } catch (err: unknown) {
      console.warn(`[removeCustomerFromScheduledSessions] failed for session ${sessionDoc.id}:`, err instanceof Error ? err.message : err);
    }
  }
}
