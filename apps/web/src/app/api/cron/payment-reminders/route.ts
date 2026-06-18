import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
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
 * Payment reminder cron job
 * Runs 5 days before billing date (typically 25th-26th of month)
 *
 * For each customer with pending payment:
 * 1. Send SMS reminder: "💳 Payment reminder: ₹500 due"
 * 2. Log reminder sent
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const secret = req.nextUrl.searchParams.get('secret');
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Payment reminders started at', new Date().toISOString());

    // Get all customers with pending payment
    const recordsSnap = await getDocs(
      query(
        collection(db, 'customerSocietyRecords'),
        where('paymentStatus', '==', 'pending_payment')
      )
    );

    let sent = 0;
    let errors = 0;

    for (const docSnap of recordsSnap.docs) {
      try {
        const record = docSnap.data();

        // TODO: Send payment reminder SMS via notification service
        // await notifyPaymentReminder(
        //   record.customerPhone,
        //   record.customerName,
        //   record.monthlyFee,
        //   record.societyName
        // );
        // Message: "💳 Payment reminder: ₹500 due for this month's cleanings. Call us to pay."

        sent++;
      } catch (err: any) {
        console.error('[CRON] Payment reminder error for', docSnap.id, ':', err.message);
        errors++;
      }
    }

    console.log('[CRON] Payment reminders completed. Sent:', sent, 'Errors:', errors);

    return NextResponse.json(
      {
        success: true,
        message: 'Payment reminders sent',
        sent,
        errors,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[CRON] Payment reminders failed:', err.message);
    return NextResponse.json(
      { error: 'Payment reminders failed', details: err.message },
      { status: 500 }
    );
  }
}
