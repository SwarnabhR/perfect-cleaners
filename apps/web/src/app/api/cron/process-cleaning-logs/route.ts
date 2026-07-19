import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore, adminMessaging } from '@/lib/firebase/admin';

// Runs every 5 minutes via cron-jobs.org.
// Picks up cleaning logs that haven't been billed yet, increments the
// customer's outstanding balance, writes a transaction, and sends an FCM push.
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const db = adminFirestore();

  const snap = await db
    .collection('cleaningLogs')
    .where('billed', '==', false)
    .limit(100)
    .get();

  if (snap.empty) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  let processed = 0;
  const errors: string[] = [];

  for (const logDoc of snap.docs) {
    const log         = logDoc.data();
    const logId       = logDoc.id;
    const customerId  = log.customerId  as string | undefined;
    const servicePrice = (log.servicePrice as number | undefined) ?? 0;

    if (!customerId) {
      // Mark billed so it doesn't keep re-processing
      await logDoc.ref.update({ billed: true }).catch(() => {});
      continue;
    }

    try {
      const writes: Promise<unknown>[] = [];

      // ── Billing ──────────────────────────────────────────────────────────
      if (servicePrice > 0) {
        writes.push(
          db.doc(`customers/${customerId}`).update({
            outstandingBalance: FieldValue.increment(servicePrice),
          }),
        );
        writes.push(
          db.collection('customers').doc(customerId)
            .collection('transactions')
            .add({
              type:      'charge',
              amount:    servicePrice,
              label:     `${String(log.serviceType || 'Exterior').charAt(0).toUpperCase()}${String(log.serviceType || 'exterior').slice(1)} wash · ${log.vehicleRegistration ?? ''}`,
              societyId: log.societyId,
              logId,
              createdAt: FieldValue.serverTimestamp(),
            }),
        );
      }

      // Always mark billed so this log is never processed again
      writes.push(logDoc.ref.update({ billed: true }));

      // ── In-app notification ───────────────────────────────────────────────
      const reg         = (log.vehicleRegistration as string | undefined) ?? 'your vehicle';
      const make        = (log.vehicleMake  as string | undefined) ?? '';
      const model       = (log.vehicleModel as string | undefined) ?? '';
      const society     = (log.societyName  as string | undefined) ?? 'your society';
      const workerName  = (log.workerName   as string | undefined) ?? 'our team';
      const cleanedAt   = log.cleanedAt?.toDate?.() as Date | undefined;
      const timeStr     = cleanedAt
        ? cleanedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        : 'just now';

      const vehicleLabel = [make, model].filter(Boolean).join(' ') || reg;
      const notifTitle   = `${reg} is clean ✓`;
      const notifBody    = `${vehicleLabel} at ${society} was cleaned at ${timeStr} by ${workerName}.`;

      writes.push(
        db.collection('customers').doc(customerId)
          .collection('notifications')
          .add({
            type:               'car_cleaned',
            title:              notifTitle,
            body:               notifBody,
            read:               false,
            createdAt:          FieldValue.serverTimestamp(),
            logId,
            vehicleRegistration: reg,
          }),
      );

      await Promise.all(writes);

      // ── FCM push (best-effort, outside the main writes) ───────────────────
      const customerSnap = await db.doc(`customers/${customerId}`).get();
      const fcmToken     = customerSnap.data()?.fcmToken as string | undefined;

      if (fcmToken) {
        await adminMessaging().send({
          token:        fcmToken,
          notification: { title: notifTitle, body: notifBody },
          data:         { logId, type: 'car_cleaned', vehicleRegistration: reg },
          android:      { priority: 'high', notification: { channelId: 'cleaning', sound: 'default' } },
          apns:         { payload: { aps: { sound: 'default', badge: 1 } } },
        })
          .then(() => logDoc.ref.update({ notificationSent: true }))
          .catch(err => console.error(`[process-cleaning-logs] FCM failed for ${customerId}:`, err));
      }

      processed++;
    } catch (err: unknown) {
      errors.push(`${logId}: ${err instanceof Error ? err.message : String(err)}`);
      console.error(`[process-cleaning-logs] error for ${logId}:`, err);
    }
  }

  return NextResponse.json({ ok: true, processed, errors });
}
