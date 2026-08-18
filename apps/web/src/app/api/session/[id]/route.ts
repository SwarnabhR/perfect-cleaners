import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore, adminAuth } from '@/lib/firebase/admin';
import { sendAndStoreSMS } from '@/lib/notify-sms';

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
    // Sessions are now written with a multi-worker array (workerIds), but
    // older docs (and /api/session/create) still only set the legacy
    // singular workerId — both must grant access.
    const workerIds = (data.workerIds as string[] | undefined) ?? [];
    const isAssignedWorker = workerIds.includes(decoded.uid) || data.workerId === decoded.uid;
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
    const isAssignedWorker = sessionWorkerIds.includes(workerId) || sessionData?.workerId === workerId;
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
        const idx  = cars.findIndex(c => c.customerId === customerId);
        if (idx === -1 || cars[idx].status === 'done') throw new Error('CAR_NOT_FOUND');
        // Admin marked this car "not available today" on the Live Cleaning
        // board — same as a customer's own skipDate, it can't be completed.
        if (cars[idx].unavailable) throw new Error('CAR_UNAVAILABLE');

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
        const idx  = cars.findIndex(c => c.customerId === customerId && c.status === 'done');
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
