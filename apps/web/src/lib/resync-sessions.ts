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
 * customerSocietyRecords doc — so buildSessionCarsForCustomer always resolves
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
        // A customer can have more than one vehicle (car + two-wheeler) —
        // each gets its own session entry, matched by plate since customerId
        // alone no longer uniquely identifies a row.
        const freshCars = buildSessionCarsForCustomer(recordSnap.data() as SocietyCarSourceCustomer, scheduledDate);

        let updatedCars = cars;
        let changed = false;
        for (const fresh of freshCars) {
          const idx = updatedCars.findIndex(c => c.customerId === fresh.customerId && c.carPlate === fresh.carPlate);
          if (idx === -1) {
            // Not on this session at all yet — either the admin-approval call
            // site (session generated before this customer went active), or a
            // vehicle added to the record after the session already existed.
            updatedCars = [...updatedCars, fresh as unknown as Record<string, unknown>];
            changed = true;
          } else if (updatedCars[idx].status !== fresh.status || updatedCars[idx].preferredTime !== fresh.preferredTime) {
            updatedCars = updatedCars.map((c, i) => (i === idx ? { ...c, status: fresh.status, preferredTime: fresh.preferredTime } : c));
            changed = true;
          }
        }
        if (!changed) return; // preferredCleaningDays now excludes this date entirely, or nothing moved — leave the existing entries alone

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
