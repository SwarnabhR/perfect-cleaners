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
      .get();

    if (recordSnap.empty) {
      return NextResponse.json({ status: null });
    }
    // Session IDs use the scheduled calendar date as YYYY-MM-DD at midnight;
    // calculate the key in IST so this works during 00:00–05:29 India time on
    // UTC-hosted deployments too.
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const part = (type: string) => parts.find(value => value.type === type)?.value ?? '';
    const todayIso = `${part('year')}-${part('month')}-${part('day')}`;
    const sessionSnaps = await Promise.all(recordSnap.docs.map(recordDoc => {
      const record = recordDoc.data();
      const towerSlug = String(record.tower ?? '').trim().replace(/\s+/g, '-');
      return db.collection('cleaningSessions').doc(`${record.societyId}_${towerSlug}_${todayIso}`).get();
    }));
    const cars = sessionSnaps.filter(snap => snap.exists).flatMap(snap => (snap.data()?.cars as Record<string, unknown>[] | undefined) ?? []);
    const car = cars.find(c => c.customerId === customerId);

    if (!car) {
      return NextResponse.json({ status: null });
    }

    const services = (car.services as Record<string, { status?: string; cleanedAt?: { toDate?: () => Date } }> | undefined) ?? {};
    const wash = services.wash;
    const deepClean = services.deepClean;
    const status = car.unavailable ? 'skipped'
      : wash?.status === 'done' && deepClean?.status === 'done' ? 'done'
        : wash?.status === 'done' || deepClean?.status === 'done' ? 'partially_done'
          : wash?.status ?? deepClean?.status ?? car.status ?? 'pending';
    const cleanedAt = wash?.status === 'done' ? wash.cleanedAt : deepClean?.cleanedAt ?? car.cleanedAt;

    return NextResponse.json({
      status,
      preferredTime: car.preferredTime ?? null,
      services: { wash: wash?.status ?? null, deepClean: deepClean?.status ?? null },
      cleanedAt:     (cleanedAt as { toDate?: () => Date } | undefined)?.toDate?.()?.toISOString() ?? null,
    });
  } catch (err: unknown) {
    console.error('[session/today/GET]', err);
    return NextResponse.json({ error: toErrMsg(err) }, { status: 500 });
  }
}
