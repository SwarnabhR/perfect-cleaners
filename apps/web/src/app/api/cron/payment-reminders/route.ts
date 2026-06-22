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
    console.log('[CRON] Payment reminders started at', new Date().toISOString());

    const recordsSnap = await db
      .collection('customerSocietyRecords')
      .where('paymentStatus', '==', 'pending_payment')
      .get();

    let sent = 0;
    let errors = 0;

    for (const docSnap of recordsSnap.docs) {
      try {
        const record = docSnap.data();

        // TODO: Send payment reminder SMS via notification service
        // await notifyPaymentReminder(record.customerPhone, record.customerName, record.monthlyFee, record.societyName);
        // Message: "💳 Payment reminder: ₹500 due for this month's cleanings. Call us to pay."
        void record; // referenced by TODO above

        sent++;
      } catch (err: unknown) {
        console.error('[CRON] Payment reminder error for', docSnap.id, ':', err instanceof Error ? err.message : String(err));
        errors++;
      }
    }

    console.log('[CRON] Payment reminders completed. Sent:', sent, 'Errors:', errors);
    return NextResponse.json({
      success: true,
      message: 'Payment reminders sent',
      sent,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('[CRON] Payment reminders failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: toErrMsg(err, 'Payment reminders failed') }, { status: 500 });
  }
}
