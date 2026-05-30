"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onWorkerAssigned = exports.onBookingCreated = exports.onJobComplete = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const messaging_1 = require("firebase-admin/messaging");
const firestore_2 = require("firebase-functions/v2/firestore");
const params_1 = require("firebase-functions/params");
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const messaging = (0, messaging_1.getMessaging)();
const msg91Key = (0, params_1.defineSecret)('MSG91_AUTH_KEY');
// ─── Helpers ──────────────────────────────────────────────────────────────────
function serviceLabel(serviceIds) {
    return (serviceIds[0] ?? 'service')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}
function fmtDate(ts) {
    if (!ts)
        return '';
    return ts.toDate().toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short',
        hour: '2-digit', minute: '2-digit',
    });
}
/** Write a notification doc to {collection}/{uid}/notifications/{auto-id}. */
async function pushNotif(collection, uid, type, title, body, extra = {}) {
    await db
        .collection(collection)
        .doc(uid)
        .collection('notifications')
        .add({
        type,
        title,
        body,
        read: false,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
        ...extra,
    });
}
// ─── 1. Job complete → update worker earnings + notify customer ───────────────
exports.onJobComplete = (0, firestore_2.onDocumentUpdated)('bookings/{bookingId}', async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after)
        return;
    if (before.status === after.status || after.status !== 'done')
        return;
    const workerId = after.workerId;
    const customerId = after.customerId;
    const earned = (after.priceBreakdown?.total ?? 0);
    const svc = serviceLabel((after.serviceIds ?? []));
    const bookingId = event.params.bookingId;
    const writes = [];
    // Credit worker earnings
    if (workerId) {
        writes.push(db.doc(`workers/${workerId}`).update({
            totalJobs: firestore_1.FieldValue.increment(1),
            'earnings.today': firestore_1.FieldValue.increment(earned),
            'earnings.week': firestore_1.FieldValue.increment(earned),
            'earnings.month': firestore_1.FieldValue.increment(earned),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        }));
    }
    // Notify customer (only when customerId is a real UID, not phone: fallback)
    if (customerId && !customerId.startsWith('phone:')) {
        writes.push(pushNotif('customers', customerId, 'job_complete', 'Job complete', `Your ${svc} is done. Tap to rate your experience.`, { bookingId }));
    }
    await Promise.all(writes);
});
// ─── 2. Booking created → SMS confirmation + customer in-app notification ─────
exports.onBookingCreated = (0, firestore_2.onDocumentCreated)({ document: 'bookings/{bookingId}', secrets: [msg91Key] }, async (event) => {
    const booking = event.data?.data();
    if (!booking)
        return;
    const bookingId = event.data?.id ?? '';
    const bookingRef = booking.bookingRef ?? bookingId.slice(-6).toUpperCase();
    const svc = serviceLabel((booking.serviceIds ?? []));
    const total = (booking.priceBreakdown?.total ?? 0);
    const dateStr = fmtDate(booking.scheduledAt);
    const customerId = booking.customerId;
    const writes = [];
    // In-app notification for authenticated customers
    if (customerId && !customerId.startsWith('phone:')) {
        writes.push(pushNotif('customers', customerId, 'booking_confirmed', 'Booking confirmed', `PC-${bookingRef} · ${svc} on ${dateStr}. Pay ₹${total.toLocaleString('en-IN')} at service.`, { bookingId }));
    }
    // SMS via MSG91
    const phone = booking.customerPhone?.replace(/\D/g, '');
    if (phone && phone.length >= 10) {
        const authKey = msg91Key.value();
        if (!authKey) {
            console.warn('[onBookingCreated] MSG91_AUTH_KEY not set — skipping SMS');
        }
        else {
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
            url.searchParams.set('route', '4');
            url.searchParams.set('sender', 'PCLNRS');
            url.searchParams.set('country', '91');
            url.searchParams.set('unicode', '0');
            writes.push(fetch(url.toString())
                .then(r => r.text())
                .then(b => console.log(`[onBookingCreated] SMS →`, b))
                .catch(err => console.error('[onBookingCreated] SMS failed:', err)));
        }
    }
    await Promise.all(writes);
});
// ─── 3. Worker assigned → FCM push + worker in-app notification ───────────────
exports.onWorkerAssigned = (0, firestore_2.onDocumentUpdated)('bookings/{bookingId}', async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after)
        return;
    if (before.workerId === after.workerId)
        return;
    if (after.status !== 'assigned')
        return;
    const workerId = after.workerId;
    if (!workerId)
        return;
    const bookingId = event.params.bookingId;
    const svc = serviceLabel((after.serviceIds ?? []));
    const customer = (after.customerName ?? 'Customer');
    const address = [after.address?.line1, after.address?.city].filter(Boolean).join(', ');
    const dateStr = fmtDate(after.scheduledAt);
    const notifBody = `${svc} for ${customer}${address ? ` · ${address}` : ''}. ${dateStr}.`;
    const writes = [];
    // In-app notification
    writes.push(pushNotif('workers', workerId, 'job_assigned', 'New job assigned', notifBody, { bookingId }));
    // FCM push
    const workerSnap = await db.doc(`workers/${workerId}`).get();
    const fcmToken = workerSnap.data()?.fcmToken;
    if (fcmToken) {
        writes.push(messaging.send({
            token: fcmToken,
            notification: { title: 'New job assigned', body: notifBody },
            data: { bookingId, type: 'job_assigned' },
            android: { priority: 'high', notification: { channelId: 'jobs', sound: 'default' } },
            apns: { payload: { aps: { sound: 'default', badge: 1 } } },
        })
            .then(() => console.log(`[onWorkerAssigned] FCM sent to ${workerId}`))
            .catch(err => console.error('[onWorkerAssigned] FCM failed:', err)));
    }
    else {
        console.log(`[onWorkerAssigned] worker ${workerId} has no FCM token`);
    }
    await Promise.all(writes);
});
//# sourceMappingURL=index.js.map