import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';
import { createHash } from 'node:crypto';

// Admins sign in with a username, which is just a friendly wrapper around
// their real Firebase Auth email. The `admins` collection isn't client-readable
// pre-auth (see firestore.rules), so this lookup has to happen server-side
// with the Admin SDK before the client can call signInWithEmailAndPassword.
export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();
    const normalized = typeof username === 'string' ? username.trim().toLowerCase() : '';

    const ip = req.headers.get('x-real-ip')
      ?? req.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim()
      ?? 'unknown';
    const ipKey = createHash('sha256').update(ip).digest('hex').slice(0, 32);
    const now = Date.now();
    const minute = Math.floor(now / 60_000);
    const hour = Math.floor(now / 3_600_000);
    const limitRef = adminFirestore().collection('apiRateLimits').doc(`resolve_username_${ipKey}`);
    const overLimit = await adminFirestore().runTransaction(async transaction => {
      const snap = await transaction.get(limitRef);
      const previous = snap.data();
      const minuteCount = previous?.minute === minute ? (previous.minuteCount as number | undefined) ?? 0 : 0;
      const hourCount = previous?.hour === hour ? (previous.hourCount as number | undefined) ?? 0 : 0;
      if (minuteCount >= 10 || hourCount >= 40) return true;
      transaction.set(limitRef, {
        minute, minuteCount: minuteCount + 1,
        hour, hourCount: hourCount + 1,
        expiresAt: new Date((hour + 2) * 3_600_000),
      });
      return false;
    });
    if (overLimit) return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });

    if (!normalized) {
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
    }

    const snap = await adminFirestore()
      .collection('admins')
      .where('username', '==', normalized)
      .limit(1)
      .get();

    if (snap.empty) {
      // Same message as a wrong-password failure — don't reveal whether the username exists.
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
    }

    const email = snap.docs[0].data().email;
    return NextResponse.json({ email });
  } catch (err: unknown) {
    console.error('[resolve-username]', err);
    return NextResponse.json({ error: toErrMsg(err) }, { status: 500 });
  }
}
