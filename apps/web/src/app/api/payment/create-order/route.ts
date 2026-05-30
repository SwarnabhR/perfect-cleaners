import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { amount, receipt } = await req.json();

    if (!amount || amount < 1) {
      return NextResponse.json({ error: 'Invalid amount.' }, { status: 400 });
    }

    const keyId     = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Payment gateway not configured.' }, { status: 500 });
    }

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        amount:   Math.round(amount * 100), // paise
        currency: 'INR',
        receipt:  receipt ?? `pc_${Date.now()}`,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[create-order] Razorpay:', data);
      return NextResponse.json(
        { error: data.error?.description ?? 'Could not create payment order.' },
        { status: 502 },
      );
    }

    return NextResponse.json({
      orderId:  data.id,
      amount:   data.amount,   // paise
      currency: data.currency,
      keyId,                    // needed by the client for Razorpay checkout
    });
  } catch (err: any) {
    console.error('[create-order]', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
