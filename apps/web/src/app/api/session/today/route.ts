import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore, adminAuth } from '@/lib/firebase/admin';

// Lets a signed-in customer see just their own car's status for today's
// cleaning session, without exposing the raw cleaningSessions doc (which also
// carries every other resident's name/unit/plate for that tower — customers
// have no Firestore read access to that collection, and this endpoint must
// not leak it either).
export async function GET(req: NextRequest) {
  try {
    const bearer = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/, '');
    if (!bearer) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const decoded    = await adminAuth().verifyIdToken(bearer);
    const customerId = decoded.uid;

    const db = adminFirestore();
    const recordSnap = await db.collection('customerSocietyRecords')
      .where('customerId', '==', customerId)
      .limit(1)
      .get();

    if (recordSnap.empty) {
      return NextResponse.json({ status: null });
    }
    const record = recordSnap.docs[0].data();

    // Same deterministic id the schedule builder and generate-sessions cron use.
    const towerSlug   = String(record.tower ?? '').trim().replace(/\s+/g, '-');
    const todayIso    = new Date().toISOString().split('T')[0];
    const sessionId   = `${record.societyId}_${towerSlug}_${todayIso}`;
    const sessionSnap = await db.collection('cleaningSessions').doc(sessionId).get();

    if (!sessionSnap.exists) {
      return NextResponse.json({ status: null });
    }

    const cars = (sessionSnap.data()!.cars as Record<string, unknown>[] | undefined) ?? [];
    const car  = cars.find(c => c.customerId === customerId);

    if (!car) {
      return NextResponse.json({ status: null });
    }

    return NextResponse.json({
      status:        car.status ?? 'pending',
      preferredTime: car.preferredTime ?? null,
      cleanedAt:     (car.cleanedAt as { toDate?: () => Date } | undefined)?.toDate?.()?.toISOString() ?? null,
    });
  } catch (err: unknown) {
    console.error('[session/today/GET]', err);
    return NextResponse.json({ error: toErrMsg(err) }, { status: 500 });
  }
}
