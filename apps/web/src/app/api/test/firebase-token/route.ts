import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminFirestore } from '@/lib/firebase/admin';

// Dev-only — disabled in production.
// Returns a Firebase custom token for any UID so Playwright tests can
// authenticate without going through the MSG91 OTP flow.
//
// Used by:
//   tests/fixtures/worker.ts, tests/lib/auth-bypass.ts   → TEST_WORKER_UID
//   tests/fixtures/customer.ts, tests/lib/auth-bypass.ts → TEST_CUSTOMER_UID
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production.' }, { status: 403 });
  }

  const uid = req.nextUrl.searchParams.get('uid');
  if (!uid) {
    return NextResponse.json({ error: 'uid query param required.' }, { status: 400 });
  }

  try {
    // WorkerAuthProvider gates on user.phoneNumber (queries `workers` by
    // phone, not by uid) — a bare custom token has no phoneNumber attached,
    // so worker sign-in would never resolve. If uid is a real workers/{uid}
    // doc (the documented convention for TEST_WORKER_UID), stamp its phone
    // onto the Auth user first so the provider's lookup succeeds. No-op for
    // customer UIDs, which are gated by uid alone.
    const workerDoc = await adminFirestore().collection('workers').doc(uid).get();
    const phone = workerDoc.exists ? (workerDoc.data()?.phone as string | undefined) : undefined;
    if (phone) {
      try {
        await adminAuth().updateUser(uid, { phoneNumber: phone });
      } catch (e: unknown) {
        if ((e as { code?: string })?.code === 'auth/user-not-found') {
          await adminAuth().createUser({ uid, phoneNumber: phone });
        } else {
          throw e;
        }
      }
    }

    const token = await adminAuth().createCustomToken(uid);
    return NextResponse.json({ token });
  } catch (err: unknown) {
    return NextResponse.json({ error: toErrMsg(err, 'Failed to create token.') }, { status: 500 });
  }
}
