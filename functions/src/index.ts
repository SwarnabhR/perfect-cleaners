import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import {
  onDocumentCreated,
  onDocumentUpdated,
} from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
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

// ─── 4. Society cleaning → FCM push + in-app notification to resident ─────────
//
// Triggered when a worker writes a cleaningLog document (marks a society car
// as done). Sends a push notification to the resident with:
//   • vehicle registration + make/model
//   • time of clean
//   • society name
//
// The FCM token is stored on the customer document as `fcmToken` (written
// by the useFCM hook in the mobile app when the user registers for push).

export const onCleaningLogCreated = onDocumentCreated(
  'cleaningLogs/{logId}',
  async event => {
    const log = event.data?.data();
    if (!log) return;

    const customerId  = log.customerId  as string | undefined;
    const logId       = event.data?.id  ?? '';

    if (!customerId) {
      console.warn('[onCleaningLogCreated] no customerId on log', logId);
      return;
    }

    const reg       = (log.vehicleRegistration as string | undefined) ?? 'your vehicle';
    const make      = (log.vehicleMake  as string | undefined) ?? '';
    const model     = (log.vehicleModel as string | undefined) ?? '';
    const society   = (log.societyName  as string | undefined) ?? 'your society';
    const worker    = (log.workerName   as string | undefined) ?? 'our team';
    const cleanedAt = (log.cleanedAt as FirebaseFirestore.Timestamp | undefined)?.toDate();

    const timeStr = cleanedAt
      ? cleanedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      : 'just now';

    const vehicleLabel = [make, model].filter(Boolean).join(' ') || reg;
    const notifTitle   = `${reg} is clean ✓`;
    const notifBody    = `${vehicleLabel} at ${society} was cleaned at ${timeStr} by ${worker}.`;

    const writes: Promise<unknown>[] = [];

    // In-app notification (always)
    writes.push(
      pushNotif('customers', customerId, 'car_cleaned',
        notifTitle, notifBody,
        { logId, vehicleRegistration: reg },
      ),
    );

    // FCM push to the resident's device
    const customerSnap = await db.doc(`customers/${customerId}`).get();
    const fcmToken     = customerSnap.data()?.fcmToken as string | undefined;

    if (fcmToken) {
      writes.push(
        messaging.send({
          token: fcmToken,
          notification: { title: notifTitle, body: notifBody },
          data: { logId, type: 'car_cleaned', vehicleRegistration: reg },
          android: {
            priority: 'high',
            notification: { channelId: 'cleaning', sound: 'default' },
          },
          apns: { payload: { aps: { sound: 'default', badge: 1 } } },
        })
          .then(() => {
            // Mark notification as sent on the log document
            return db.doc(`cleaningLogs/${logId}`).update({ notificationSent: true });
          })
          .catch(err => console.error('[onCleaningLogCreated] FCM failed:', err)),
      );
    } else {
      console.log(`[onCleaningLogCreated] customer ${customerId} has no FCM token`);
    }

    await Promise.all(writes);
  },
);

// ─── 5. Earnings reset — runs daily at midnight IST ───────────────────────────
//
// Resets worker earnings counters on the correct cadence:
//   • earnings.today  → reset every day
//   • earnings.week   → reset every Monday
//   • earnings.month  → reset on the 1st of each month
//
// Firestore batch writes are capped at 500 docs; the loop handles larger
// worker rosters by flushing a new batch every 499 ops.

export const resetDailyEarnings = onSchedule(
  {
    schedule: '0 0 * * *',   // midnight every day
    timeZone: 'Asia/Kolkata',
  },
  async () => {
    const now            = new Date();
    const isMonday       = now.getDay()  === 1;
    const isFirstOfMonth = now.getDate() === 1;

    const fields: Record<string, unknown> = { 'earnings.today': 0 };
    if (isMonday)       fields['earnings.week']  = 0;
    if (isFirstOfMonth) fields['earnings.month'] = 0;

    console.log('[resetEarnings] resetting:', Object.keys(fields).join(', '));

    const snap = await db.collection('workers').get();
    if (snap.empty) { console.log('[resetEarnings] no workers'); return; }

    // Chunk into batches of 499 (Firestore limit is 500 ops per batch)
    const CHUNK = 499;
    for (let i = 0; i < snap.docs.length; i += CHUNK) {
      const batch = db.batch();
      snap.docs.slice(i, i + CHUNK).forEach(doc => batch.update(doc.ref, fields));
      await batch.commit();
    }

    console.log(`[resetEarnings] done — ${snap.docs.length} workers reset`);
  },
);
