import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminFirestore } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    const { sessionId, customerId, type, reason } = await req.json() as { sessionId?: string; customerId?: string; type?: 'contact' | 'issue'; reason?: string };
    if (!sessionId || !customerId || !type || (type === 'issue' && !reason)) return NextResponse.json({ error: 'Missing event details.' }, { status: 400 });
    const db = adminFirestore();
    const session = await db.collection('cleaningSessions').doc(sessionId).get();
    const data = session.data();
    const assigned = ((data?.workerIds as string[] | undefined) ?? []).includes(decoded.uid);
    const ownsCar = ((data?.cars as { customerId?: string }[] | undefined) ?? []).some(car => car.customerId === customerId);
    if (!session.exists || !assigned || !ownsCar) return NextResponse.json({ error: 'This job is not assigned to you.' }, { status: 403 });
    await db.collection(type === 'contact' ? 'workerContactEvents' : 'workerIssues').add({
      workerId: decoded.uid, sessionId, customerId, type, ...(reason ? { reason } : {}), createdAt: FieldValue.serverTimestamp(), status: type === 'issue' ? 'open' : 'logged',
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[worker/operations-event]', error);
    return NextResponse.json({ error: 'Unable to record this operational event.' }, { status: 500 });
  }
}
