import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore, adminAuth } from '@/lib/firebase/admin';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db     = adminFirestore();
    const snap   = await db.collection('cleaningSessions').doc(id).get();

    if (!snap.exists) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    const data = snap.data()!;
    return NextResponse.json({
      id:            snap.id,
      societyId:     data.societyId,
      societyName:   data.societyName,
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
        unitNumber:    c.unitNumber ?? '',
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

    const body   = await req.json();
    const action = body.action;
    const ref    = db.collection('cleaningSessions').doc(id);

    if (action === 'clean_car') {
      const customerId = body.customerId as string | undefined;
      if (!customerId) {
        return NextResponse.json({ error: 'customerId is required.' }, { status: 400 });
      }

      let response: Record<string, unknown> | null = null;

      await db.runTransaction(async (t) => {
        const snap = await t.get(ref);
        if (!snap.exists) throw new Error('NOT_FOUND');
        const data = snap.data()!;

        const cars = (data.cars as Record<string, unknown>[] | undefined) ?? [];
        const idx  = cars.findIndex(c => c.customerId === customerId && c.status !== 'done');
        if (idx === -1) throw new Error('CAR_NOT_FOUND');

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
        t.set(db.collection('cleaningLogs').doc(), {
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

        response = {
          car,
          completedCars,
          totalCars,
          status: allDone ? 'done' : wasScheduled ? 'inprogress' : (data.status as string),
        };
      });

      return NextResponse.json(response);

    } else if (action === 'complete') {
      const snap = await ref.get();
      if (!snap.exists) return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
      const data = snap.data()!;
      if (data.status !== 'inprogress') {
        return NextResponse.json({ error: 'Session is not in progress.' }, { status: 400 });
      }
      await ref.update({ status: 'done', completedAt: FieldValue.serverTimestamp() });

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
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }
    if (err instanceof Error && err.message === 'CAR_NOT_FOUND') {
      return NextResponse.json({ error: 'Car not found or already cleaned.' }, { status: 400 });
    }
    console.error('[session/POST]', err);
    return NextResponse.json({ error: toErrMsg(err) }, { status: 500 });
  }
}
