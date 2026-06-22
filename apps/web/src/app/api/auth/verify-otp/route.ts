import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const { phone, msg91Token } = await req.json();

    if (!/^[6-9]\d{9}$/.test(phone) || !msg91Token) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    // Verify the MSG91 access token server-side
    let verifyData: any;
    try {
      const verifyRes = await fetch(
        'https://control.msg91.com/api/v5/widget/verifyAccessToken',
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            authkey:        process.env.MSG91_AUTH_KEY,
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
      return NextResponse.json(
        { error: `OTP check failed: ${verifyData?.message ?? verifyData?.type ?? 'unknown'}` },
        { status: 400 },
      );
    }

    // Bind the verified mobile to the submitted phone — prevents a valid OTP
    // token for phone A being resubmitted to authenticate as phone B.
    // MSG91 returns `mobile` with the country code (e.g. "919876543210") on success.
    // Only block when the field is present AND doesn't match; log when it's absent
    // so we know if MSG91 changes their response shape.
    const returnedMobile = String(verifyData.mobile ?? '').replace(/\D/g, '');
    const expectedMobile = `91${phone}`;
    if (returnedMobile && returnedMobile !== expectedMobile) {
      console.error('[verify-otp] phone binding mismatch:', { returnedMobile, expectedMobile });
      return NextResponse.json({ error: 'Phone verification failed.' }, { status: 400 });
    }
    if (!returnedMobile) {
      console.warn('[verify-otp] MSG91 did not return mobile — phone binding not enforced for this request');
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
        console.error('[verify-otp] Firebase Admin user lookup/create failed:', e);
        return NextResponse.json({ error: `Firebase user error: ${e.message}` }, { status: 500 });
      }
    }

    const customToken = await adminAuth().createCustomToken(uid, { phone: `+91${phone}` });
    return NextResponse.json({ token: customToken });

  } catch (err: unknown) {
    console.error('[verify-otp] Unhandled error:', err);
    return NextResponse.json({ error: toErrMsg(err, 'Server error. Please try again.') }, { status: 500 });
  }
}
