import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

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

    let sent = 0;
    let skipped = 0;
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

        // TODO: Send weekly reminder SMS via notification service
        // const schedule = record.cleaningSchedule || 'Mon, Wed, Fri · 9:00 AM';
        // await notifyWeeklyReminder(record.customerPhone, record.customerName, schedule, record.societyName);

        sent++;
      } catch (err: unknown) {
        console.error('[CRON] Weekly reminder error for', docSnap.id, ':', err instanceof Error ? err.message : String(err));
        errors++;
      }
    }

    console.log('[CRON] Weekly reminders completed. Sent:', sent, 'Skipped:', skipped, 'Errors:', errors);
    return NextResponse.json({
      success: true,
      message: 'Weekly reminders sent',
      sent,
      skipped,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('[CRON] Weekly reminders failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: toErrMsg(err, 'Weekly reminders failed') }, { status: 500 });
  }
}
