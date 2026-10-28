import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '@/lib/firebase/admin';
import { sendAndStoreSMS } from '@/lib/notify-sms';
import { runMonitoredCron } from '@/lib/cron-monitor';

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
  return runMonitoredCron(req, 'monthly-billing', async () => {
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
        const baseDue = frequency !== 'one-time' || record.oneTimeBilled !== true;
        const baseCycleKey = new Date().toISOString().slice(0, 7);
        const baseCycleAlreadyBilled = frequency !== 'one-time' && record.lastBillingCycle === baseCycleKey;
        if (baseCycleAlreadyBilled) {
          // A due one-time deep-clean add-on is processed separately below.
          if (!(record.deepCleanEnabled === true && record.deepCleanFrequency === 'one-time' && record.deepCleanOneTimeBilled !== true)) continue;
        }

        // Deep-clean fee belongs to the individual customer plan. Older tower
        // subscriptions continue to fall back to their configured tower fee.
        let deepCleanFee = 0;
        const rawDeepDate = record.deepCleanOneTimeScheduledDate as { toDate?: () => Date } | Date | string | number | undefined;
        const deepDate = rawDeepDate && typeof (rawDeepDate as { toDate?: () => Date }).toDate === 'function'
          ? (rawDeepDate as { toDate: () => Date }).toDate()
          : rawDeepDate ? new Date(rawDeepDate as Date | string | number) : null;
        const oneTimeDeepCleanDue = record.deepCleanEnabled === true
          && record.deepCleanFrequency === 'one-time'
          && record.deepCleanOneTimeBilled !== true
          && !!deepDate && !Number.isNaN(deepDate.getTime()) && deepDate <= new Date();
        if (!baseDue && !oneTimeDeepCleanDue && !(record.deepCleanEnabled && record.deepCleanFrequency !== 'one-time' && !baseCycleAlreadyBilled)) continue;
        if ((record.deepCleanEnabled && record.deepCleanFrequency !== 'one-time') || oneTimeDeepCleanDue) {
          if (typeof record.deepCleanFee === 'number') {
            deepCleanFee = record.deepCleanFee;
          } else {
            const towerSlug   = String(record.tower ?? '').trim().replace(/\s+/g, '-');
            const configSnap  = await db.collection('societyBillingConfig').doc(`${record.societyId}_${towerSlug}`).get();
            deepCleanFee = (configSnap.data()?.deepClean?.fee as number | undefined) ?? 0;
          }
        }

        let baseAmount = 0;
        if (baseDue && !baseCycleAlreadyBilled && frequency === 'per-day') {
          // monthlyFee is the per-clean rate for per-day towers (see SocietyBillingConfig).
          const periodStart = (record.lastBilledDate?.toDate?.() as Date | undefined)
            ?? (record.createdAt?.toDate?.() as Date | undefined)
            ?? new Date(0);
          const logsSnap = await db.collection('cleaningLogs')
            .where('customerId', '==', record.customerId)
            .where('societyId',  '==', record.societyId)
            .where('cleanedAt',  '>=', periodStart)
            .get();
          const washCount = logsSnap.docs.filter(log => log.data().serviceType !== 'deep-clean' && log.data().deepClean !== true).length;
          baseAmount = (record.monthlyFee as number) * washCount;
        } else if (baseDue && !baseCycleAlreadyBilled) {
          baseAmount = (record.monthlyFee as number) || 0;
        }
        const recurringDeepFee = record.deepCleanEnabled === true && record.deepCleanFrequency !== 'one-time' && !baseCycleAlreadyBilled ? deepCleanFee : 0;
        const amount = baseAmount + recurringDeepFee + (oneTimeDeepCleanDue ? deepCleanFee : 0);


        // Metered customer with nothing to charge this cycle — advance the
        // metering window but don't create a ₹0 bill or nag them for payment.
        if (amount === 0) {
          await db.collection('customerSocietyRecords').doc(docSnap.id).set(
            {
              ...(baseDue && !baseCycleAlreadyBilled && frequency === 'per-day' ? { lastBilledDate: FieldValue.serverTimestamp() } : {}),
              ...(baseDue && !baseCycleAlreadyBilled && frequency !== 'one-time' ? { nextBillingDate: firstOfNextMonth() } : {}),
              ...(frequency === 'one-time' && baseDue ? { oneTimeBilled: true } : {}),
              ...(oneTimeDeepCleanDue ? { deepCleanOneTimeBilled: true } : {}),
              ...(frequency !== 'one-time' && baseDue && !baseCycleAlreadyBilled ? { lastBillingCycle: baseCycleKey } : {}),
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
          processed++;
          continue;
        }

        const oneTimeRaw = record.deepCleanOneTimeScheduledDate as { toDate?: () => Date } | Date | string | number | undefined;
        const billingDay = oneTimeDeepCleanDue && (!baseDue || baseCycleAlreadyBilled)
          ? (oneTimeRaw && typeof (oneTimeRaw as { toDate?: () => Date }).toDate === 'function'
            ? (oneTimeRaw as { toDate: () => Date }).toDate()
            : new Date(oneTimeRaw as Date | string | number))
          : new Date();
        const billingId = `${docSnap.id}_${billingDay.toISOString().split('T')[0]}${oneTimeDeepCleanDue ? '_deep' : ''}`;
        await db.collection('billingRecords').doc(billingId).set({
          customerRecordId: docSnap.id,
          customerId:       record.customerId,
          societyId:        record.societyId,
          societyName:      record.societyName,
          tower:            record.tower,
          amount,
          ...(oneTimeDeepCleanDue && (!baseDue || baseCycleAlreadyBilled) ? { serviceType: 'deep-clean', description: 'One-time deep cleaning' } : {}),
          status:           'pending',
          billedAt:         FieldValue.serverTimestamp(),
          dueDate:          new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        });

        await db.collection('customerSocietyRecords').doc(docSnap.id).set(
          {
            paymentStatus:   'pending_payment',
            pendingAmount:   amount,
            ...(baseDue && !baseCycleAlreadyBilled ? { lastBilledDate: FieldValue.serverTimestamp() } : {}),
            ...(baseDue && !baseCycleAlreadyBilled && frequency !== 'one-time' ? { nextBillingDate: firstOfNextMonth() } : {}),
            ...(frequency === 'one-time' && baseDue && !record.oneTimeBilled ? { oneTimeBilled: true } : {}),
            ...(oneTimeDeepCleanDue ? { deepCleanOneTimeBilled: true } : {}),
            ...(frequency !== 'one-time' && baseDue && !baseCycleAlreadyBilled ? { lastBillingCycle: baseCycleKey } : {}),
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
  });
}
