import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '@/lib/firebase/admin';
import { notifySocietyWorkers } from '@/lib/notify-society-workers';

// Called fire-and-forget from BookingFlow after a direct (pay-at-service) booking
// is written to Firestore. Sends the booking_confirmed in-app notification and
// SMS — the same side-effects that /api/payment/verify handles for Razorpay bookings.
export async function POST(req: NextRequest) {
  try {
    const { bookingId, bookingRef, customerId, customerPhone, serviceId, total, scheduledAt } =
      await req.json();

    const svc = ((serviceId ?? 'service') as string)
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase());

    const dateStr = scheduledAt
      ? new Date(scheduledAt).toLocaleDateString('en-IN', {
          weekday: 'short', day: 'numeric', month: 'short',
          hour: '2-digit', minute: '2-digit',
        })
      : '';

    const db = adminFirestore();

    // In-app notification for authenticated customers
    if (customerId && !customerId.startsWith('phone:')) {
      db.collection('customers').doc(customerId).collection('notifications').add({
        type:      'booking_confirmed',
        title:     'Booking confirmed',
        body:      `${bookingRef} · ${svc}${dateStr ? ` on ${dateStr}` : ''}. Pay ₹${(total ?? 0).toLocaleString('en-IN')} at service.`,
        read:      false,
        createdAt: FieldValue.serverTimestamp(),
        bookingId,
      }).catch(err => console.error('[booking/confirm] notification failed:', err));
    }

    // Notify workers assigned to this society (best-effort)
    if (bookingId) {
      db.collection('bookings').doc(bookingId).get().then(snap => {
        const societyId = snap.data()?.address?.societyId;
        if (societyId) {
          notifySocietyWorkers(societyId, {
            type:      'new_booking',
            title:     'New booking',
            body:      `${bookingRef} · ${svc}${dateStr ? ` on ${dateStr}` : ''}.`,
            bookingId,
          }).catch(() => {});
        }
      }).catch(() => {});
    }

    // SMS via MSG91 (best-effort)
    const phone   = (customerPhone ?? '').replace(/\D/g, '');
    const authKey = process.env.MSG91_AUTH_KEY;
    if (phone.length >= 10 && authKey) {
      const message = [
        '[Perfect Cleaners] Booking confirmed!',
        `Ref: ${bookingRef}.`,
        `${svc}${dateStr ? ` on ${dateStr}` : ''}.`,
        `Pay ₹${(total ?? 0).toLocaleString('en-IN')} at service.`,
        'Track your booking in the app.',
      ].join(' ');
      const url = new URL('https://api.msg91.com/api/sendhttp.php');
      url.searchParams.set('authkey', authKey);
      url.searchParams.set('mobiles', phone);
      url.searchParams.set('message', message);
      url.searchParams.set('route',   '4');
      url.searchParams.set('sender',  'PCLNRS');
      url.searchParams.set('country', '91');
      url.searchParams.set('unicode', '0');
      fetch(url.toString())
        .then(r => r.text())
        .then(b => console.log('[booking/confirm] SMS →', b))
        .catch(err => console.error('[booking/confirm] SMS failed:', err));
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[booking/confirm]', err);
    return NextResponse.json({ error: err?.message ?? 'Server error.' }, { status: 500 });
  }
}
