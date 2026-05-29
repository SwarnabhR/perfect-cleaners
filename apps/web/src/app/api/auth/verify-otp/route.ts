import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminFirestore } from '@/lib/firebase/admin';

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  try {
    const { phone, otp } = await req.json();

    if (!/^[6-9]\d{9}$/.test(phone) || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const db  = adminFirestore();
    const ref = db.collection('otpVerifications').doc(phone);
    const doc = await ref.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'No code found for this number. Please request a new one.' },
        { status: 400 },
      );
    }

    const data = doc.data()!;

    if (Date.now() > data.expiresAt) {
      await ref.delete();
      return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 400 });
    }

    if (data.attempts >= MAX_ATTEMPTS) {
      await ref.delete();
      return NextResponse.json(
        { error: 'Too many incorrect attempts. Please request a new code.' },
        { status: 429 },
      );
    }

    if (data.otp !== otp) {
      await ref.update({ attempts: data.attempts + 1 });
      const left = MAX_ATTEMPTS - data.attempts - 1;
      return NextResponse.json(
        { error: `Incorrect code. ${left} attempt${left !== 1 ? 's' : ''} remaining.` },
        { status: 400 },
      );
    }

    // OTP correct — delete record
    await ref.delete();

    // Find or create Firebase user by phone number
    let uid: string;
    try {
      const existing = await adminAuth().getUserByPhoneNumber(`+91${phone}`);
      uid = existing.uid;
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        const newUser = await adminAuth().createUser({ phoneNumber: `+91${phone}` });
        uid = newUser.uid;
      } else {
        throw e;
      }
    }

    const customToken = await adminAuth().createCustomToken(uid, { phone: `+91${phone}` });
    return NextResponse.json({ token: customToken });
  } catch (err: any) {
    console.error('[verify-otp]', err);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
