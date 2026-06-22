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
      workerId:      data.workerId,
      workerName:    data.workerName,
      scheduledDate: data.scheduledDate?.toDate?.()?.toISOString() ?? null,
      status:        data.status,
      totalCars:     data.totalCars,
      completedCars: data.completedCars,
      startedAt:     data.startedAt?.toDate?.()?.toISOString() ?? null,
      completedAt:   data.completedAt?.toDate?.()?.toISOString() ?? null,
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
    const decoded = await adminAuth().verifyIdToken(bearer);

    const db  = adminFirestore();
    const workerSnap = await db.collection('workers').doc(decoded.uid).get();
    if (!workerSnap.exists) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const { action } = await req.json();
    const ref        = db.collection('cleaningSessions').doc(id);
    const snap       = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    const data = snap.data()!;

    if (action === 'start') {
      if (data.status !== 'scheduled') {
        return NextResponse.json({ error: 'Session is not in scheduled state.' }, { status: 400 });
      }
      await ref.update({ status: 'inprogress', startedAt: FieldValue.serverTimestamp() });

    } else if (action === 'increment') {
      if (data.status !== 'inprogress') {
        return NextResponse.json({ error: 'Session is not in progress.' }, { status: 400 });
      }
      if (data.completedCars >= data.totalCars) {
        return NextResponse.json({ error: 'All cars already marked cleaned.' }, { status: 400 });
      }
      await ref.update({ completedCars: FieldValue.increment(1) });

    } else if (action === 'complete') {
      if (data.status !== 'inprogress') {
        return NextResponse.json({ error: 'Session is not in progress.' }, { status: 400 });
      }
      await ref.update({ status: 'done', completedAt: FieldValue.serverTimestamp() });

    } else {
      return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
    }

    // Return the updated doc
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
    console.error('[session/POST]', err);
    return NextResponse.json({ error: toErrMsg(err) }, { status: 500 });
  }
}
