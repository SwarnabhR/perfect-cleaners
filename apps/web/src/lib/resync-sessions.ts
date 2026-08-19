import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from './firebase/admin';
import { buildSessionCarForCustomer, type SocietyCarSourceCustomer } from '@pc/firebase';

function tsToDate(v: unknown): Date {
  const val = v as { toDate?: () => Date } | Date | string | number | undefined;
  return val && typeof (val as { toDate?: () => Date }).toDate === 'function'
    ? (val as { toDate: () => Date }).toDate()
    : new Date(val as string | number | Date);
}

/**
 * Patches any already-created but not-yet-started ('scheduled') cleaningSessions
 * doc for this customer's tower so it reflects the customerSocietyRecords doc
 * identified by recordId — used from two places that can each leave the two
 * out of sync otherwise:
 *
 *   - /api/customer/unavailability — a skip/reschedule/permanentTime change
 *     made after that week's session already exists (generate-sessions only
 *     ever creates a session once, it never rebuilds one that already exists
 *     — see createSessionIfMissing).
 *   - /api/admin/resync-sessions — a customer going 'active' via admin
 *     approval, when their tower's rolling 2-week window is already fully
 *     generated (the normal steady state): createSessionIfMissing() only
 *     builds cars[] at creation time, so without this a newly-approved
 *     resident is invisible to every worker's live car list until the
 *     window naturally rolls forward to a not-yet-generated date.
 *
 * Both call sites pass the SAME recordId — the customer's own
 * customerSocietyRecords doc — so buildSessionCarForCustomer always resolves
 * against its current (post-write) fields.
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
        const idx  = cars.findIndex(c => c.customerId === recordSnap.data()!.customerId);

        const freshCar = buildSessionCarForCustomer(recordSnap.data() as SocietyCarSourceCustomer, scheduledDate);

        if (idx === -1) {
          // Not on this session at all yet (the admin-approval call site: the
          // session was generated before this customer went active). Add them
          // if the date is one they should actually be cleaned on.
          if (!freshCar) return;
          const updatedCars = [...cars, freshCar];
          const skippedCars = updatedCars.filter(c => c.status === 'skipped').length;
          t.update(sessionDoc.ref, {
            cars:       updatedCars,
            totalCars:  updatedCars.length - skippedCars,
            skippedCars,
            updatedAt:  FieldValue.serverTimestamp(),
          });
          return;
        }

        if (!freshCar) return; // preferredCleaningDays now excludes this date entirely — leave the existing entry alone

        const updatedCars = cars.slice();
        updatedCars[idx] = { ...cars[idx], status: freshCar.status, preferredTime: freshCar.preferredTime };
        const skippedCars = updatedCars.filter(c => c.status === 'skipped').length;

        t.update(sessionDoc.ref, {
          cars:       updatedCars,
          totalCars:  updatedCars.length - skippedCars,
          skippedCars,
          updatedAt:  FieldValue.serverTimestamp(),
        });
      });
    } catch (err: unknown) {
      // A resync failure must never block the caller's own write.
      console.warn(`[resyncUpcomingSessions] resync failed for session ${sessionDoc.id}:`, err instanceof Error ? err.message : err);
    }
  }
}
