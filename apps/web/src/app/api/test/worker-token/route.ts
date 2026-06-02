import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

// Dev-only endpoint — disabled in production.
// Returns a Firebase custom token for the given worker UID so Playwright
// tests can sign in without going through the MSG91 OTP flow.
//
// Usage: GET /api/test/worker-token?uid=<workerUid>
// Set TEST_WORKER_UID in .env.local to the UID of a real worker document.
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production.' }, { status: 403 });
  }

  const uid = req.nextUrl.searchParams.get('uid') ?? process.env.TEST_WORKER_UID;
  if (!uid) {
    return NextResponse.json(
      { error: 'uid query param or TEST_WORKER_UID env var required.' },
      { status: 400 },
    );
  }

  try {
    const token = await adminAuth().createCustomToken(uid);
    return NextResponse.json({ token });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Failed to create token.' }, { status: 500 });
  }
}
