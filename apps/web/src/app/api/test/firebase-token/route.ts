import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

// Dev-only — disabled in production.
// Returns a Firebase custom token for any UID so Playwright tests can
// authenticate without going through the MSG91 OTP flow.
//
// Used by:
//   tests/worker-setup.spec.ts   → TEST_WORKER_UID
//   tests/customer-setup.spec.ts → TEST_CUSTOMER_UID
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production.' }, { status: 403 });
  }

  const uid = req.nextUrl.searchParams.get('uid');
  if (!uid) {
    return NextResponse.json({ error: 'uid query param required.' }, { status: 400 });
  }

  try {
    const token = await adminAuth().createCustomToken(uid);
    return NextResponse.json({ token });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Failed to create token.' }, { status: 500 });
  }
}
