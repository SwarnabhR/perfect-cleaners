import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminFirestore } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const { name, phone, idToken } = await req.json();

    if (!name?.trim() || !phone || !idToken) {
      return NextResponse.json({ error: 'name, phone, and idToken are required.' }, { status: 400 });
    }

    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      return NextResponse.json({ error: 'Phone must be a 10-digit Indian number.' }, { status: 400 });
    }

    // Verify the caller is an admin
    const decoded = await adminAuth().verifyIdToken(idToken);
    const adminSnap = await adminFirestore()
      .collection('admins').doc(decoded.uid).get();
    if (!adminSnap.exists) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const formattedPhone = `+91${digits}`;

    // Find or create Firebase Auth user for this phone
    let uid: string;
    try {
      const existing = await adminAuth().getUserByPhoneNumber(formattedPhone);
      uid = existing.uid;
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        const created = await adminAuth().createUser({ phoneNumber: formattedPhone });
        uid = created.uid;
      } else {
        throw e;
      }
    }

    const db = adminFirestore();
    const workerRef = db.collection('workers').doc(uid);
    const snap = await workerRef.get();

    const customerRef = db.collection('customers').doc(uid);

    if (snap.exists) {
      // Worker already exists — update name/phone only
      await workerRef.update({ name: name.trim(), phone: formattedPhone });
      // Ensure the customer doc has role: 'worker' (may have been missing)
      await customerRef.set({ role: 'worker', name: name.trim(), phone: formattedPhone }, { merge: true });
      return NextResponse.json({ uid, updated: true });
    }

    // Create the workers document
    await workerRef.set({
      id:                   uid,
      name:                 name.trim(),
      phone:                formattedPhone,
      isOnline:             false,
      totalJobs:            0,
      carsCompletedToday:   0,
      earnings:             { today: 0, week: 0, month: 0 },
      createdAt:            FieldValue.serverTimestamp(),
    });

    // Write customers/{uid} with role:'worker' so the mobile app routes to the
    // worker tab group when this phone number signs in.
    await customerRef.set({
      name:      name.trim(),
      phone:     formattedPhone,
      role:      'worker',
      vehicles:  [],
      createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({ uid, created: true });
  } catch (err: unknown) {
    console.error('[create-worker]', err);
    return NextResponse.json({ error: toErrMsg(err) }, { status: 500 });
  }
}
