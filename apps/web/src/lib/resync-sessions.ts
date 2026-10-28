import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from './firebase/admin';
import { buildSessionCarsForCustomer, type SocietyCarSourceCustomer } from '@pc/firebase';

function tsToDate(v: unknown): Date {
  const val = v as { toDate?: () => Date } | Date | string | number | undefined;
  return val && typeof (val as { toDate?: () => Date }).toDate === 'function'
    ? (val as { toDate: () => Date }).toDate()
    : new Date(val as string | number | Date);
}

function countCars(cars: Record<string, unknown>[]) {
  const skippedCars = cars.filter(c => c.status === 'skipped').length;
  return { totalCars: cars.length - skippedCars, skippedCars };
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
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const sessionsSnap = await db.collection('cleaningSessions')
    .where('societyId', '==', societyId)
    .where('tower', '==', tower)
    .where('status', '==', 'scheduled')
    .get();

  for (const sessionDoc of sessionsSnap.docs) {
    const scheduledDate = tsToDate(sessionDoc.data().scheduledDate);
    if (scheduledDate < startOfToday) continue;

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
        // A customer can have more than one vehicle (car + two-wheeler) —
        // each gets its own session entry, matched by plate since customerId
        // alone no longer uniquely identifies a row.
        const freshCars = data.sessionType === 'deep-clean' && record.deepCleanEnabled !== true
          ? []
          : buildSessionCarsForCustomer(record, scheduledDate);
        const freshPlates = new Set(freshCars.map(f => f.carPlate));

        let updatedCars = cars;
        let changed = false;

        // Drop this customer's rows whose vehicle is gone from the record —
        // never remove one a worker has already started or finished.
        const hasStale = updatedCars.some(c =>
          c.customerId === record.customerId
          && !freshPlates.has(c.carPlate as string)
          && (c.status === 'pending' || c.status === 'skipped'));
        if (hasStale) {
          updatedCars = updatedCars.filter(c =>
            c.customerId !== record.customerId
            || freshPlates.has(c.carPlate as string)
            || (c.status !== 'pending' && c.status !== 'skipped'));
          changed = true;
        }

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
          if (MIRRORED_FIELDS.some(f => cur[f] !== next[f])) {
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
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const sessionsSnap = await db.collection('cleaningSessions')
    .where('societyId', '==', societyId)
    .where('tower', '==', tower)
    .where('status', '==', 'scheduled')
    .get();

  for (const sessionDoc of sessionsSnap.docs) {
    const scheduledDate = tsToDate(sessionDoc.data().scheduledDate);
    if (scheduledDate < startOfToday) continue;

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
