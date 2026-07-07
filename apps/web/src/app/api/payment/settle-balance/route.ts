import { NextRequest, NextResponse } from 'next/server';

// Razorpay is disabled for now — no live account/keys, and outstanding
// balances are settled by the admin (Billing page "Mark Paid") after
// collecting payment by phone, not by the customer online. Route kept in
// place, real logic commented out, so it's a straightforward flip back on
// once real keys exist.
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: 'Online payment is temporarily unavailable. Our team will contact you to collect payment.' },
    { status: 503 },
  );
}

// import { toErrMsg } from '@/lib/api-error';
// import { NextRequest, NextResponse } from 'next/server';
// import crypto from 'crypto';
// import { FieldValue } from 'firebase-admin/firestore';
// import { adminFirestore, adminAuth } from '@/lib/firebase/admin';
//
// export async function POST(req: NextRequest) {
//   try {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       customerId,
//       amount,
//     } = await req.json();
//
//     if (!customerId || !amount || amount <= 0) {
//       return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
//     }
//
//     // Verify the caller is the customer whose balance is being settled
//     const idToken = (req.headers.get('Authorization') ?? '').replace('Bearer ', '').trim();
//     if (!idToken) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
//     const decoded = await adminAuth().verifyIdToken(idToken);
//     if (decoded.uid !== customerId) {
//       return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
//     }
//
//     const keySecret = process.env.RAZORPAY_KEY_SECRET;
//     if (!keySecret) {
//       return NextResponse.json({ error: 'Payment gateway not configured.' }, { status: 500 });
//     }
//
//     // Verify Razorpay HMAC signature
//     const expected = crypto
//       .createHmac('sha256', keySecret)
//       .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//       .digest('hex');
//
//     if (expected !== razorpay_signature) {
//       return NextResponse.json({ error: 'Payment signature invalid.' }, { status: 400 });
//     }
//
//     const db = adminFirestore();
//
//     // Idempotency — if this paymentId was already recorded, return success without double-writing
//     const existing = await db
//       .collection('customers').doc(customerId)
//       .collection('transactions')
//       .where('paymentId', '==', razorpay_payment_id)
//       .limit(1)
//       .get();
//     if (!existing.empty) {
//       return NextResponse.json({ ok: true, paymentId: razorpay_payment_id });
//     }
//
//     await Promise.all([
//       db.doc(`customers/${customerId}`).update({
//         outstandingBalance: FieldValue.increment(-Math.abs(amount)),
//       }),
//       db
//         .collection('customers')
//         .doc(customerId)
//         .collection('transactions')
//         .add({
//           type:      'payment',
//           amount:    Math.abs(amount),
//           label:     'Balance settlement',
//           paymentId: razorpay_payment_id,
//           orderId:   razorpay_order_id,
//           createdAt: FieldValue.serverTimestamp(),
//         }),
//     ]);
//
//     return NextResponse.json({ ok: true, paymentId: razorpay_payment_id });
//   } catch (err: unknown) {
//     console.error('[settle-balance]', err);
//     return NextResponse.json({ error: toErrMsg(err) }, { status: 500 });
//   }
// }
