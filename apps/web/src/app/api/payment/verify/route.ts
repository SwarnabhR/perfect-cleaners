import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore, adminAuth } from '@/lib/firebase/admin';
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

    // Verify caller identity — extract Firebase ID token if present
    const bearer = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/, '');
    let verifiedUid: string | null = null;
    if (bearer) {
      try {
        const decoded = await adminAuth().verifyIdToken(bearer);
        verifiedUid = decoded.uid;
      } catch {
        // Invalid token — continue as guest (wallet use will be blocked below)
      }
    }

    // Wallet deduction requires a verified identity so we can't be tricked
    // into draining someone else's balance via a spoofed customerId.
    if (walletUsed > 0 && !verifiedUid) {
      return NextResponse.json({ error: 'Authentication required for wallet payments.' }, { status: 401 });
    }

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

    // Resolve customerId: server-verified UID takes precedence over anything the
    // client sends — prevents a booking being created under a different user's account.
    const customerId: string = verifiedUid ?? booking.customerId ?? `phone:${booking.customerPhone}`;

    // If wallet was used, verify the customer actually has enough balance.
    // Cap at the real balance to prevent over-deduction even if the client lies.
    let cappedWalletUsed = 0;
    if (walletUsed > 0 && verifiedUid) {
      const customerSnap = await db.collection('customers').doc(verifiedUid).get();
      const actualBalance = (customerSnap.data()?.walletBalance ?? 0) as number;
      cappedWalletUsed = Math.min(Math.abs(walletUsed), actualBalance);
      if (cappedWalletUsed <= 0) {
        return NextResponse.json({ error: 'Insufficient wallet balance.' }, { status: 400 });
      }
    }

    // Pre-generate the booking doc ref so it can join the same WriteBatch as
    // the payment log and income stats — all three commit atomically or none do.
    const bookingDocRef = db.collection('bookings').doc();
    const logRef        = db.collection('paymentLogs').doc();
    const statsRef      = db.collection('stats').doc('income');

    const batch = db.batch();

    batch.set(bookingDocRef, {
      bookingRef,
      customerId,
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

    batch.set(logRef, {
      bookingId:    bookingDocRef.id,
      bookingRef,
      customerId,
      customerName: booking.customerName ?? '',
      customerPhone:`+91${booking.customerPhone}`,
      amount:       total,
      type:         'online_booking',
      paidAt:       FieldValue.serverTimestamp(),
    });

    batch.set(statsRef, { totalIncome: FieldValue.increment(total) }, { merge: true });

    // Single commit — booking + payment record + stats are written together or not at all
    await batch.commit();

    const bookingDocId = bookingDocRef.id;

    // ── Best-effort side effects (none of these block the response) ────────────

    if (booking.promoId) {
      db.collection('promotions').doc(booking.promoId).update({
        usedCount: FieldValue.increment(1),
      }).catch(err => console.error('[verify-payment] promo increment failed:', err));
    }

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
        bookingId: bookingDocId,
      }).catch(err => console.error('[verify-payment] notification write failed:', err));
    }

    if (booking.societyId) {
      const svc     = (booking.serviceId ?? 'service').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      const dateStr = new Date(booking.scheduledAt).toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      });
      notifySocietyWorkers(booking.societyId, {
        type:      'new_booking',
        title:     'New booking',
        body:      `${bookingRef} · ${svc} on ${dateStr}.`,
        bookingId: bookingDocId,
      }).catch(() => {});
    }

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

    if (cappedWalletUsed > 0 && verifiedUid) {
      db.collection('customers').doc(verifiedUid).update({
        walletBalance: FieldValue.increment(-cappedWalletUsed),
      }).catch(err => console.error('[verify-payment] wallet deduct failed:', err));
    }

    return NextResponse.json({ bookingRef });
  } catch (err: unknown) {
    console.error('[verify-payment]', err);
    return NextResponse.json({ error: toErrMsg(err) }, { status: 500 });
  }
}
