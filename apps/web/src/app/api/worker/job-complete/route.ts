import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore, adminAuth } from '@/lib/firebase/admin';

// Called by the worker job detail page when status advances to 'done'.
// Increments the worker's totalJobs/carsCompletedToday stats and writes an
// in-app notification to the customer. Pay figures are a separate, admin-only
// concern — see workerEarnings collection — and are not touched here.
export async function POST(req: NextRequest) {
  try {
    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required.' }, { status: 400 });
    }

    // Verify the caller is an authenticated worker
    const idToken = (req.headers.get('Authorization') ?? '').replace('Bearer ', '').trim();
    if (!idToken) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const decoded = await adminAuth().verifyIdToken(idToken);
    const workerId = decoded.uid;

    const db          = adminFirestore();
    const bookingRef  = db.collection('bookings').doc(bookingId);
    const workerRef   = db.doc(`workers/${workerId}`);

    // Pre-flight read for ownership check and to extract data for the notification.
    // The transaction re-reads before writing, so any racing update is still safe.
    const initialSnap = await bookingRef.get();
    if (!initialSnap.exists) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }
    const initialData = initialSnap.data()!;

    if (initialData.workerId !== workerId) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const customerId = initialData.customerId as string | undefined;
    const serviceIds = initialData.serviceIds as string[] | undefined;
    const svc = ((serviceIds?.[0] ?? 'service') as string)
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase());

    // Atomic: check idempotency and write booking status + worker stats together.
    // Without a transaction, two concurrent calls could both read status !== 'done'
    // and both increment totalJobs, producing a double-counted stat.
    let alreadyDone = false;
    await db.runTransaction(async (t) => {
      const snap = await t.get(bookingRef);
      if (snap.data()?.status === 'done') {
        alreadyDone = true;
        return;
      }
      t.update(bookingRef, { status: 'done', completedAt: FieldValue.serverTimestamp() });
      t.update(workerRef, {
        totalJobs:          FieldValue.increment(1),
        carsCompletedToday: FieldValue.increment(1),
        activeBookingId:    FieldValue.delete(),
        updatedAt:          FieldValue.serverTimestamp(),
      });
    });

    if (alreadyDone) return NextResponse.json({ ok: true });

    // Customer notification — best-effort, outside the transaction
    if (customerId && !customerId.startsWith('phone:')) {
      db.collection('customers').doc(customerId).collection('notifications').add({
        type:      'job_complete',
        title:     'Job complete',
        body:      `Your ${svc} is done. Tap to rate your experience.`,
        read:      false,
        createdAt: FieldValue.serverTimestamp(),
        bookingId,
      }).catch(err => console.error('[job-complete] notification write failed:', err));
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('[job-complete]', err);
    return NextResponse.json({ error: toErrMsg(err) }, { status: 500 });
  }
}
