import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '@/lib/firebase/admin';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const db = adminFirestore();
    console.log('[CRON] Monthly billing started at', new Date().toISOString());

    const recordsSnap = await db
      .collection('customerSocietyRecords')
      .where('status', '==', 'active')
      .get();

    let processed = 0;
    let errors = 0;

    for (const docSnap of recordsSnap.docs) {
      try {
        const record = docSnap.data();

        const billingId = `${docSnap.id}_${new Date().toISOString().split('T')[0]}`;
        await db.collection('billingRecords').doc(billingId).set({
          customerRecordId: docSnap.id,
          customerId:       record.customerId,
          societyId:        record.societyId,
          societyName:      record.societyName,
          tower:            record.tower,
          amount:           record.monthlyFee,
          status:           'pending',
          billedAt:         FieldValue.serverTimestamp(),
          dueDate:          new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        });

        await db.collection('customerSocietyRecords').doc(docSnap.id).set(
          {
            paymentStatus:   'pending_payment',
            nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            updatedAt:       FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        // TODO: Send payment reminder SMS via notification service
        // await notifyPaymentReminder(record.customerPhone, record.customerName, record.monthlyFee, record.societyName);

        processed++;
      } catch (err: unknown) {
        console.error('[CRON] Billing error for', docSnap.id, ':', err instanceof Error ? err.message : String(err));
        errors++;
      }
    }

    console.log('[CRON] Monthly billing completed. Processed:', processed, 'Errors:', errors);
    return NextResponse.json({
      success: true,
      message: 'Monthly billing completed',
      processed,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('[CRON] Monthly billing failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: toErrMsg(err, 'Billing failed') }, { status: 500 });
  }
}
