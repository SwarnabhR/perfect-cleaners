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

    } else if (action === 'deepClean') {
      if (typeof body.enabled !== 'boolean') {
        return NextResponse.json({ error: 'enabled must be a boolean.' }, { status: 400 });
      }
      update.deepCleanEnabled = body.enabled;
      if (!body.enabled) {
        update.deepCleanDay = FieldValue.delete();
        update.deepCleanOneTimeScheduledDate = FieldValue.delete();
      } else {
        const frequency = body.frequency;
        if (!['weekly', 'daily', 'one-time'].includes(frequency)) {
          return NextResponse.json({ error: 'frequency must be weekly, daily, or one-time.' }, { status: 400 });
        }
        if (frequency === 'one-time' && (typeof body.date !== 'string' || !body.date)) {
          return NextResponse.json({ error: 'A date is required for a one-time deep clean.' }, { status: 400 });
        }
        const configSnap = record.societyId && record.tower
          ? await db.collection('societyBillingConfig').where('societyId', '==', record.societyId).where('tower', '==', record.tower).limit(1).get()
          : null;
        const config = configSnap?.docs[0]?.data();
        const fee = typeof record.deepCleanFee === 'number' && record.deepCleanFee > 0
          ? record.deepCleanFee : (config?.deepClean?.fee as number | undefined) ?? 0;
        if (fee <= 0 && record.deepCleanAvailable !== true) return NextResponse.json({ error: 'Deep cleaning is not currently available for this customer. Contact the society manager.' }, { status: 400 });
        update.deepCleanFrequency = frequency;
        if (fee > 0 && typeof record.deepCleanFee !== 'number') update.deepCleanFee = fee;
        if (frequency === 'weekly' && typeof body.day === 'number' && Number.isInteger(body.day) && body.day >= 0 && body.day <= 6) {
          update.deepCleanDay = body.day;
        }
        if (frequency === 'one-time') {
          const date = new Date(body.date);
          if (Number.isNaN(date.getTime()) || date < new Date(new Date().setHours(0, 0, 0, 0))) {
            return NextResponse.json({ error: 'A valid current or future date is required.' }, { status: 400 });
          }
          update.deepCleanOneTimeScheduledDate = date;
          update.deepCleanOneTimeBilled = false;
        } else {
          update.deepCleanOneTimeScheduledDate = FieldValue.delete();
          update.deepCleanOneTimeBilled = FieldValue.delete();
        }
      }

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
