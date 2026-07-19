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
    console.log('[CRON] Generate sessions started at', new Date().toISOString());

    const societiesSnap = await db.collection('societyBillingConfig').get();
    let sessionsCreated = 0;
    let errors = 0;

    for (const societyDoc of societiesSnap.docs) {
      try {
        const config = societyDoc.data();
        const { societyId, tower, cleaningSchedule, cleaningDays } = config;

        const weekdays: number[] = Array.isArray(cleaningDays) && cleaningDays.length > 0
          ? cleaningDays
          : parseWeekdaysFromSchedule(cleaningSchedule as string);

        const customersSnap = await db
          .collection('customerSocietyRecords')
          .where('societyId', '==', societyId)
          .where('tower', '==', tower)
          .where('status', '==', 'active')
          .get();

        const today = new Date();
        const nextWeekStart = new Date(today);
        nextWeekStart.setDate(today.getDate() + ((1 - today.getDay() + 7) % 7));

        const cleaningDates = getCleaningDatesForNextWeek(nextWeekStart, weekdays);

        for (const cleaningDate of cleaningDates) {
          try {
            // Doc IDs become URL path segments (worker links to /session/<id>) — a raw
            // space in the tower name survives as literal "%20" through Next.js's
            // dynamic route params instead of being decoded back, which 404s. Slug it.
            const towerSlug = String(tower).trim().replace(/\s+/g, '-');
            const sessionId = `${societyId}_${towerSlug}_${cleaningDate.toISOString().split('T')[0]}`;

            // Skip if a session already exists — never overwrite an active or completed session
            const existing = await db.collection('cleaningSessions').doc(sessionId).get();
            if (existing.exists) continue;

            const cars = customersSnap.docs
              .map(docSnap => {
                const customer = docSnap.data();
                const skipDate = (customer.skipDates as any[] | undefined)?.find(d => {
                  const skip = new Date(d.toDate?.() || d);
                  return skip.toDateString() === cleaningDate.toDateString();
                });
                if (skipDate) return null;

                // Unset/empty preferredCleaningDays means "every day the tower is cleaned".
                const preferredDays = customer.preferredCleaningDays as number[] | undefined;
                if (preferredDays?.length && !preferredDays.includes(cleaningDate.getDay())) return null;

                // Check for a one-off rescheduled slot for this specific date
                const rescheduledSlots = (customer.rescheduledSlots as any[] | undefined) ?? [];
                const rescheduled = rescheduledSlots.find((s: any) => {
                  const slotDate = new Date(s.date?.toDate?.() || s.date);
                  return slotDate.toDateString() === cleaningDate.toDateString();
                });
                const preferredTime = rescheduled
                  ? rescheduled.toTime
                  : (customer.permanentTime || customer.preferredCleaningTime || 9);

                return {
                  customerId:    customer.customerId,
                  customerName:  customer.customerName || '',
                  unitNumber:    customer.unitNumber || '',
                  carPlate:      customer.cars?.[0]?.plate  || '',
                  carMake:       customer.cars?.[0]?.make   || '',
                  carModel:      customer.cars?.[0]?.model  || '',
                  preferredTime,
                  status:        'pending',
                };
              })
              .filter(Boolean);

            await db.collection('cleaningSessions').doc(sessionId).set({
              societyId,
              societyName:   config.societyName,
              tower,
              scheduledDate: cleaningDate,
              status:        'scheduled',
              cars,
              totalCars:     cars.length,
              completedCars: 0,
              skippedCars:   0,
              workerIds:     [],
              workerNames:   [],
              createdAt:     FieldValue.serverTimestamp(),
              updatedAt:     FieldValue.serverTimestamp(),
            });

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
    return NextResponse.json({
      success: true,
      message: 'Cleaning sessions generated',
      sessionsCreated,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('[CRON] Generate sessions failed:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: toErrMsg(err, 'Session generation failed') }, { status: 500 });
  }
}

function parseWeekdaysFromSchedule(scheduleStr: string): number[] {
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const daysMatch = scheduleStr?.match(/^(.*?)\s*·/);
  const daysStr = daysMatch ? daysMatch[1] : (scheduleStr || 'Mon, Wed, Fri');
  return daysStr
    .split(',')
    .map(d => dayMap[d.trim()])
    .filter((d): d is number => d !== undefined);
}

function getCleaningDatesForNextWeek(startDate: Date, weekdays: number[]): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    if (weekdays.includes(date.getDay())) dates.push(new Date(date));
  }
  return dates;
}
