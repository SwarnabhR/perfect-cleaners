import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore, adminAuth } from '@/lib/firebase/admin';
import { notifySocietyWorkers } from '@/lib/notify-society-workers';

const PLATFORM_FEE = 50;

// Fallback booking route used when Razorpay is unavailable.
// Creates the booking with paymentStatus:'pending' (pay at service).
// Requires the caller to be the authenticated customer.
export async function POST(req: NextRequest) {
  try {
    const { booking } = await req.json();

    if (!booking?.customerId || !booking?.serviceId) {
      return NextResponse.json({ error: 'Invalid booking payload.' }, { status: 400 });
    }

    const idToken = (req.headers.get('Authorization') ?? '').replace('Bearer ', '').trim();
    if (!idToken) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const decoded = await adminAuth().verifyIdToken(idToken);
    if (decoded.uid !== booking.customerId) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const db       = adminFirestore();
    const fee      = booking.platformFee ?? PLATFORM_FEE;
    const subtotal = booking.price ?? 0;
    const gst      = Math.round(subtotal * 0.18);
    const total    = subtotal + gst + fee;

    const suffix     = String(Math.floor(1000 + Math.random() * 9000));
    const bookingRef = `PC-${suffix}`;

    const bookingDoc = await db.collection('bookings').add({
      bookingRef,
      customerId:    booking.customerId,
      customerName:  booking.customerName,
      customerPhone: `+91${String(booking.customerPhone).replace(/\D/g, '')}`,
      serviceIds:    [booking.serviceId],
      vehicle: {
        id:           'web_booking_vehicle',
        make:         booking.vehicleMake,
        model:        booking.vehicleModel,
        year:         new Date().getFullYear(),
        type:         booking.vehicleType ?? 'sedan',
        registration: (booking.vehiclePlate ?? 'UNKNOWN').toUpperCase(),
        color:        'UNKNOWN',
      },
      status:        'pending',
      scheduledAt:   new Date(booking.scheduledAt),
      address: {
        societyId:   booking.societyId   ?? '',
        societyName: booking.societyName ?? '',
        tower:       booking.tower       ?? null,
        flatNo:      booking.flatNo      ?? '',
        garageNo:    booking.garageNo    ?? null,
        line1:       [booking.flatNo, booking.tower, booking.societyName].filter(Boolean).join(', '),
        pincode:     '',
        coordinates: { latitude: 0, longitude: 0 },
      },
      priceBreakdown:  { subtotal, tax: gst, total },
      paymentStatus:   'pending',
      photos:          { before: [], after: [] },
      createdAt:       new Date(),
      updatedAt:       new Date(),
    });

    // Increment customer's outstanding balance for this pending booking
    db.collection('customers').doc(booking.customerId).update({
      outstandingBalance: FieldValue.increment(total),
    }).catch(err => console.error('[pay-at-service] balance update failed:', err));

    // Increment promo usedCount if applied
    if (booking.promoId) {
      db.collection('promotions').doc(booking.promoId).update({
        usedCount: FieldValue.increment(1),
      }).catch(err => console.error('[pay-at-service] promo increment failed:', err));
    }

    // In-app notification for the customer
    const svc     = (booking.serviceId as string).replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    const dateStr = new Date(booking.scheduledAt).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });

    db.collection('customers').doc(booking.customerId).collection('notifications').add({
      type:      'booking_confirmed',
      title:     'Booking confirmed',
      body:      `${bookingRef} · ${svc} on ${dateStr}. Pay ₹${total.toLocaleString('en-IN')} at service.`,
      read:      false,
      createdAt: FieldValue.serverTimestamp(),
      bookingId: bookingDoc.id,
    }).catch(err => console.error('[pay-at-service] notification failed:', err));

    // Notify workers assigned to this society
    if (booking.societyId) {
      notifySocietyWorkers(booking.societyId, {
        type:      'new_booking',
        title:     'New booking',
        body:      `${bookingRef} · ${svc} on ${dateStr}.`,
        bookingId: bookingDoc.id,
      }).catch(() => {});
    }

    // SMS confirmation (best-effort)
    const phone   = String(booking.customerPhone ?? '').replace(/\D/g, '');
    const authKey = process.env.MSG91_AUTH_KEY;
    if (phone.length >= 10 && authKey) {
      const message = [
        '[Perfect Cleaners] Booking confirmed!',
        `Ref: ${bookingRef}.`,
        `${svc} on ${dateStr}.`,
        `Pay ₹${total.toLocaleString('en-IN')} at service.`,
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
      fetch(url.toString()).catch(() => {});
    }

    return NextResponse.json({ bookingRef, bookingId: bookingDoc.id, total });
  } catch (err: any) {
    console.error('[pay-at-service]', err);
    return NextResponse.json({ error: err?.message ?? 'Server error.' }, { status: 500 });
  }
}
