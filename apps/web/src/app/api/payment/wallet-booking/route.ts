import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore, adminAuth } from '@/lib/firebase/admin';
import { notifySocietyWorkers } from '@/lib/notify-society-workers';

export async function POST(req: NextRequest) {
  try {
    const { booking, walletUsed } = await req.json();

    if (!booking?.customerId || !walletUsed || walletUsed <= 0) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    // Verify the caller is the customer (token from Authorization header)
    const authHeader = req.headers.get('Authorization') ?? '';
    const idToken    = authHeader.replace('Bearer ', '').trim();
    if (!idToken) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const decoded = await adminAuth().verifyIdToken(idToken);
    if (decoded.uid !== booking.customerId) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    // Confirm customer has sufficient wallet balance
    const db       = adminFirestore();
    const custSnap = await db.collection('customers').doc(booking.customerId).get();
    const balance  = custSnap.exists ? (custSnap.data()?.walletBalance ?? 0) : 0;
    if (balance < walletUsed) {
      return NextResponse.json({ error: 'Insufficient wallet balance.' }, { status: 400 });
    }

    const fee      = booking.platformFee ?? 50;
    const subtotal = booking.price ?? 0;
    const gst      = Math.round(subtotal * 0.18);
    const total    = subtotal + gst + fee;
    const suffix   = String(Math.floor(1000 + Math.random() * 9000));
    const bookingRef = `PC-${suffix}`;

    const bookingDoc = await db.collection('bookings').add({
      bookingRef,
      customerId:    booking.customerId,
      customerName:  booking.customerName,
      customerPhone: `+91${booking.customerPhone}`,
      serviceIds:    [booking.serviceId],
      vehicle: {
        id: 'web_booking_vehicle',
        make: booking.vehicleMake, model: booking.vehicleModel,
        year: new Date().getFullYear(),
        type: booking.vehicleType ?? 'sedan',
        registration: (booking.vehiclePlate ?? 'UNKNOWN').toUpperCase(),
        color: 'UNKNOWN',
      },
      status:     'pending',
      scheduledAt: new Date(booking.scheduledAt),
      address: {
        societyId: booking.societyId ?? '', societyName: booking.societyName ?? '',
        tower: booking.tower ?? null, flatNo: booking.flatNo ?? '',
        garageNo: booking.garageNo ?? null,
        line1: [booking.flatNo, booking.tower, booking.societyName].filter(Boolean).join(', '),
        pincode: '', coordinates: { latitude: 0, longitude: 0 },
      },
      priceBreakdown: { subtotal, tax: gst, total },
      paymentStatus:  'paid',
      walletUsed,
      photos:    { before: [], after: [] },
      createdAt: new Date(), updatedAt: new Date(),
    });

    // Increment promo usedCount if a code was applied
    if (booking.promoId) {
      db.collection('promotions').doc(booking.promoId).update({
        usedCount: FieldValue.increment(1),
      }).catch(err => console.error('[wallet-booking] promo increment failed:', err));
    }

    // Notify workers assigned to this society (best-effort)
    if (booking.societyId) {
      notifySocietyWorkers(booking.societyId, {
        type:      'new_booking',
        title:     'New booking',
        body:      `${bookingRef} · ${(booking.serviceId ?? 'service').replace(/-/g, ' ')} at ${booking.societyName ?? booking.societyId}.`,
        bookingId: bookingDoc.id,
      }).catch(() => {});
    }

    // Deduct wallet balance atomically
    await db.collection('customers').doc(booking.customerId).update({
      walletBalance: FieldValue.increment(-Math.abs(walletUsed)),
    });

    // Log to paymentLogs + stats
    const batch   = db.batch();
    const logRef  = db.collection('paymentLogs').doc();
    batch.set(logRef, {
      bookingId: bookingDoc.id, bookingRef,
      customerId: booking.customerId, customerName: booking.customerName ?? '',
      customerPhone: `+91${booking.customerPhone}`,
      amount: walletUsed, type: 'wallet_booking',
      paidAt: FieldValue.serverTimestamp(),
    });
    const statsRef = db.collection('stats').doc('income');
    batch.set(statsRef, { totalIncome: FieldValue.increment(walletUsed) }, { merge: true });
    await batch.commit();

    return NextResponse.json({ bookingRef });
  } catch (err: any) {
    console.error('[wallet-booking]', err);
    return NextResponse.json({ error: err?.message ?? 'Server error.' }, { status: 500 });
  }
}
