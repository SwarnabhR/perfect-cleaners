import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore, adminAuth } from '@/lib/firebase/admin';
import { resyncUpcomingSessions } from '@/lib/resync-sessions';

interface RescheduledSlot { date: unknown; fromTime?: number; toTime: number; }

function tsToDate(v: unknown): Date {
  const val = v as { toDate?: () => Date } | Date | string | number | undefined;
  return val && typeof (val as { toDate?: () => Date }).toDate === 'function'
    ? (val as { toDate: () => Date }).toDate()
    : new Date(val as string | number | Date);
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export async function POST(req: NextRequest) {
  try {
    const bearer = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/, '');
    if (!bearer) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const decoded = await adminAuth().verifyIdToken(bearer);

    const body     = await req.json();
    const recordId = body.recordId as string | undefined;
    const action   = body.action as string | undefined;
    if (!recordId || !action) {
      return NextResponse.json({ error: 'recordId and action are required.' }, { status: 400 });
    }

    const db      = adminFirestore();
    const recRef  = db.collection('customerSocietyRecords').doc(recordId);
    const recSnap = await recRef.get();
    if (!recSnap.exists) return NextResponse.json({ error: 'Record not found.' }, { status: 404 });
    const record = recSnap.data()!;
    if (record.customerId !== decoded.uid) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };

    if (action === 'toggleSkip') {
      const dateRaw = body.date as string | undefined;
      if (!dateRaw) return NextResponse.json({ error: 'date is required.' }, { status: 400 });
      const date = new Date(dateRaw);
      const skipDates = ((record.skipDates as unknown[] | undefined) ?? []).map(tsToDate);
      const alreadySkipped = skipDates.some(d => isSameCalendarDay(d, date));
      update.skipDates = alreadySkipped
        ? skipDates.filter(d => !isSameCalendarDay(d, date))
        : [...skipDates, date];

    } else if (action === 'permanentTime') {
      const hour = body.hour as number | undefined;
      if (typeof hour !== 'number') return NextResponse.json({ error: 'hour is required.' }, { status: 400 });
      update.permanentTime = hour;

    } else if (action === 'reschedule') {
      const dateRaw = body.date as string | undefined;
      const toTime  = body.toTime as number | undefined;
      if (!dateRaw || typeof toTime !== 'number') {
        return NextResponse.json({ error: 'date and toTime are required.' }, { status: 400 });
      }
      const date = new Date(dateRaw);
      const existingSlots = ((record.rescheduledSlots as RescheduledSlot[] | undefined) ?? []);
      const existing = existingSlots.find(s => isSameCalendarDay(tsToDate(s.date), date));
      update.rescheduledSlots = existing
        ? existingSlots.map(s => isSameCalendarDay(tsToDate(s.date), date) ? { ...s, toTime } : s)
        : [...existingSlots, { date, fromTime: (record.permanentTime as number | undefined) ?? (record.preferredCleaningTime as number | undefined) ?? 9, toTime }];

    } else if (action === 'clearReschedule') {
      const dateRaw = body.date as string | undefined;
      if (!dateRaw) return NextResponse.json({ error: 'date is required.' }, { status: 400 });
      const date = new Date(dateRaw);
      const existingSlots = ((record.rescheduledSlots as RescheduledSlot[] | undefined) ?? []);
      update.rescheduledSlots = existingSlots.filter(s => !isSameCalendarDay(tsToDate(s.date), date));

    } else {
      return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
    }

    await recRef.update(update);
    await resyncUpcomingSessions(recordId, record.societyId as string, record.tower as string);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('[customer/unavailability]', err);
    return NextResponse.json({ error: toErrMsg(err) }, { status: 500 });
  }
}
