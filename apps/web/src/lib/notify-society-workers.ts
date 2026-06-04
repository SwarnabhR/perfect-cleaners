import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore, adminMessaging } from './firebase/admin';

interface WorkerNotification {
  type: string;
  title: string;
  body: string;
  bookingId?: string;
}

// Looks up a society's assigned workers and sends each one an in-app
// notification plus an FCM push. All writes are best-effort.
export async function notifySocietyWorkers(
  societyId: string,
  notif: WorkerNotification,
): Promise<void> {
  if (!societyId) return;
  try {
    const db = adminFirestore();
    const societySnap = await db.collection('societies').doc(societyId).get();
    if (!societySnap.exists) return;

    const workerIds: string[] = societySnap.data()?.assignedWorkerIds ?? [];
    if (workerIds.length === 0) return;

    const workerSnaps = await Promise.all(
      workerIds.map(wid => db.collection('workers').doc(wid).get()),
    );

    await Promise.all(
      workerSnaps.map(async snap => {
        if (!snap.exists) return;
        const wid      = snap.id;
        const fcmToken = snap.data()?.fcmToken as string | undefined;

        db.collection('workers').doc(wid).collection('notifications').add({
          type:      notif.type,
          title:     notif.title,
          body:      notif.body,
          read:      false,
          createdAt: FieldValue.serverTimestamp(),
          ...(notif.bookingId ? { bookingId: notif.bookingId } : {}),
        }).catch(err => console.error('[notify-society-workers] notif write failed:', err));

        if (fcmToken) {
          adminMessaging().send({
            token:        fcmToken,
            notification: { title: notif.title, body: notif.body },
            data:         { type: notif.type, ...(notif.bookingId ? { bookingId: notif.bookingId } : {}) },
            android:      { priority: 'high', notification: { channelId: 'jobs', sound: 'default' } },
            apns:         { payload: { aps: { sound: 'default', badge: 1 } } },
          }).catch(err => console.error('[notify-society-workers] FCM failed:', err));
        }
      }),
    );
  } catch (err) {
    console.error('[notify-society-workers]', err);
  }
}
