import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import {
  onDocumentCreated,
  onDocumentUpdated,
} from 'firebase-functions/v2/firestore';
import { defineSecret } from 'firebase-functions/params';

initializeApp();

const db        = getFirestore();
const messaging = getMessaging();
const msg91Key  = defineSecret('MSG91_AUTH_KEY');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function serviceLabel(serviceIds: string[]): string {
  return (serviceIds[0] ?? 'service')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function fmtDate(ts: FirebaseFirestore.Timestamp | undefined): string {
  if (!ts) return '';
  return ts.toDate().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Write a notification doc to {collection}/{uid}/notifications/{auto-id}. */
async function pushNotif(
  collection: 'customers' | 'workers',
  uid: string,
  type: string,
  title: string,
  body: string,
  extra: Record<string, string> = {},
) {
  await db
    .collection(collection)
    .doc(uid)
    .collection('notifications')
    .add({
      type,
      title,
      body,
      read:      false,
      createdAt: FieldValue.serverTimestamp(),
      ...extra,
    });
}

// ─── 1. Job complete → update worker earnings + notify customer ───────────────

export const onJobComplete = onDocumentUpdated('bookings/{bookingId}', async event => {
  const before = event.data?.before.data();
  const after  = event.data?.after.data();
  if (!before || !after) return;
  if (before.status === after.status || after.status !== 'done') return;

  const workerId   = after.workerId   as string | undefined;
  const customerId = after.customerId as string | undefined;
  const earned     = (after.priceBreakdown?.total ?? 0) as number;
  const svc        = serviceLabel((after.serviceIds ?? []) as string[]);
  const bookingId  = event.params.bookingId;

  const writes: Promise<unknown>[] = [];

  // Credit worker earnings
  if (workerId) {
    writes.push(
      db.doc(`workers/${workerId}`).update({
        totalJobs:        FieldValue.increment(1),
        'earnings.today': FieldValue.increment(earned),
        'earnings.week':  FieldValue.increment(earned),
        'earnings.month': FieldValue.increment(earned),
        updatedAt:        FieldValue.serverTimestamp(),
      }),
    );
  }

  // Notify customer (only when customerId is a real UID, not phone: fallback)
  if (customerId && !customerId.startsWith('phone:')) {
    writes.push(
      pushNotif('customers', customerId, 'job_complete',
        'Job complete',
        `Your ${svc} is done. Tap to rate your experience.`,
        { bookingId },
      ),
    );
  }

  await Promise.all(writes);
});

// ─── 2. Booking created → SMS confirmation + customer in-app notification ─────

export const onBookingCreated = onDocumentCreated(
  { document: 'bookings/{bookingId}', secrets: [msg91Key] },
  async event => {
    const booking = event.data?.data();
    if (!booking) return;

    const bookingId  = event.data?.id ?? '';
    const bookingRef = (booking.bookingRef as string | undefined) ?? bookingId.slice(-6).toUpperCase();
    const svc        = serviceLabel((booking.serviceIds ?? []) as string[]);
    const total      = (booking.priceBreakdown?.total ?? 0) as number;
    const dateStr    = fmtDate(booking.scheduledAt as FirebaseFirestore.Timestamp | undefined);
    const customerId = booking.customerId as string | undefined;

    const writes: Promise<unknown>[] = [];

    // In-app notification for authenticated customers
    if (customerId && !customerId.startsWith('phone:')) {
      writes.push(
        pushNotif('customers', customerId, 'booking_confirmed',
          'Booking confirmed',
          `PC-${bookingRef} · ${svc} on ${dateStr}. Pay ₹${total.toLocaleString('en-IN')} at service.`,
          { bookingId },
        ),
      );
    }

    // SMS via MSG91
    const phone = (booking.customerPhone as string | undefined)?.replace(/\D/g, '');
    if (phone && phone.length >= 10) {
      const authKey = msg91Key.value();
      if (!authKey) {
        console.warn('[onBookingCreated] MSG91_AUTH_KEY not set — skipping SMS');
      } else {
        const message = [
          '[Perfect Cleaners] Booking confirmed!',
          `Ref: PC-${bookingRef}.`,
          `${svc} on ${dateStr}.`,
          `Pay ₹${total.toLocaleString('en-IN')} at service.`,
          'Track your booking in the app.',
        ].join(' ');

        const url = new URL('https://api.msg91.com/api/sendhttp.php');
        url.searchParams.set('authkey', authKey);
        url.searchParams.set('mobiles', phone);
        url.searchParams.set('message', message);
        url.searchParams.set('route',   '4');
        url.searchParams.set('sender',  'PCLNRS');
        url.searchParams.set('country', '91');
        url.searchParams.set('unicode', '0');

        writes.push(
          fetch(url.toString())
            .then(r => r.text())
            .then(b => console.log(`[onBookingCreated] SMS →`, b))
            .catch(err => console.error('[onBookingCreated] SMS failed:', err)),
        );
      }
    }

    await Promise.all(writes);
  },
);

// ─── 3. Worker assigned → FCM push + worker in-app notification ───────────────

export const onWorkerAssigned = onDocumentUpdated('bookings/{bookingId}', async event => {
  const before = event.data?.before.data();
  const after  = event.data?.after.data();
  if (!before || !after) return;
  if (before.workerId === after.workerId) return;
  if (after.status !== 'assigned') return;

  const workerId = after.workerId as string | undefined;
  if (!workerId) return;

  const bookingId    = event.params.bookingId;
  const svc          = serviceLabel((after.serviceIds ?? []) as string[]);
  const customer     = (after.customerName ?? 'Customer') as string;
  const address      = [after.address?.line1, after.address?.city].filter(Boolean).join(', ');
  const dateStr      = fmtDate(after.scheduledAt as FirebaseFirestore.Timestamp | undefined);
  const notifBody    = `${svc} for ${customer}${address ? ` · ${address}` : ''}. ${dateStr}.`;

  const writes: Promise<unknown>[] = [];

  // In-app notification
  writes.push(
    pushNotif('workers', workerId, 'job_assigned',
      'New job assigned',
      notifBody,
      { bookingId },
    ),
  );

  // FCM push
  const workerSnap = await db.doc(`workers/${workerId}`).get();
  const fcmToken   = workerSnap.data()?.fcmToken as string | undefined;

  if (fcmToken) {
    writes.push(
      messaging.send({
        token: fcmToken,
        notification: { title: 'New job assigned', body: notifBody },
        data: { bookingId, type: 'job_assigned' },
        android: { priority: 'high', notification: { channelId: 'jobs', sound: 'default' } },
        apns:    { payload: { aps: { sound: 'default', badge: 1 } } },
      })
        .then(() => console.log(`[onWorkerAssigned] FCM sent to ${workerId}`))
        .catch(err => console.error('[onWorkerAssigned] FCM failed:', err)),
    );
  } else {
    console.log(`[onWorkerAssigned] worker ${workerId} has no FCM token`);
  }

  await Promise.all(writes);
});
