import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore, adminMessaging, adminAuth } from '@/lib/firebase/admin';

// Called by the admin bookings page immediately after assigning a worker.
// Sends an FCM push + writes an in-app notification on the worker doc.
export async function POST(req: NextRequest) {
  try {
    const { bookingId, workerId, workerName, serviceIds, customerName, address, scheduledAt } =
      await req.json();

    if (!bookingId || !workerId) {
      return NextResponse.json({ error: 'bookingId and workerId are required.' }, { status: 400 });
    }

    // Verify the caller is an admin
    const idToken = (req.headers.get('Authorization') ?? '').replace('Bearer ', '').trim();
    if (!idToken) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const decoded = await adminAuth().verifyIdToken(idToken);
    const db = adminFirestore();
    const adminSnap = await db.collection('admins').doc(decoded.uid).get();
    if (!adminSnap.exists) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const svc = ((serviceIds?.[0] ?? 'service') as string)
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase());

    const addrStr = [address?.line1, address?.city].filter(Boolean).join(', ');
    const dateStr = scheduledAt
      ? new Date(scheduledAt).toLocaleDateString('en-IN', {
          weekday: 'short', day: 'numeric', month: 'short',
          hour: '2-digit', minute: '2-digit',
        })
      : '';

    const notifBody = `${svc} for ${customerName ?? 'Customer'}${addrStr ? ` · ${addrStr}` : ''}${dateStr ? `. ${dateStr}` : ''}.`;

    const writes: Promise<unknown>[] = [
      db.collection('workers').doc(workerId).collection('notifications').add({
        type:      'job_assigned',
        title:     'New job assigned',
        body:      notifBody,
        read:      false,
        createdAt: FieldValue.serverTimestamp(),
        bookingId,
      }),
    ];

    await Promise.all(writes);

    // FCM push — best-effort
    const workerSnap = await db.doc(`workers/${workerId}`).get();
    const fcmToken   = workerSnap.data()?.fcmToken as string | undefined;

    if (fcmToken) {
      await adminMessaging().send({
        token:        fcmToken,
        notification: { title: 'New job assigned', body: notifBody },
        data:         { bookingId, type: 'job_assigned' },
        android:      { priority: 'high', notification: { channelId: 'jobs', sound: 'default' } },
        apns:         { payload: { aps: { sound: 'default', badge: 1 } } },
      }).catch(err => console.error('[notify-assigned] FCM failed:', err));
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[notify-assigned]', err);
    return NextResponse.json({ error: err?.message ?? 'Server error.' }, { status: 500 });
  }
}
