import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

/**
 * Monthly billing cron job
 * Runs on 1st of every month
 *
 * For each active customer:
 * 1. Create billing record
 * 2. Set payment status to "pending_payment"
 * 3. Set next billing date to 1st of next month
 * 4. Send payment reminder SMS
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const secret = req.nextUrl.searchParams.get('secret');
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Monthly billing started at', new Date().toISOString());

    // Get all active customer enrollments
    const recordsSnap = await getDocs(
      query(collection(db, 'customerSocietyRecords'), where('status', '==', 'active'))
    );

    let processed = 0;
    let errors = 0;

    for (const docSnap of recordsSnap.docs) {
      try {
        const record = docSnap.data();

        // Create billing record
        const billingId = `${docSnap.id}_${new Date().toISOString().split('T')[0]}`;
        await setDoc(doc(db, 'billingRecords', billingId), {
          customerRecordId: docSnap.id,
          customerId: record.customerId,
          societyId: record.societyId,
          societyName: record.societyName,
          tower: record.tower,
          amount: record.monthlyFee,
          status: 'pending',
          billedAt: serverTimestamp(),
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Due in 5 days
        } as any);

        // Update payment status to pending_payment
        await setDoc(
          doc(db, 'customerSocietyRecords', docSnap.id),
          {
            paymentStatus: 'pending_payment',
            nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next month
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        // TODO: Send payment reminder SMS via notification service
        // await notifyPaymentReminder(
        //   record.customerPhone,
        //   record.customerName,
        //   record.monthlyFee,
        //   record.societyName
        // );

        processed++;
      } catch (err: unknown) {
        console.error('[CRON] Billing error for', docSnap.id, ':', err instanceof Error ? err.message : String(err));
        errors++;
      }
    }

    console.log('[CRON] Monthly billing completed. Processed:', processed, 'Errors:', errors);

    return NextResponse.json(
      {
        success: true,
        message: 'Monthly billing completed',
        processed,
        errors,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error('[CRON] Monthly billing failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: 'Billing failed', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
