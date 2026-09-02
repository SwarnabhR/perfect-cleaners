import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore, adminAuth } from '@/lib/firebase/admin';
import { sendAndStoreSMS } from '@/lib/notify-sms';
import { startOfIstDay } from '@pc/firebase';

/**
 * Is this session scheduled for a calendar day that hasn't arrived yet?
 *
 * Workers report — correctly — that a future day's car must not be tickable:
 * a clean recorded against tomorrow makes the car read "done" when tomorrow
 * actually comes, so nobody cleans it. Today and any earlier missed day stay
 * completable (cleaning a missed car today is normal and expected).
 *
 * Compared in IST, not the server's UTC: this runs on Vercel, and a plain
 * local-day comparison would roll a day over at 5:30 AM India time — an hour
 * when workers are already on their round.
 */
function isFutureDay(scheduledDate: unknown): boolean {
  const d = (scheduledDate as { toDate?: () => Date } | undefined)?.toDate?.()
    ?? (scheduledDate instanceof Date ? scheduledDate : null);
  if (!d || Number.isNaN(d.getTime())) return false; // unreadable date: don't block work
  return startOfIstDay(d).getTime() > startOfIstDay(new Date()).getTime();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Session docs carry every resident's name/unit/parking/plate for the
    // tower — only the assigned worker(s) or an admin may read that.
    const bearer = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/, '');
    if (!bearer) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const decoded = await adminAuth().verifyIdToken(bearer);

    const db     = adminFirestore();
    const snap   = await db.collection('cleaningSessions').doc(id).get();

    if (!snap.exists) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    const data = snap.data()!;
    const workerIds = (data.workerIds as string[] | undefined) ?? [];
    const isAssignedWorker = workerIds.includes(decoded.uid);
    if (!isAssignedWorker) {
      const adminSnap = await db.collection('admins').doc(decoded.uid).get();
      if (!adminSnap.exists) {
        return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
      }
    }

    return NextResponse.json({
      id:            snap.id,
      societyId:     data.societyId,
      societyName:   data.societyName,
      sessionType:   data.sessionType ?? 'wash',
      tower:         data.tower ?? null,
      workerName:    (data.workerNames as string[] | undefined)?.join(', ') ?? data.workerName ?? '',
      scheduledDate: data.scheduledDate?.toDate?.()?.toISOString() ?? null,
      status:        data.status,
      totalCars:     data.totalCars,
      completedCars: data.completedCars,
      startedAt:     data.startedAt?.toDate?.()?.toISOString() ?? null,
      completedAt:   data.completedAt?.toDate?.()?.toISOString() ?? null,
      cars: (data.cars ?? []).map((c: Record<string, unknown>) => ({
        customerId:    c.customerId,
        customerName:  c.customerName ?? '',
        customerPhone: c.customerPhone ?? '',
        unitNumber:    c.unitNumber ?? '',
        parkingNumber: c.parkingNumber ?? '',
        parkingLevel:  c.parkingLevel ?? '',
        carPlate:      c.carPlate ?? '',
        carMake:       c.carMake ?? '',
        carModel:      c.carModel ?? '',
        preferredTime: c.preferredTime ?? null,
        status:        c.status ?? 'pending',
      })),
    });
  } catch (err: unknown) {
    console.error('[session/GET]', err);
    return NextResponse.json({ error: toErrMsg(err) }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Only authenticated workers may mutate session state
    const bearer = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/, '');
    if (!bearer) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const decoded  = await adminAuth().verifyIdToken(bearer);
    const workerId = decoded.uid;

    const db = adminFirestore();
    const workerSnap = await db.collection('workers').doc(workerId).get();
    if (!workerSnap.exists) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }
    const workerName = (workerSnap.data()?.name as string | undefined) ?? 'Worker';

    const ref = db.collection('cleaningSessions').doc(id);

    // A worker may only mutate sessions they were actually assigned to.
    // Same legacy-field fallback as the GET handler above.
    const sessionSnap = await ref.get();
    if (!sessionSnap.exists) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }
    const sessionData      = sessionSnap.data();
    const sessionWorkerIds = (sessionData?.workerIds as string[] | undefined) ?? [];
    const isAssignedWorker = sessionWorkerIds.includes(workerId);
    if (!isAssignedWorker) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const body   = await req.json();
    const action = body.action;

    if (action === 'clean_car') {
      const customerId = body.customerId as string | undefined;
      if (!customerId) {
        return NextResponse.json({ error: 'customerId is required.' }, { status: 400 });
      }

      let response: Record<string, unknown> | null = null;
      let notifyCar: { phone: string; name: string; plate: string; societyName: string; tower: string } | null = null;

      await db.runTransaction(async (t) => {
        const snap = await t.get(ref);
        if (!snap.exists) throw new Error('NOT_FOUND');
        const data = snap.data()!;

        const cars = (data.cars as Record<string, unknown>[] | undefined) ?? [];
        // A flat can own more than one vehicle (a car and a two-wheeler),
        // and every one of its rows carries the SAME customerId — the id is
        // per enrolled customer, not per vehicle. Matching on customerId
        // alone always returned the first row, so once the car was done the
        // scooter's row resolved to that already-done car and failed with
        // CAR_NOT_FOUND: the second vehicle could never be completed, and sat
        // overdue forever. Real cases: Angel Jupiter C-604, D-1102, D-1603.
        //
        // carPlate is the per-vehicle discriminator. It stays optional so an
        // older client (or one whose row has no plate on file) still works,
        // falling back to the first row that isn't already done rather than
        // simply the first row.
        const carPlate = typeof body.carPlate === 'string' ? body.carPlate.trim() : '';
        const samePlate = (c: Record<string, unknown>) =>
          typeof c.carPlate === 'string' && c.carPlate.trim() === carPlate;
        const idx = carPlate
          ? cars.findIndex(c => c.customerId === customerId && samePlate(c))
          : cars.findIndex(c => c.customerId === customerId && c.status !== 'done');
        if (idx === -1 || cars[idx].status === 'done') throw new Error('CAR_NOT_FOUND');
        // Marked "not available today" — by a worker on the ground or an
        // admin on the Live Cleaning board. Same as a customer's own
        // skipDate, it can't be completed.
        if (cars[idx].unavailable) throw new Error('CAR_UNAVAILABLE');
        // Tomorrow's round is not today's work — see isFutureDay.
        if (isFutureDay(data.scheduledDate)) throw new Error('CAR_NOT_DUE_YET');

        const now         = new Date();
        const updatedCars = cars.slice();
        // Arrays can't hold FieldValue.serverTimestamp() (Firestore restriction) —
        // a plain Date computed at execution time is the accepted workaround.
        updatedCars[idx]  = { ...updatedCars[idx], status: 'done', cleanedBy: workerId, cleanedAt: now };

        const totalCars     = (data.totalCars as number | undefined) ?? cars.length;
        const completedCars = ((data.completedCars as number | undefined) ?? 0) + 1;
        const allDone        = completedCars >= totalCars;
        const wasScheduled    = data.status === 'scheduled';

        const sessionUpdate: Record<string, unknown> = {
          cars:          updatedCars,
          completedCars: FieldValue.increment(1),
          updatedAt:     FieldValue.serverTimestamp(),
        };
        if (wasScheduled) {
          sessionUpdate.status    = 'inprogress';
          sessionUpdate.startedAt = FieldValue.serverTimestamp();
        }
        if (allDone) {
          sessionUpdate.status      = 'done';
          sessionUpdate.completedAt = FieldValue.serverTimestamp();
        }
        t.update(ref, sessionUpdate);

        // The cleaningLog is what feeds the billing cron, the "car cleaned"
        // notification, the customer's cleaning history, and star ratings —
        // nothing else in this flow produces one, so it has to happen here.
        const car = updatedCars[idx];
        const logRef = db.collection('cleaningLogs').doc();
        t.set(logRef, {
          // sessionId + this doc's own id are what let a mis-tap be undone
          // (action: 'undo_car' below) — without sessionId there'd be no way
          // to find which cleaningSessions doc to revert from the log alone.
          sessionId:            id,
          societyId:            data.societyId,
          societyName:          data.societyName,
          vehicleRegistration:  car.carPlate  ?? '',
          vehicleMake:          car.carMake   ?? '',
          vehicleModel:         car.carModel  ?? '',
          customerId,
          customerName:         car.customerName ?? '',
          unitNumber:           car.unitNumber   ?? '',
          workerId,
          workerName,
          cleanedAt:            FieldValue.serverTimestamp(),
          serviceType:          'exterior',
          // Society customers are billed a flat monthly fee via the monthly-billing
          // cron (customerSocietyRecords.monthlyFee) — charging servicePrice here too
          // would double-bill, so this log carries no per-clean price.
          servicePrice:         0,
          photoUrls:            [],
          notificationSent:     false,
          billed:               false,
        });

        t.update(db.collection('workers').doc(workerId), {
          totalJobs:          FieldValue.increment(1),
          carsCompletedToday: FieldValue.increment(1),
        });

        if (car.customerPhone) {
          notifyCar = {
            phone:       car.customerPhone as string,
            name:        (car.customerName as string | undefined) || 'there',
            plate:       (car.carPlate as string | undefined) ?? '',
            societyName: (data.societyName as string | undefined) ?? '',
            tower:       (data.tower as string | undefined) ?? '',
          };
        }

        response = {
          car,
          logId: logRef.id,
          completedCars,
          totalCars,
          status: allDone ? 'done' : wasScheduled ? 'inprogress' : (data.status as string),
        };
      });

      // Best-effort — a worker's completed clean must never fail on this.
      // This is the SMS the customer expects ("your car is clean"); the
      // admin's own manual mark-done on the Live Cleaning board sends the
      // same SMS immediately, so this mirrors that for the primary (worker
      // app) path instead of only surfacing via the ~5min FCM-push cron.
      if (notifyCar) {
        const nc = notifyCar as { phone: string; name: string; plate: string; societyName: string; tower: string };
        await sendAndStoreSMS({
          type:           'car_cleaned',
          recipientPhone: nc.phone,
          recipientName:  nc.name,
          data: {
            customerId,
            carPlate:    nc.plate,
            societyName: nc.societyName,
            tower:       nc.tower,
          },
        }).catch(err => console.warn('[session/clean_car] SMS notify failed:', err));
      }

      return NextResponse.json(response);

    } else if (action === 'undo_car') {
      // Reverses a 'clean_car' mis-tap: only the worker who logged it, only
      // for this session, and only within a short window — this is meant to
      // fix an accidental tap, not to reopen arbitrary past work.
      const customerId = body.customerId as string | undefined;
      const logId      = body.logId as string | undefined;
      if (!customerId || !logId) {
        return NextResponse.json({ error: 'customerId and logId are required.' }, { status: 400 });
      }

      const UNDO_WINDOW_MS = 6 * 60 * 60 * 1000; // one full shift
      let response: Record<string, unknown> | null = null;

      await db.runTransaction(async (t) => {
        const logRef  = db.collection('cleaningLogs').doc(logId);
        const logSnap = await t.get(logRef);
        if (!logSnap.exists) throw new Error('LOG_NOT_FOUND');
        const log = logSnap.data()!;

        if (log.workerId !== workerId) throw new Error('FORBIDDEN_LOG');
        if (log.sessionId !== id) throw new Error('LOG_SESSION_MISMATCH');
        const cleanedAt = (log.cleanedAt?.toDate?.() as Date | undefined) ?? new Date(0);
        if (Date.now() - cleanedAt.getTime() > UNDO_WINDOW_MS) throw new Error('UNDO_EXPIRED');

        const snap = await t.get(ref);
        if (!snap.exists) throw new Error('NOT_FOUND');
        const data = snap.data()!;

        const cars = (data.cars as Record<string, unknown>[] | undefined) ?? [];
        // Same multi-vehicle-per-flat problem as clean_car above: customerId
        // alone would revert whichever of the flat's vehicles happens to come
        // first. The log already records which one was cleaned, so use its
        // registration as the discriminator — no client change needed.
        const loggedPlate = typeof log.vehicleRegistration === 'string' ? log.vehicleRegistration.trim() : '';
        const isDoneForCustomer = (c: Record<string, unknown>) =>
          c.customerId === customerId && c.status === 'done';
        let idx = loggedPlate
          ? cars.findIndex(c => isDoneForCustomer(c) && typeof c.carPlate === 'string' && c.carPlate.trim() === loggedPlate)
          : -1;
        if (idx === -1) idx = cars.findIndex(isDoneForCustomer);
        if (idx === -1) throw new Error('CAR_NOT_FOUND');

        // Firestore can't hold FieldValue.delete() inside an array element
        // (same restriction noted above for serverTimestamp) — rebuild the
        // car object without cleanedBy/cleanedAt instead of trying to unset them.
        const restoredCar = { ...cars[idx] };
        delete restoredCar['cleanedBy'];
        delete restoredCar['cleanedAt'];
        const updatedCars = cars.slice();
        updatedCars[idx]  = { ...restoredCar, status: 'pending' };

        const wasDone = data.status === 'done';
        const sessionUpdate: Record<string, unknown> = {
          cars:          updatedCars,
          completedCars: FieldValue.increment(-1),
          updatedAt:     FieldValue.serverTimestamp(),
        };
        if (wasDone) {
          sessionUpdate.status      = 'inprogress';
          sessionUpdate.completedAt = FieldValue.delete();
        }
        t.update(ref, sessionUpdate);
        t.delete(logRef);
        t.update(db.collection('workers').doc(workerId), {
          totalJobs:          FieldValue.increment(-1),
          carsCompletedToday: FieldValue.increment(-1),
        });

        response = {
          customerId,
          completedCars: ((data.completedCars as number | undefined) ?? 1) - 1,
          totalCars:     data.totalCars,
          status:        wasDone ? 'inprogress' : (data.status as string),
        };
      });

      return NextResponse.json(response);

    } else if (action === 'set_car_unavailable') {
      // "The car isn't here." Previously only an admin could record this from
      // the Live Cleaning board, so a worker standing in front of an empty
      // parking slot had nothing to tap — the row just stayed open and later
      // showed up as missed, as if the worker had skipped it. This is the
      // same `unavailable` flag the admin board writes, so every surface that
      // already honours it (worker to-do, clean_car's guard above, the
      // session's completable denominator) needs no change.
      const customerId  = body.customerId as string | undefined;
      const unavailable = Boolean(body.unavailable);
      if (!customerId) {
        return NextResponse.json({ error: 'customerId is required.' }, { status: 400 });
      }

      let response: Record<string, unknown> | null = null;

      await db.runTransaction(async (t) => {
        const snap = await t.get(ref);
        if (!snap.exists) throw new Error('NOT_FOUND');
        const data = snap.data()!;

        // A worker reports on the round they are walking right now. Letting
        // them flag a future day's car would hide it from the day it is
        // actually due — the same failure mode the clean_car guard prevents.
        if (isFutureDay(data.scheduledDate)) throw new Error('CAR_NOT_DUE_YET');

        // Same per-vehicle matching as clean_car: a flat's car and its
        // two-wheeler share one customerId, so the plate is the discriminator.
        const cars = (data.cars as Record<string, unknown>[] | undefined) ?? [];
        const carPlate = typeof body.carPlate === 'string' ? body.carPlate.trim() : '';
        const samePlate = (c: Record<string, unknown>) =>
          typeof c.carPlate === 'string' && c.carPlate.trim() === carPlate;
        const idx = carPlate
          ? cars.findIndex(c => c.customerId === customerId && samePlate(c))
          : cars.findIndex(c => c.customerId === customerId && c.status !== 'done');
        if (idx === -1) throw new Error('CAR_NOT_FOUND');

        const target = cars[idx];
        // A cleaned car can't retroactively become "not there", and a car the
        // customer themselves opted out of ('skipped' via their skipDates)
        // isn't the worker's to override — matching the admin board's rule.
        if (target.status === 'done')    throw new Error('CAR_ALREADY_DONE');
        if (target.status === 'skipped') throw new Error('CAR_SKIPPED');

        const totalCars     = (data.totalCars as number | undefined) ?? cars.length;
        const completedCars = (data.completedCars as number | undefined) ?? 0;

        // Already in the requested state (double-tap, or another worker got
        // there first): report the current numbers rather than moving
        // totalCars a second time.
        if (Boolean(target.unavailable) === unavailable) {
          response = { completedCars, totalCars, status: data.status as string, unavailable };
          return;
        }

        const updatedCars = cars.slice();
        updatedCars[idx]  = { ...target, unavailable };

        // Keeps totalCars an accurate denominator for "is this session fully
        // done" — an unavailable car can never be completed, the same
        // reasoning as skippedCars being excluded at creation time.
        const newTotal = unavailable ? Math.max(0, totalCars - 1) : totalCars + 1;

        const sessionUpdate: Record<string, unknown> = {
          cars:      updatedCars,
          totalCars: newTotal,
          updatedAt: FieldValue.serverTimestamp(),
        };

        // Removing the last open car finishes the round. The admin board's
        // toggle doesn't do this, which is how a tower whose final car was
        // unavailable could sit 'inprogress' forever.
        //
        // Decided from the car array rather than completedCars >= totalCars:
        // those are stored counters, and a session whose totalCars had drifted
        // low would otherwise flip to 'done' with real pending cars still on
        // it. The array is the thing a worker actually reads.
        const stillOpen = updatedCars.some(c =>
          (c.status === 'pending' || c.status === 'in_progress') && !c.unavailable
        );

        let newStatus = data.status as string;
        if (unavailable && newStatus !== 'done' && !stillOpen) {
          newStatus = 'done';
          sessionUpdate.status      = 'done';
          sessionUpdate.completedAt = FieldValue.serverTimestamp();
        } else if (!unavailable && newStatus === 'done') {
          // Putting a car back gives the session open work again.
          newStatus = 'inprogress';
          sessionUpdate.status      = 'inprogress';
          sessionUpdate.completedAt = FieldValue.delete();
        }

        t.update(ref, sessionUpdate);
        response = { completedCars, totalCars: newTotal, status: newStatus, unavailable };
      });

      return NextResponse.json(response);

    } else if (action === 'complete') {
      // Transactional for the same reason 'clean_car' above is: a worker can
      // hit "complete" while another assigned worker's clean_car for a
      // different car is still in flight (CLAUDE.md's multi-worker model —
      // 1-3+ workers on the same tower). A plain get()+update() here would
      // read cars before that concurrent write lands and then overwrite it
      // wholesale, silently reverting a just-cleaned car back to 'skipped'.
      await db.runTransaction(async (t) => {
        const snap = await t.get(ref);
        if (!snap.exists) throw new Error('NOT_FOUND');
        const data = snap.data()!;
        if (data.status !== 'inprogress') throw new Error('NOT_INPROGRESS');

        // This is the "wrap up even if some cars were skipped in person" override —
        // without this, a car left 'pending'/'in_progress' stayed exactly that way
        // while the session itself flipped to 'done', so the UI showed a closed,
        // "complete" session with a still-clickable "Mark Clean" button on it.
        const cars = (data.cars as Record<string, unknown>[] | undefined) ?? [];
        const updatedCars = cars.map(c =>
          c.status === 'done' || c.status === 'skipped' ? c : { ...c, status: 'skipped' }
        );
        const skippedCars = updatedCars.filter(c => c.status === 'skipped').length;

        t.update(ref, {
          status: 'done',
          cars: updatedCars,
          skippedCars,
          completedAt: FieldValue.serverTimestamp(),
        });
      });

    } else {
      return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
    }

    // Return the updated doc (only reached by the 'complete' branch — 'clean_car' returns above)
    const updated = await ref.get();
    const u       = updated.data()!;
    return NextResponse.json({
      id:            updated.id,
      status:        u.status,
      completedCars: u.completedCars,
      totalCars:     u.totalCars,
      startedAt:     u.startedAt?.toDate?.()?.toISOString() ?? null,
      completedAt:   u.completedAt?.toDate?.()?.toISOString() ?? null,
      cars: (u.cars ?? []).map((c: Record<string, unknown>) => ({
        customerId:    c.customerId,
        customerName:  c.customerName ?? '',
        customerPhone: c.customerPhone ?? '',
        unitNumber:    c.unitNumber ?? '',
        parkingNumber: c.parkingNumber ?? '',
        parkingLevel:  c.parkingLevel ?? '',
        carPlate:      c.carPlate ?? '',
        carMake:       c.carMake ?? '',
        carModel:      c.carModel ?? '',
        preferredTime: c.preferredTime ?? null,
        status:        c.status ?? 'pending',
      })),
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }
    if (err instanceof Error && err.message === 'CAR_NOT_FOUND') {
      return NextResponse.json({ error: 'Car not found or already cleaned.' }, { status: 400 });
    }
    if (err instanceof Error && err.message === 'CAR_UNAVAILABLE') {
      return NextResponse.json({ error: 'This car was marked not available today.' }, { status: 400 });
    }
    if (err instanceof Error && err.message === 'CAR_NOT_DUE_YET') {
      return NextResponse.json({ error: 'This car is scheduled for a later day — you can tick it on that day.' }, { status: 400 });
    }
    if (err instanceof Error && err.message === 'CAR_ALREADY_DONE') {
      return NextResponse.json({ error: 'This car has already been cleaned.' }, { status: 400 });
    }
    if (err instanceof Error && err.message === 'CAR_SKIPPED') {
      return NextResponse.json({ error: 'The customer has skipped this car today.' }, { status: 400 });
    }
    if (err instanceof Error && err.message === 'NOT_INPROGRESS') {
      return NextResponse.json({ error: 'Session is not in progress.' }, { status: 400 });
    }
    if (err instanceof Error && err.message === 'LOG_NOT_FOUND') {
      return NextResponse.json({ error: 'Clean record not found.' }, { status: 404 });
    }
    if (err instanceof Error && err.message === 'FORBIDDEN_LOG') {
      return NextResponse.json({ error: 'You can only undo your own cleans.' }, { status: 403 });
    }
    if (err instanceof Error && err.message === 'LOG_SESSION_MISMATCH') {
      return NextResponse.json({ error: 'This clean does not belong to this session.' }, { status: 400 });
    }
    if (err instanceof Error && err.message === 'UNDO_EXPIRED') {
      return NextResponse.json({ error: 'Too much time has passed to undo this — ask your admin.' }, { status: 400 });
    }
    console.error('[session/POST]', err);
    return NextResponse.json({ error: toErrMsg(err) }, { status: 500 });
  }
}
