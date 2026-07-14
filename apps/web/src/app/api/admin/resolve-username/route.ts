import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

// Admins sign in with a username, which is just a friendly wrapper around
// their real Firebase Auth email. The `admins` collection isn't client-readable
// pre-auth (see firestore.rules), so this lookup has to happen server-side
// with the Admin SDK before the client can call signInWithEmailAndPassword.
export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();
    const normalized = typeof username === 'string' ? username.trim().toLowerCase() : '';

    if (!normalized) {
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 400 });
    }

    const snap = await adminFirestore()
      .collection('admins')
      .where('username', '==', normalized)
      .limit(1)
      .get();

    if (snap.empty) {
      // Same message as a wrong-password failure — don't reveal whether the username exists.
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 404 });
    }

    const email = snap.docs[0].data().email;
    return NextResponse.json({ email });
  } catch (err: unknown) {
    console.error('[resolve-username]', err);
    return NextResponse.json({ error: toErrMsg(err) }, { status: 500 });
  }
}
