import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const { phone, msg91Token } = await req.json();

    if (!/^[6-9]\d{9}$/.test(phone) || !msg91Token) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const msg91AuthKey = process.env.MSG91_AUTH_KEY;
    if (!msg91AuthKey) {
      console.error('[verify-otp] MSG91_AUTH_KEY is not configured');
      return NextResponse.json({ error: 'Phone verification is temporarily unavailable.' }, { status: 503 });
    }

    // Verify the MSG91 access token server-side
    let verifyData: { type?: string; mobile?: unknown } & Record<string, unknown>;
    try {
      const verifyRes = await fetch(
        'https://control.msg91.com/api/v5/widget/verifyAccessToken',
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            authkey:        msg91AuthKey,
            'access-token': msg91Token,
          }),
        },
      );
      verifyData = await verifyRes.json();
    } catch (fetchErr) {
      console.error('[verify-otp] MSG91 fetch failed:', fetchErr);
      return NextResponse.json({ error: 'Could not reach verification service.' }, { status: 502 });
    }

    if (verifyData?.type !== 'success') {
      console.error('[verify-otp] MSG91 rejected token:', JSON.stringify(verifyData));
      return NextResponse.json({ error: 'OTP verification failed. Please try again.' }, { status: 400 });
    }

    // Bind the verified token to the requested account. A token without a
    // returned phone cannot safely authenticate the submitted number.
    const returnedMobile = String(verifyData.mobile ?? '').replace(/\D/g, '');
    const expectedMobile = `91${phone}`;
    if (!returnedMobile || returnedMobile !== expectedMobile) {
      console.error('[verify-otp] phone binding failed');
      return NextResponse.json({ error: 'Phone verification failed.' }, { status: 400 });
    }

    // Find or create the Firebase Auth user for this phone number
    let uid: string;
    try {
      const existing = await adminAuth().getUserByPhoneNumber(`+91${phone}`);
      uid = existing.uid;
    } catch (e: unknown) {
      if ((e as { code?: string })?.code === 'auth/user-not-found') {
        const created = await adminAuth().createUser({ phoneNumber: `+91${phone}` });
        uid = created.uid;
      } else {
        console.error('[verify-otp] Firebase Admin user lookup/create failed:', e);
        return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 500 });
      }
    }

    const customToken = await adminAuth().createCustomToken(uid, { phone: `+91${phone}` });
    return NextResponse.json({ token: customToken });

  } catch (err: unknown) {
    console.error('[verify-otp] Unhandled error:', err);
    return NextResponse.json({ error: toErrMsg(err, 'Server error. Please try again.') }, { status: 500 });
  }
}
