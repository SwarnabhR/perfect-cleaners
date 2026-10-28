import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore, adminAuth } from '@/lib/firebase/admin';
import { sendAndStoreSMS } from '@/lib/notify-sms';
import { startOfIstDay } from '@pc/firebase';
import { requireAdmin } from '@/lib/admin-server-auth';

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
      try {
        await requireAdmin(bearer, ['operations']);
      } catch {
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
        services:      c.services ?? null,
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

    // Workers assigned to the session and authenticated admins may mutate it.
    const bearer = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/, '');
    if (!bearer) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const decoded  = await adminAuth().verifyIdToken(bearer);
    const workerId = decoded.uid;

    const db = adminFirestore();
    const workerSnap = await db.collection('workers').doc(workerId).get();
    let isAdmin = false;
    if (!workerSnap.exists) {
      try {
        await requireAdmin(bearer, ['operations']);
        isAdmin = true;
      } catch {
        isAdmin = false;
      }
    }
    if (!workerSnap.exists && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }
    const workerName = (workerSnap.data()?.name as string | undefined) ?? (isAdmin ? 'Admin' : 'Worker');

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
    if (!isAssignedWorker && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const body   = await req.json();
    const action = body.action;

    if (action === 'start_car') {
      const customerId = typeof body.customerId === 'string' ? body.customerId : '';
      const carPlate = typeof body.carPlate === 'string' ? body.carPlate.trim() : '';
      const serviceKey = body.service === 'deep-clean' ? 'deepClean' : 'wash';
      if (!customerId) return NextResponse.json({ error: 'customerId is required.' }, { status: 400 });
      await db.runTransaction(async t => {
        const snap = await t.get(ref);
        if (!snap.exists) throw new Error('NOT_FOUND');
        const data = snap.data()!;
        if (isFutureDay(data.scheduledDate)) throw new Error('CAR_NOT_DUE_YET');
        const cars = (data.cars as Record<string, unknown>[] | undefined) ?? [];
        const index = cars.findIndex(car => car.customerId === customerId
          && (carPlate ? String(car.carPlate ?? '').trim() === carPlate : true));
        if (index < 0) throw new Error('CAR_NOT_FOUND');
        const car = cars[index];
        if (car.unavailable || car.status === 'skipped') throw new Error('CAR_UNAVAILABLE');
        const legacyService = data.sessionType === 'deep-clean' ? 'deepClean' : 'wash';
        const services = (car.services as Record<string, Record<string, unknown>> | undefined)
          ?? { [legacyService]: { status: car.status } };
        const task = services[serviceKey];
        if (!task || task.status !== 'pending') return;
        const updated = cars.slice();
        updated[index] = { ...car, services: { ...services, [serviceKey]: { ...task, status: 'in_progress' } } };
        t.update(ref, { cars: updated, updatedAt: FieldValue.serverTimestamp() });
      });
      return NextResponse.json({ ok: true });
    }

    if (action === 'clean_car') {
      const customerId = body.customerId as string | undefined;
      const service = body.service === 'deep-clean' ? 'deepClean' : 'wash';
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
        if (idx === -1) throw new Error('CAR_NOT_FOUND');
        // Marked "not available today" — by a worker on the ground or an
        // admin on the Live Cleaning board. Same as a customer's own
        // skipDate, it can't be completed.
        if (cars[idx].unavailable) throw new Error('CAR_UNAVAILABLE');
        // Tomorrow's round is not today's work — see isFutureDay.
        if (isFutureDay(data.scheduledDate)) throw new Error('CAR_NOT_DUE_YET');

        const now = new Date();
        const updatedCars = cars.slice();
        const legacyService = (data.sessionType as string | undefined) === 'deep-clean' ? 'deepClean' : 'wash';
        const existingServices = (updatedCars[idx].services as Record<string, Record<string, unknown>> | undefined) ?? {
          [legacyService]: { status: updatedCars[idx].status === 'skipped' ? 'skipped' : updatedCars[idx].status ?? 'pending' },
        };
        const currentTask = existingServices[service];
        if (!currentTask || currentTask.status === 'skipped') throw new Error('SERVICE_NOT_SCHEDULED');
        if (currentTask.status === 'done') throw new Error('SERVICE_ALREADY_DONE');
        const nextServices = { ...existingServices, [service]: { ...currentTask, status: 'done', cleanedBy: workerId, cleanedAt: now } };
        const requiredTasks = Object.values(nextServices).filter(task => task.status !== 'skipped');
        const doneTasks = requiredTasks.filter(task => task.status === 'done');
        const rowDone = requiredTasks.length > 0 && doneTasks.length === requiredTasks.length;
        updatedCars[idx] = { ...updatedCars[idx], services: nextServices, ...(rowDone ? { status: 'done', cleanedBy: workerId, cleanedAt: now } : {}) };

        const totalCars = (data.totalCars as number | undefined) ?? cars.length;
        const oldServices = (cars[idx].services as Record<string, { status: string }> | undefined) ?? { [legacyService]: { status: cars[idx].status as string } };
        const newServices = nextServices as Record<string, { status: string }>;
        const beforeDone = Object.values(oldServices).filter(task => task.status === 'done').length || (cars[idx].status === 'done' ? 1 : 0);
        const afterDone = Object.values(newServices).filter(task => task.status === 'done').length;
        const addedDone = Math.max(0, afterDone - beforeDone);
        const completedCars = ((data.completedCars as number | undefined) ?? 0) + addedDone;
        const allDone        = totalCars > 0 && completedCars >= totalCars && updatedCars.every(car => {
          if (car.unavailable) return true;
          const services = car.services as Record<string, { status?: string }> | undefined;
          if (services) return Object.values(services).every(task => task.status === 'done' || task.status === 'skipped');
          return car.status === 'done' || car.status === 'skipped';
        });
        const wasScheduled    = data.status === 'scheduled';

        // A one-time deep clean is billed when completed, so a mid-month
        // appointment does not wait for the next monthly billing run. The
        // record flag and deterministic invoice ID make this idempotent with
        // the scheduled-billing fallback.
        let oneTimeDeepBill: { recordRef: FirebaseFirestore.DocumentReference; billRef: FirebaseFirestore.DocumentReference; record: FirebaseFirestore.DocumentData; amount: number } | null = null;
        if (service === 'deepClean') {
          const customerRecords = await t.get(db.collection('customerSocietyRecords').where('customerId', '==', customerId).where('societyId', '==', data.societyId));
          const customerRecord = customerRecords.docs.find(doc => doc.data().deepCleanEnabled === true && doc.data().deepCleanFrequency === 'one-time' && doc.data().deepCleanOneTimeBilled !== true);
          if (customerRecord) {
            const scheduled = (data.scheduledDate as { toDate?: () => Date } | undefined)?.toDate?.() ?? new Date();
            const billingId = `${customerRecord.id}_${scheduled.toISOString().slice(0, 10)}_deep`;
            const billRef = db.collection('billingRecords').doc(billingId);
            const billSnap = await t.get(billRef);
            if (!billSnap.exists) oneTimeDeepBill = {
              recordRef: customerRecord.ref,
              billRef,
              record: customerRecord.data(),
              amount: Number(customerRecord.data().deepCleanFee ?? 0),
            };
          }
        }

        const sessionUpdate: Record<string, unknown> = {
          cars:          updatedCars,
          ...(addedDone ? { completedCars: FieldValue.increment(addedDone) } : {}),
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

        if (oneTimeDeepBill && oneTimeDeepBill.amount > 0) {
          const bill = oneTimeDeepBill;
          t.set(bill.billRef, {
            customerRecordId: bill.recordRef.id,
            customerId,
            societyId: data.societyId,
            societyName: data.societyName,
            tower: data.tower,
            amount: bill.amount,
            serviceType: 'deep-clean',
            description: 'One-time deep cleaning',
            status: 'pending',
            billedAt: FieldValue.serverTimestamp(),
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          });
          t.update(bill.recordRef, {
            deepCleanOneTimeBilled: true,
            paymentStatus: 'pending_payment',
            pendingAmount: FieldValue.increment(bill.amount),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }

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
          serviceType:          service === 'deepClean' ? 'deep-clean' : 'exterior',
          deepClean:            service === 'deepClean',
          // Society customers are billed a flat monthly fee via the monthly-billing
          // cron (customerSocietyRecords.monthlyFee) — charging servicePrice here too
          // would double-bill, so this log carries no per-clean price.
          servicePrice:         0,
          photoUrls:            [],
          notificationSent:     false,
          billed:               false,
        });

        if (workerSnap.exists) t.update(db.collection('workers').doc(workerId), {
          // Job totals are car-level, matching carsCompletedToday even when a
          // car has both wash and deep-clean tasks.
          totalJobs:          FieldValue.increment(rowDone && cars[idx].status !== 'done' ? 1 : 0),
          carsCompletedToday: FieldValue.increment(rowDone && cars[idx].status !== 'done' ? 1 : 0),
        });

        if (rowDone && car.customerPhone) {
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
          service,
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
        const loggedService = log.deepClean === true ? 'deepClean' : 'wash';
        const isDoneForCustomer = (c: Record<string, unknown>) => {
          const services = c.services as Record<string, { status?: string }> | undefined;
          return c.customerId === customerId && (services?.[loggedService]?.status === 'done' || (!services && c.status === 'done'));
        };
        let idx = loggedPlate
          ? cars.findIndex(c => isDoneForCustomer(c) && typeof c.carPlate === 'string' && c.carPlate.trim() === loggedPlate)
          : -1;
        if (idx === -1) idx = cars.findIndex(isDoneForCustomer);
        if (idx === -1) throw new Error('CAR_NOT_FOUND');

        const restoredCar = { ...cars[idx] };
        const legacyService = (data.sessionType as string | undefined) === 'deep-clean' ? 'deepClean' : 'wash';
        const services = { ...((restoredCar.services as Record<string, Record<string, unknown>> | undefined) ?? { [legacyService]: { status: restoredCar.status } }) };
        const task = { ...(services[loggedService] ?? {}) };
        delete task.cleanedBy;
        delete task.cleanedAt;
        task.status = 'pending';
        services[loggedService] = task;
        const priorRequiredTasks = Object.values(services).filter(item => item.status !== 'skipped');
        const wasRowDone = priorRequiredTasks.length > 0 && priorRequiredTasks.every(item => item.status === 'done');
        const requiredTasks = Object.values(services).filter(item => item.status !== 'skipped');
        const rowDone = requiredTasks.length > 0 && requiredTasks.every(item => item.status === 'done');
        restoredCar.services = services;
        if (!rowDone) {
          delete restoredCar.cleanedBy;
          delete restoredCar.cleanedAt;
          restoredCar.status = 'pending';
        }
        const updatedCars = cars.slice();
        updatedCars[idx]  = restoredCar;

        const wasDone = data.status === 'done';
        const newCompletedCars = Math.max(0, ((data.completedCars as number | undefined) ?? 1) - 1);
        const sessionUpdate: Record<string, unknown> = {
          cars:          updatedCars,
          completedCars: newCompletedCars,
          updatedAt:     FieldValue.serverTimestamp(),
        };
        if (wasDone) {
          sessionUpdate.status      = 'inprogress';
          sessionUpdate.completedAt = FieldValue.delete();
        }
        t.update(ref, sessionUpdate);
        t.delete(logRef);
        if (workerSnap.exists) t.update(db.collection('workers').doc(workerId), {
          totalJobs:          FieldValue.increment(wasRowDone ? -1 : 0),
          carsCompletedToday: FieldValue.increment(wasRowDone ? -1 : 0),
        });

        response = {
          customerId,
          completedCars: newCompletedCars,
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

        const targetTasks = target.services as Record<string, { status?: string }> | undefined;
        const unavailableCount = targetTasks
          ? Object.values(targetTasks).filter(task => task.status !== 'skipped' && task.status !== 'done').length
          : 1;
        if (targetTasks && Object.values(targetTasks).some(task => task.status === 'done')) throw new Error('CAR_ALREADY_DONE');
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
        const newTotal = unavailable ? Math.max(0, totalCars - unavailableCount) : totalCars + unavailableCount;

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
        const stillOpen = updatedCars.some(c => {
          if (c.unavailable) return false;
          const services = c.services as Record<string, { status?: string }> | undefined;
          if (services) return Object.values(services).some(task => task.status === 'pending' || task.status === 'in_progress');
          return c.status === 'pending' || c.status === 'in_progress';
        });

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
        const updatedCars = cars.map(car => {
          const services = car.services as Record<string, { status?: string }> | undefined;
          if (!services) return car.status === 'done' || car.status === 'skipped' ? car : { ...car, status: 'skipped' };
          const closedServices = Object.fromEntries(Object.entries(services).map(([key, task]) => [
            key,
            task.status === 'pending' || task.status === 'in_progress' ? { ...task, status: 'skipped' } : task,
          ]));
          const everyClosed = Object.values(closedServices).every(task => task.status === 'done' || task.status === 'skipped');
          return { ...car, services: closedServices, ...(everyClosed ? { status: 'done' } : {}) };
        });
        const skippedCars = updatedCars.reduce((sum, car) => {
          const services = car.services as Record<string, { status?: string }> | undefined;
          return sum + (services ? Object.values(services).filter(task => task.status === 'skipped').length : car.status === 'skipped' ? 1 : 0);
        }, 0);

        t.update(ref, {
          status: 'done',
          cars: updatedCars,
          skippedCars,
          completedCars: updatedCars.reduce((sum, car) => {
            const services = car.services as Record<string, { status?: string }> | undefined;
            return sum + (services ? Object.values(services).filter(task => task.status === 'done').length : car.status === 'done' ? 1 : 0);
          }, 0),
          totalCars: updatedCars.reduce((sum, car) => {
            const services = car.services as Record<string, { status?: string }> | undefined;
            return sum + (services ? Object.values(services).filter(task => task.status !== 'skipped').length : car.status === 'skipped' ? 0 : 1);
          }, 0),
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
    if (err instanceof Error && err.message === 'CAR_NOT_DUE_YET') {
      return NextResponse.json({ error: 'This car is scheduled for a later day — you can tick it on that day.' }, { status: 400 });
    }
    if (err instanceof Error && err.message === 'CAR_UNAVAILABLE') {
      return NextResponse.json({ error: 'This car was marked not available today.' }, { status: 400 });
    }
    if (err instanceof Error && err.message === 'SERVICE_NOT_SCHEDULED') {
      return NextResponse.json({ error: 'This service is not scheduled for this car on this date.' }, { status: 400 });
    }
    if (err instanceof Error && err.message === 'SERVICE_ALREADY_DONE') {
      return NextResponse.json({ error: 'This service has already been completed.' }, { status: 400 });
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
