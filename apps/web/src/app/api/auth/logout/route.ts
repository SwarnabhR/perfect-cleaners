import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const idToken = (req.headers.get('Authorization') ?? '').replace('Bearer ', '').trim();

    if (!idToken) {
      return NextResponse.json({ error: 'No token provided.' }, { status: 401 });
    }

    // Verify and decode the token
    const decoded = await adminAuth().verifyIdToken(idToken);
    const uid = decoded.uid;

    // Revoke all refresh tokens for this user
    // This invalidates all sessions and forces re-authentication
    await adminAuth().revokeRefreshTokens(uid);

    return NextResponse.json({ ok: true, message: 'Successfully logged out.' });
  } catch (err: any) {
    console.error('[logout]', err.message);
    // Even if revocation fails, client has signed out, so return success
    return NextResponse.json({ ok: true });
  }
}
