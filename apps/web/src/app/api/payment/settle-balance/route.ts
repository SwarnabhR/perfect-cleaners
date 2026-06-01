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
      customerId,
      amount,
    } = await req.json();

    if (!customerId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
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

    await Promise.all([
      db.doc(`customers/${customerId}`).update({
        outstandingBalance: FieldValue.increment(-Math.abs(amount)),
      }),
      db
        .collection('customers')
        .doc(customerId)
        .collection('transactions')
        .add({
          type:      'payment',
          amount:    Math.abs(amount),
          label:     'Balance settlement',
          paymentId: razorpay_payment_id,
          orderId:   razorpay_order_id,
          createdAt: FieldValue.serverTimestamp(),
        }),
    ]);

    return NextResponse.json({ ok: true, paymentId: razorpay_payment_id });
  } catch (err: any) {
    console.error('[settle-balance]', err);
    return NextResponse.json({ error: err?.message ?? 'Server error.' }, { status: 500 });
  }
}
