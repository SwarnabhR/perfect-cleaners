import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore, adminAuth } from '@/lib/firebase/admin';

// Called by the worker job detail page when status advances to 'done'.
// Credits worker earnings and writes an in-app notification to the customer.
export async function POST(req: NextRequest) {
  try {
    const { bookingId, customerId, total, serviceIds } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required.' }, { status: 400 });
    }

    // Verify the caller — workerId is always the authenticated user's UID
    const idToken = (req.headers.get('Authorization') ?? '').replace('Bearer ', '').trim();
    if (!idToken) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const decoded = await adminAuth().verifyIdToken(idToken);
    const workerId = decoded.uid;

    const db = adminFirestore();

    const svc = ((serviceIds?.[0] ?? 'service') as string)
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase());

    const earned = (total as number | undefined) ?? 0;
    const writes: Promise<unknown>[] = [];

    // Credit worker earnings
    writes.push(
        db.doc(`workers/${workerId}`).update({
          totalJobs:        FieldValue.increment(1),
          'earnings.today': FieldValue.increment(earned),
          'earnings.week':  FieldValue.increment(earned),
          'earnings.month': FieldValue.increment(earned),
          updatedAt:        FieldValue.serverTimestamp(),
        }),
      );

    // In-app notification to customer
    if (customerId && !customerId.startsWith('phone:')) {
      writes.push(
        db.collection('customers').doc(customerId).collection('notifications').add({
          type:      'job_complete',
          title:     'Job complete',
          body:      `Your ${svc} is done. Tap to rate your experience.`,
          read:      false,
          createdAt: FieldValue.serverTimestamp(),
          bookingId,
        }),
      );
    }

    await Promise.all(writes);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[job-complete]', err);
    return NextResponse.json({ error: err?.message ?? 'Server error.' }, { status: 500 });
  }
}
