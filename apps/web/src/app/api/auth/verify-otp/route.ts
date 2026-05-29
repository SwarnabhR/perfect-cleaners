import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const { phone, msg91Token } = await req.json();

    if (!/^[6-9]\d{9}$/.test(phone) || !msg91Token) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    // Verify the MSG91 access token server-side
    const verifyRes = await fetch(
      'https://control.msg91.com/api/v5/widget/verifyAccessToken',
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authkey:        process.env.MSG91_AUTH_KEY!,
          'access-token': msg91Token,
        }),
      },
    );
    const verifyData = await verifyRes.json();

    if (verifyData.type !== 'success') {
      return NextResponse.json(
        { error: 'OTP verification failed. Please try again.' },
        { status: 400 },
      );
    }

    // Find or create the Firebase Auth user for this phone number
    let uid: string;
    try {
      const existing = await adminAuth().getUserByPhoneNumber(`+91${phone}`);
      uid = existing.uid;
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        const created = await adminAuth().createUser({ phoneNumber: `+91${phone}` });
        uid = created.uid;
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
