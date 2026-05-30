import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
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
    await db.collection('bookings').add({
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
        line1:       booking.addressLine1,
        city:        booking.city,
        pincode:     booking.pincode,
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

    return NextResponse.json({ bookingRef });
  } catch (err: any) {
    console.error('[verify-payment]', err);
    return NextResponse.json({ error: err?.message ?? 'Server error.' }, { status: 500 });
  }
}
