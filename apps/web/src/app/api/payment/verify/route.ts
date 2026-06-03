import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      booking,             // full booking payload from the client
    } = await req.json();

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: 'Payment gateway not configured.' }, { status: 500 });
    }

    // Verify Razorpay HMAC signature
    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: 'Payment signature invalid.' }, { status: 400 });
    }

    // Build booking document (mirrors the Booking type in @pc/firebase)
    const fee      = booking.platformFee ?? 50;
    const subtotal = booking.price ?? 0;
    const total    = subtotal + fee;

    const suffix     = String(Math.floor(1000 + Math.random() * 9000));
    const bookingRef = `PC-${suffix}`;

    const db = adminFirestore();
    const bookingDoc = await db.collection('bookings').add({
      bookingRef,
      customerId:    booking.customerId ?? `phone:${booking.customerPhone}`,
      customerName:  booking.customerName,
      customerPhone: `+91${booking.customerPhone}`,
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
      priceBreakdown: { subtotal, tax: 0, total },
      paymentStatus:  'paid',
      paymentId:      razorpay_payment_id,
      orderId:        razorpay_order_id,
      photos:         { before: [], after: [] },
      createdAt:      new Date(),
      updatedAt:      new Date(),
    });

    // In-app notification for authenticated customers (mirrors onBookingCreated Cloud Function)
    const customerId = booking.customerId;
    if (customerId && !customerId.startsWith('phone:')) {
      const svc     = (booking.serviceId ?? 'service').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      const dateStr = new Date(booking.scheduledAt).toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      });
      db.collection('customers').doc(customerId).collection('notifications').add({
        type:      'booking_confirmed',
        title:     'Booking confirmed',
        body:      `PC-${bookingRef} · ${svc} on ${dateStr}. Pay ₹${total.toLocaleString('en-IN')} at service.`,
        read:      false,
        createdAt: FieldValue.serverTimestamp(),
        bookingId: bookingDoc.id,
      }).catch(err => console.error('[verify-payment] notification write failed:', err));
    }

    // SMS confirmation via MSG91 (best-effort — never blocks the response)
    const phone   = booking.customerPhone?.replace(/\D/g, '');
    const authKey = process.env.MSG91_AUTH_KEY;
    if (phone && phone.length >= 10 && authKey) {
      const message = [
        '[Perfect Cleaners] Booking confirmed!',
        `Ref: ${bookingRef}.`,
        `${(booking.serviceId ?? 'service').replace(/-/g, ' ')}.`,
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
      fetch(url.toString())
        .then(r => r.text())
        .then(b => console.log('[verify-payment] SMS →', b))
        .catch(err => console.error('[verify-payment] SMS failed:', err));
    }

    // Record payment in paymentLogs and update income stats
    const batch = db.batch();
    const logRef = db.collection('paymentLogs').doc();
    batch.set(logRef, {
      bookingId:    bookingDoc.id,
      bookingRef,
      customerId:   booking.customerId ?? `phone:${booking.customerPhone}`,
      customerName: booking.customerName ?? '',
      customerPhone:`+91${booking.customerPhone}`,
      amount:       total,
      type:         'online_booking',
      paidAt:       FieldValue.serverTimestamp(),
    });
    const statsRef = db.collection('stats').doc('income');
    batch.set(statsRef, { totalIncome: FieldValue.increment(total) }, { merge: true });
    await batch.commit().catch(err => console.error('[verify-payment] stats write failed:', err));

    return NextResponse.json({ bookingRef });
  } catch (err: any) {
    console.error('[verify-payment]', err);
    return NextResponse.json({ error: err?.message ?? 'Server error.' }, { status: 500 });
  }
}
