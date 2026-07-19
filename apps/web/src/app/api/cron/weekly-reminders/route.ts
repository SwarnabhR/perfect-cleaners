import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';
import { sendAndStoreSMS } from '@/lib/notify-sms';

const DEFAULT_SCHEDULE = 'Mon, Wed, Fri · 9:00 AM';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const db = adminFirestore();
    console.log('[CRON] Weekly reminders started at', new Date().toISOString());

    const recordsSnap = await db
      .collection('customerSocietyRecords')
      .where('status', '==', 'active')
      .get();

    // Cache tower schedule lookups — many records share the same societyId+tower.
    const scheduleCache = new Map<string, string>();
    async function scheduleFor(societyId: string, tower: string): Promise<string> {
      const key = `${societyId}_${tower}`;
      if (scheduleCache.has(key)) return scheduleCache.get(key)!;
      const configSnap = await db.collection('societyBillingConfig').doc(key).get();
      const schedule = (configSnap.data()?.cleaningSchedule as string | undefined) ?? DEFAULT_SCHEDULE;
      scheduleCache.set(key, schedule);
      return schedule;
    }

    let sent = 0;
    let skipped = 0;
    let noPhone = 0;
    let errors = 0;

    for (const docSnap of recordsSnap.docs) {
      try {
        const record = docSnap.data();

        const today = new Date();
        const weekSkips = (record.skipDates as any[] | undefined)?.filter(d => {
          const skipDate = new Date(d.toDate?.() || d);
          return (
            skipDate >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) &&
            skipDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
          );
        }) ?? [];

        if (weekSkips.length > 0) {
          skipped++;
          continue;
        }

        const phone = record.customerPhone as string | undefined;
        if (!phone) {
          // Bulk-imported residents with no phone on file can't be reached by SMS.
          noPhone++;
          continue;
        }

        const schedule = await scheduleFor(record.societyId as string, record.tower as string);

        const result = await sendAndStoreSMS({
          type: 'weekly_reminder',
          recipientPhone: phone,
          recipientName: (record.customerName as string | undefined) ?? 'there',
          data: {
            customerId: record.customerId,
            schedule,
            societyName: record.societyName,
          },
        });

        if (result.success) sent++; else errors++;
      } catch (err: unknown) {
        console.error('[CRON] Weekly reminder error for', docSnap.id, ':', err instanceof Error ? err.message : String(err));
        errors++;
      }
    }

    console.log('[CRON] Weekly reminders completed. Sent:', sent, 'Skipped:', skipped, 'No phone:', noPhone, 'Errors:', errors);
    return NextResponse.json({
      success: true,
      message: 'Weekly reminders sent',
      sent,
      skipped,
      noPhone,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('[CRON] Weekly reminders failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: toErrMsg(err, 'Weekly reminders failed') }, { status: 500 });
  }
}
