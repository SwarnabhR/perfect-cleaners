import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import {
  onDocumentCreated,
  onDocumentUpdated,
} from 'firebase-functions/v2/firestore';
import { defineSecret } from 'firebase-functions/params';

initializeApp();

const db          = getFirestore();
const messaging   = getMessaging();
const msg91Key    = defineSecret('MSG91_AUTH_KEY');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function serviceLabel(serviceIds: string[]): string {
  return (serviceIds[0] ?? 'service')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function fmtDate(ts: FirebaseFirestore.Timestamp | undefined): string {
  if (!ts) return '';
  const d = ts.toDate();
  return d.toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── 1. Job complete → update worker earnings ─────────────────────────────────
//
// Fires whenever a booking document is updated.
// When status transitions to 'done', credits the assigned worker's
// earnings (today / week / month) and increments their totalJobs counter.

export const onJobComplete = onDocumentUpdated('bookings/{bookingId}', async event => {
  const before = event.data?.before.data();
  const after  = event.data?.after.data();
  if (!before || !after) return;

  // Only act on the done transition
  if (before.status === after.status || after.status !== 'done') return;

  const workerId = after.workerId as string | undefined;
  if (!workerId) return;

  const earned = (after.priceBreakdown?.total ?? 0) as number;

  await db.doc(`workers/${workerId}`).update({
    totalJobs:        FieldValue.increment(1),
    'earnings.today': FieldValue.increment(earned),
    'earnings.week':  FieldValue.increment(earned),
    'earnings.month': FieldValue.increment(earned),
    updatedAt:        FieldValue.serverTimestamp(),
  });
});

// ─── 2. Booking created → SMS confirmation to customer ────────────────────────
//
// Fires on every new booking document.
// Sends a transactional SMS to the customer via MSG91.
//
// NOTE: In India, transactional SMS must use a DLT-registered sender ID and
// pre-approved template. Register the template at https://msg91.com/dlt and
// set the template ID + sender ID in the MSG91 dashboard. Set the
// MSG91_AUTH_KEY secret via:  firebase functions:secrets:set MSG91_AUTH_KEY

export const onBookingCreated = onDocumentCreated(
  { document: 'bookings/{bookingId}', secrets: [msg91Key] },
  async event => {
    const booking = event.data?.data();
    if (!booking) return;

    const phone = (booking.customerPhone as string | undefined)?.replace(/\D/g, '');
    if (!phone || phone.length < 10) return;

    const bookingRef  = (booking.bookingRef as string | undefined) ?? event.data?.id.slice(-6).toUpperCase();
    const svc         = serviceLabel((booking.serviceIds ?? []) as string[]);
    const total       = (booking.priceBreakdown?.total ?? 0) as number;
    const dateStr     = fmtDate(booking.scheduledAt as FirebaseFirestore.Timestamp | undefined);

    const message = [
      `[Perfect Cleaners] Booking confirmed!`,
      `Ref: PC-${bookingRef}.`,
      `${svc} on ${dateStr}.`,
      `Pay ₹${total.toLocaleString('en-IN')} at service.`,
      `Track your booking in the app.`,
    ].join(' ');

    const authKey = msg91Key.value();
    if (!authKey) {
      console.warn('[onBookingCreated] MSG91_AUTH_KEY secret not set — skipping SMS');
      return;
    }

    const url = new URL('https://api.msg91.com/api/sendhttp.php');
    url.searchParams.set('authkey',  authKey);
    url.searchParams.set('mobiles',  phone);
    url.searchParams.set('message',  message);
    url.searchParams.set('route',    '4');       // transactional route
    url.searchParams.set('sender',   'PCLNRS'); // 6-char DLT sender ID
    url.searchParams.set('country',  '91');
    url.searchParams.set('unicode',  '0');

    try {
      const res = await fetch(url.toString());
      const body = await res.text();
      console.log(`[onBookingCreated] SMS sent to ${phone}:`, body);
    } catch (err: unknown) {
      console.error('[onBookingCreated] SMS failed:', err);
    }
  },
);

// ─── 3. Worker assigned → FCM push notification to worker ────────────────────
//
// Fires whenever a booking is updated.
// When a workerId is newly set and status becomes 'assigned', sends a
// push notification to the worker's registered FCM device token.
// The token is written to workers/{uid}.fcmToken by the useFCM hook.

export const onWorkerAssigned = onDocumentUpdated('bookings/{bookingId}', async event => {
  const before = event.data?.before.data();
  const after  = event.data?.after.data();
  if (!before || !after) return;

  // Only act when a workerId is being set for the first time on this booking
  if (before.workerId === after.workerId) return;
  if (after.status !== 'assigned') return;

  const workerId = after.workerId as string | undefined;
  if (!workerId) return;

  const workerSnap = await db.doc(`workers/${workerId}`).get();
  const fcmToken   = workerSnap.data()?.fcmToken as string | undefined;
  if (!fcmToken) {
    console.log(`[onWorkerAssigned] worker ${workerId} has no FCM token — skipping push`);
    return;
  }

  const bookingId   = event.params.bookingId;
  const svc         = serviceLabel((after.serviceIds ?? []) as string[]);
  const customer    = (after.customerName ?? 'Customer') as string;
  const address     = [after.address?.line1, after.address?.city].filter(Boolean).join(', ');
  const dateStr     = fmtDate(after.scheduledAt as FirebaseFirestore.Timestamp | undefined);

  try {
    await messaging.send({
      token: fcmToken,
      notification: {
        title: 'New job assigned',
        body:  `${svc} for ${customer}${address ? ` · ${address}` : ''}. ${dateStr}.`,
      },
      data: {
        bookingId,
        type: 'job_assigned',
      },
      android: {
        priority: 'high',
        notification: { channelId: 'jobs', sound: 'default' },
      },
      apns: {
        payload: { aps: { sound: 'default', badge: 1 } },
      },
    });
    console.log(`[onWorkerAssigned] push sent to worker ${workerId}`);
  } catch (err: unknown) {
    console.error('[onWorkerAssigned] FCM send failed:', err);
  }
});
