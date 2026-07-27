import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '@/lib/firebase/admin';
import { sendAndStoreSMS } from '@/lib/notify-sms';

// This cron runs on the 1st of the month (per cron-jobs.org) and bills every
// active record whose billingFrequency (undefined = 'monthly') says it's due:
// 'monthly' bills every run same as always; 'one-time' bills exactly once,
// ever; 'per-day' meters actual cleaningLogs since the last bill instead of a
// flat fee. nextBillingDate is informational only for 'monthly', so it should
// always point at the *next* 1st, not "30 days from now" (which drifts off
// the 1st if the cron doesn't fire at exactly midnight).
function firstOfNextMonth(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

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
    let notified = 0;
    let errors = 0;

    for (const docSnap of recordsSnap.docs) {
      try {
        const record    = docSnap.data();
        const frequency = (record.billingFrequency as 'monthly' | 'one-time' | 'per-day' | undefined) ?? 'monthly';

        // One-time customers are billed exactly once, ever — once billed, every
        // later run is a complete no-op for them (no reads beyond this check).
        if (frequency === 'one-time' && record.oneTimeBilled) {
          continue;
        }

        // Deep-clean is an optional flat add-on. Looked up live rather than
        // denormalized onto the customer record, so an admin fee change takes
        // effect next cycle without needing to touch every enrolled customer.
        let deepCleanFee = 0;
        if (record.deepCleanEnabled) {
          const towerSlug   = String(record.tower ?? '').trim().replace(/\s+/g, '-');
          const configSnap  = await db.collection('societyBillingConfig').doc(`${record.societyId}_${towerSlug}`).get();
          deepCleanFee = (configSnap.data()?.deepClean?.fee as number | undefined) ?? 0;
        }

        let amount: number;
        if (frequency === 'per-day') {
          // monthlyFee is the per-clean rate for per-day towers (see SocietyBillingConfig).
          const periodStart = (record.lastBilledDate?.toDate?.() as Date | undefined)
            ?? (record.createdAt?.toDate?.() as Date | undefined)
            ?? new Date(0);
          const logsSnap = await db.collection('cleaningLogs')
            .where('customerId', '==', record.customerId)
            .where('societyId',  '==', record.societyId)
            .where('cleanedAt',  '>=', periodStart)
            .get();
          amount = (record.monthlyFee as number) * logsSnap.size + deepCleanFee;
        } else {
          amount = (record.monthlyFee as number) + deepCleanFee;
        }

        // Metered customer with nothing to charge this cycle — advance the
        // metering window but don't create a ₹0 bill or nag them for payment.
        if (frequency === 'per-day' && amount === 0) {
          await db.collection('customerSocietyRecords').doc(docSnap.id).set(
            {
              lastBilledDate:  FieldValue.serverTimestamp(),
              nextBillingDate: firstOfNextMonth(),
              updatedAt:       FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
          processed++;
          continue;
        }

        const billingId = `${docSnap.id}_${new Date().toISOString().split('T')[0]}`;
        await db.collection('billingRecords').doc(billingId).set({
          customerRecordId: docSnap.id,
          customerId:       record.customerId,
          societyId:        record.societyId,
          societyName:      record.societyName,
          tower:            record.tower,
          amount,
          status:           'pending',
          billedAt:         FieldValue.serverTimestamp(),
          dueDate:          new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        });

        await db.collection('customerSocietyRecords').doc(docSnap.id).set(
          {
            paymentStatus:   'pending_payment',
            pendingAmount:   amount,
            lastBilledDate:  FieldValue.serverTimestamp(),
            nextBillingDate: firstOfNextMonth(),
            ...(frequency === 'one-time' ? { oneTimeBilled: true } : {}),
            updatedAt:       FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        const phone = record.customerPhone as string | undefined;
        if (phone) {
          const result = await sendAndStoreSMS({
            type: 'payment_reminder',
            recipientPhone: phone,
            recipientName: (record.customerName as string | undefined) ?? 'there',
            data: {
              customerId: record.customerId,
              amount,
              societyName: record.societyName,
            },
          });
          if (result.success) notified++;
        }

        processed++;
      } catch (err: unknown) {
        console.error('[CRON] Billing error for', docSnap.id, ':', err instanceof Error ? err.message : String(err));
        errors++;
      }
    }

    console.log('[CRON] Monthly billing completed. Processed:', processed, 'Notified:', notified, 'Errors:', errors);
    return NextResponse.json({
      success: true,
      message: 'Monthly billing completed',
      processed,
      notified,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('[CRON] Monthly billing failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: toErrMsg(err, 'Billing failed') }, { status: 500 });
  }
}
