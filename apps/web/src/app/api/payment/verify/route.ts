import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '@/lib/firebase/admin';
import { notifySocietyWorkers } from '@/lib/notify-society-workers';

export async function POST(req: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      booking,             // full booking payload from the client
      walletUsed = 0,      // amount deducted from PC wallet (silent, not on invoice)
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

    const db = adminFirestore();

    // Idempotency: return existing booking if this orderId was already processed
    const existing = await db.collection('bookings')
      .where('orderId', '==', razorpay_order_id)
      .limit(1)
      .get();
    if (!existing.empty) {
      const existingData = existing.docs[0].data();
      return NextResponse.json({ bookingRef: existingData.bookingRef });
    }

    // Build booking document (mirrors the Booking type in @pc/firebase)
    const fee      = booking.platformFee ?? 50;
    const subtotal = booking.price ?? 0;
    const gst      = Math.round(subtotal * 0.18);
    const total    = subtotal + gst + fee;

    const suffix     = String(Math.floor(1000 + Math.random() * 9000));
    const bookingRef = `PC-${suffix}`;

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
      priceBreakdown: { subtotal, tax: gst, total },
      paymentStatus:  'paid',
      paymentId:      razorpay_payment_id,
      orderId:        razorpay_order_id,
      photos:         { before: [], after: [] },
      createdAt:      new Date(),
      updatedAt:      new Date(),
    });

    // Increment promo usedCount if a code was applied
    if (booking.promoId) {
      db.collection('promotions').doc(booking.promoId).update({
        usedCount: FieldValue.increment(1),
      }).catch(err => console.error('[verify-payment] promo increment failed:', err));
    }

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
        body:      `${bookingRef} · ${svc} on ${dateStr}. Payment received — ₹${total.toLocaleString('en-IN')} via UPI.`,
        read:      false,
        createdAt: FieldValue.serverTimestamp(),
        bookingId: bookingDoc.id,
      }).catch(err => console.error('[verify-payment] notification write failed:', err));
    }

    // Notify workers assigned to this society (best-effort)
    if (booking.societyId) {
      const svc     = (booking.serviceId ?? 'service').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      const dateStr = new Date(booking.scheduledAt).toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      });
      notifySocietyWorkers(booking.societyId, {
        type:      'new_booking',
        title:     'New booking',
        body:      `${bookingRef} · ${svc} on ${dateStr}.`,
        bookingId: bookingDoc.id,
      }).catch(() => {});
    }

    // SMS confirmation via MSG91 (best-effort — never blocks the response)
    const phone   = booking.customerPhone?.replace(/\D/g, '');
    const authKey = process.env.MSG91_AUTH_KEY;
    if (phone && phone.length >= 10 && authKey) {
      const message = [
        '[Perfect Cleaners] Booking confirmed!',
        `Ref: ${bookingRef}.`,
        `${(booking.serviceId ?? 'service').replace(/-/g, ' ')}.`,
        `Paid ₹${total.toLocaleString('en-IN')} via UPI.`,
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

    // Silently deduct wallet balance if used
    if (walletUsed > 0 && customerId && !customerId.startsWith('phone:')) {
      db.collection('customers').doc(customerId).update({
        walletBalance: FieldValue.increment(-Math.abs(walletUsed)),
      }).catch(err => console.error('[verify-payment] wallet deduct failed:', err));
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
  } catch (err: unknown) {
    console.error('[verify-payment]', err);
    return NextResponse.json({ error: toErrMsg(err) }, { status: 500 });
  }
}
