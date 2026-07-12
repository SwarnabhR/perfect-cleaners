import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore, adminAuth } from '@/lib/firebase/admin';

// Called from the customer's cleaning history list to rate a completed clean.
// Folds the rating into the assigned worker's running average (workers/{id}.rating),
// which is what the worker's own profile page and the admin dashboard read.
export async function POST(req: NextRequest) {
  try {
    const { logId, rating } = await req.json();

    if (!logId || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'logId and a rating from 1-5 are required.' }, { status: 400 });
    }

    const idToken = (req.headers.get('Authorization') ?? '').replace('Bearer ', '').trim();
    if (!idToken) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const decoded = await adminAuth().verifyIdToken(idToken);
    const customerId = decoded.uid;

    const db     = adminFirestore();
    const logRef = db.collection('cleaningLogs').doc(logId);

    let workerId: string | undefined;
    let alreadyRated = false;

    // Atomic: verify ownership + not-already-rated, write the log's rating, and fold
    // it into the worker's average in one transaction so concurrent ratings for the
    // same worker can't race and drop an increment.
    await db.runTransaction(async (t) => {
      const logSnap = await t.get(logRef);
      if (!logSnap.exists) throw new Error('NOT_FOUND');
      const log = logSnap.data()!;

      if (log.customerId !== customerId) throw new Error('FORBIDDEN');
      if (log.rating != null) { alreadyRated = true; return; }

      workerId = log.workerId as string;
      const workerRef = db.collection('workers').doc(workerId);
      const workerSnap = await t.get(workerRef);
      if (!workerSnap.exists) throw new Error('NOT_FOUND');
      const worker = workerSnap.data()!;

      const prevCount = (worker.ratingCount as number | undefined) ?? 0;
      const prevAvg   = (worker.rating as number | undefined) ?? 0;
      const newCount  = prevCount + 1;
      const newAvg    = (prevAvg * prevCount + rating) / newCount;

      t.update(logRef, { rating, ratedAt: FieldValue.serverTimestamp() });
      t.update(workerRef, { rating: newAvg, ratingCount: newCount });
    });

    if (alreadyRated) {
      return NextResponse.json({ error: 'This cleaning has already been rated.' }, { status: 409 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    }
    if (err instanceof Error && err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }
    console.error('[cleaning-log/rate]', err);
    return NextResponse.json({ error: toErrMsg(err) }, { status: 500 });
  }
}
