import { NextRequest, NextResponse } from 'next/server';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
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

// Tower → Cleaning days mapping
// Example: "Mon, Wed, Fri" → generate for those days
const CLEANING_SCHEDULE_MAP: Record<string, number[]> = {
  'Mon, Wed, Fri': [1, 3, 5], // Monday=1, Wednesday=3, Friday=5 in weekday order
  'Mon, Thu': [1, 4],
  'Tue, Thu, Sat': [2, 4, 6],
  'Daily': [0, 1, 2, 3, 4, 5, 6],
};

/**
 * Generate cleaning sessions for next week
 * Runs every Sunday evening (prepares Mon-Fri sessions)
 *
 * For each society + tower:
 * 1. Get billing config to know cleaning days
 * 2. Get all active customers in that tower
 * 3. Create CleaningSession for each cleaning day
 * 4. Add customers to the session (excluding those who skipped)
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const secret = req.nextUrl.searchParams.get('secret');
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Generate sessions started at', new Date().toISOString());

    // Get all societies
    const societiesSnap = await getDocs(collection(db, 'societyBillingConfig'));
    let sessionsCreated = 0;
    let errors = 0;

    for (const societyDoc of societiesSnap.docs) {
      try {
        const config = societyDoc.data();
        const { societyId, tower, cleaningSchedule } = config;

        // Parse cleaning days from schedule (e.g., "Mon, Wed, Fri · 9:00 AM")
        const daysMatch = cleaningSchedule.match(/^(.*?)\s*·/);
        const daysStr = daysMatch ? daysMatch[1] : 'Mon, Wed, Fri';

        // Get active customers in this tower
        const customersSnap = await getDocs(
          query(
            collection(db, 'customerSocietyRecords'),
            where('societyId', '==', societyId),
            where('tower', '==', tower),
            where('status', '==', 'active')
          )
        );

        // Generate session for each day in the schedule
        const today = new Date();
        const nextWeekStart = new Date(today);
        nextWeekStart.setDate(today.getDate() + ((1 - today.getDay() + 7) % 7)); // Next Monday

        // Map cleaning days (e.g., "Mon, Wed, Fri") to actual dates
        const cleaningDates = getCleaningDatesForNextWeek(nextWeekStart, daysStr);

        for (const cleaningDate of cleaningDates) {
          try {
            // Build car list for this session
            const cars = customersSnap.docs
              .map(docSnap => {
                const customer = docSnap.data();

                // Check if customer skipped this date
                const skipDate = customer.skipDates?.find((d: any) => {
                  const skip = new Date(d.toDate?.() || d);
                  const clean = new Date(cleaningDate);
                  return skip.toDateString() === clean.toDateString();
                });

                if (skipDate) return null;

                return {
                  customerId: customer.customerId,
                  carPlate: customer.cars?.[0]?.plate || '',
                  carMake: customer.cars?.[0]?.make || '',
                  carModel: customer.cars?.[0]?.model || '',
                  preferredTime: customer.permanentTime || customer.preferredCleaningTime || 9,
                  status: 'pending',
                };
              })
              .filter(Boolean);

            // Create session
            const sessionId = `${societyId}_${tower}_${cleaningDate.toISOString().split('T')[0]}`;
            await setDoc(doc(db, 'cleaningSessions', sessionId), {
              societyId,
              societyName: config.societyName,
              tower,
              scheduledDate: cleaningDate,
              status: 'scheduled',
              cars,
              totalCars: cars.length,
              completedCars: 0,
              skippedCars: 0,
              workerIds: [],
              workerNames: [],
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            } as any);

            sessionsCreated++;
          } catch (err: unknown) {
            console.error('[CRON] Session creation error:', err instanceof Error ? err.message : String(err));
            errors++;
          }
        }
      } catch (err: unknown) {
        console.error('[CRON] Society processing error:', err instanceof Error ? err.message : String(err));
        errors++;
      }
    }

    console.log('[CRON] Generate sessions completed. Created:', sessionsCreated, 'Errors:', errors);

    return NextResponse.json(
      {
        success: true,
        message: 'Cleaning sessions generated',
        sessionsCreated,
        errors,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error('[CRON] Generate sessions failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: 'Session generation failed', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

/**
 * Parse cleaning schedule string and return actual dates for next week
 * Example: "Mon, Wed, Fri" → [Monday_date, Wednesday_date, Friday_date]
 */
function getCleaningDatesForNextWeek(startDate: Date, scheduleStr: string): Date[] {
  const dates: Date[] = [];

  // Extract day names (e.g., "Mon, Wed, Fri" → ["Mon", "Wed", "Fri"])
  const dayNames = scheduleStr.split(',').map(d => d.trim());

  // Map to day of week (0=Sunday, 1=Monday, etc.)
  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  // Get the weekdays
  const weekdays = dayNames.map(name => dayMap[name]).filter(d => d !== undefined);

  // Generate dates for each weekday in the current + next week
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    if (weekdays.includes(date.getDay())) {
      dates.push(new Date(date));
    }
  }

  return dates;
}
