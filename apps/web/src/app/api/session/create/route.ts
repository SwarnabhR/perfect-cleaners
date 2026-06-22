import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore, adminMessaging, adminAuth } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const {
      societyId, societyName, tower,
      workerId, workerName,
      scheduledDate,   // ISO string
      totalCars,
    } = await req.json();

    if (!societyId || !workerId || !scheduledDate || !totalCars) {
      return NextResponse.json({ error: 'societyId, workerId, scheduledDate and totalCars are required.' }, { status: 400 });
    }

    // Only admins may create cleaning sessions
    const idToken = (req.headers.get('Authorization') ?? '').replace('Bearer ', '').trim();
    if (!idToken) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const decoded = await adminAuth().verifyIdToken(idToken);
    const db      = adminFirestore();
    const adminSnap = await db.collection('admins').doc(decoded.uid).get();
    if (!adminSnap.exists) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }
    const ref = await db.collection('cleaningSessions').add({
      societyId,
      societyName,
      ...(tower ? { tower } : {}),
      workerId,
      workerName,
      scheduledDate: new Date(scheduledDate),
      status:        'scheduled',
      totalCars:     Number(totalCars),
      completedCars: 0,
      createdAt:     FieldValue.serverTimestamp(),
    });

    // Notify the assigned worker in-app + FCM
    const dateStr = new Date(scheduledDate).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
    });
    const location = [tower, societyName].filter(Boolean).join(' · ');
    const body     = `${location}${dateStr ? ` on ${dateStr}` : ''}. ${totalCars} cars to clean.`;

    db.collection('workers').doc(workerId).collection('notifications').add({
      type:      'session_assigned',
      title:     'Cleaning session assigned',
      body,
      read:      false,
      createdAt: FieldValue.serverTimestamp(),
      sessionId: ref.id,
    }).catch(err => console.error('[session/create] notification write failed:', err));

    const workerSnap = await db.doc(`workers/${workerId}`).get();
    const fcmToken   = workerSnap.data()?.fcmToken as string | undefined;
    if (fcmToken) {
      adminMessaging().send({
        token:        fcmToken,
        notification: { title: 'Cleaning session assigned', body },
        data:         { type: 'session_assigned', sessionId: ref.id },
        android:      { priority: 'high', notification: { channelId: 'jobs', sound: 'default' } },
        apns:         { payload: { aps: { sound: 'default', badge: 1 } } },
      }).catch(err => console.error('[session/create] FCM failed:', err));
    }

    return NextResponse.json({ sessionId: ref.id });
  } catch (err: unknown) {
    console.error('[session/create]', err);
    return NextResponse.json({ error: toErrMsg(err) }, { status: 500 });
  }
}
