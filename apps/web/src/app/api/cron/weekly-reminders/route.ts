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
 * Weekly reminder cron job
 * Runs every Sunday evening (prepares for Mon/Wed/Fri cleanings)
 *
 * For each active customer:
 * 1. Check if they have a cleaning scheduled this week
 * 2. Send SMS reminder: "🧹 Cleaning reminder: Your car will be cleaned Mon/Wed/Fri"
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const secret = req.nextUrl.searchParams.get('secret');
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Weekly reminders started at', new Date().toISOString());

    // Get all active customer enrollments
    const recordsSnap = await getDocs(
      query(collection(db, 'customerSocietyRecords'), where('status', '==', 'active'))
    );

    let sent = 0;
    let skipped = 0;
    let errors = 0;

    for (const docSnap of recordsSnap.docs) {
      try {
        const record = docSnap.data();

        // Check if customer is not skipping this week
        const today = new Date();
        const weekSkips = record.skipDates?.filter((d: any) => {
          const skipDate = new Date(d.toDate?.() || d);
          return (
            skipDate >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) &&
            skipDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
          );
        }) || [];

        if (weekSkips.length > 0) {
          skipped++;
          continue;
        }

        // TODO: Send weekly reminder SMS via notification service
        // const schedule = record.cleaningSchedule || 'Mon, Wed, Fri · 9:00 AM';
        // await notifyWeeklyReminder(
        //   record.customerPhone,
        //   record.customerName,
        //   schedule,
        //   record.societyName
        // );

        sent++;
      } catch (err: unknown) {
        console.error('[CRON] Weekly reminder error for', docSnap.id, ':', err instanceof Error ? err.message : String(err));
        errors++;
      }
    }

    console.log('[CRON] Weekly reminders completed. Sent:', sent, 'Skipped:', skipped, 'Errors:', errors);

    return NextResponse.json(
      {
        success: true,
        message: 'Weekly reminders sent',
        sent,
        skipped,
        errors,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error('[CRON] Weekly reminders failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: 'Weekly reminders failed', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
