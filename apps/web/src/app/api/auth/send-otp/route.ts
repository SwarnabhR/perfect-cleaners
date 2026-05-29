import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

const TURNSTILE_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const OTP_TTL_MS    = 10 * 60 * 1000; // 10 min
const MAX_PER_HOUR  = 5;

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const res  = await fetch(TURNSTILE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret:   process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: ip,
    }),
  });
  const json = await res.json();
  return json.success === true;
}

async function sendSms(phone: string, otp: string): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    console.info(`[DEV] OTP for +91${phone}: ${otp}`);
    return;
  }
  // Production: plug in MSG91 / Twilio via NEXT_PUBLIC_SMS_PROVIDER env
  // MSG91 example:
  // await fetch(`https://control.msg91.com/api/v5/otp?mobile=91${phone}&otp=${otp}&authkey=${key}&template_id=${tid}`);
  throw new Error('Set up an SMS provider in send-otp/route.ts for production.');
}

export async function POST(req: NextRequest) {
  try {
    const { phone, turnstileToken } = await req.json();
    const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for') ?? '';

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ error: 'Enter a valid 10-digit Indian mobile number.' }, { status: 400 });
    }

    // Verify Turnstile
    const human = await verifyTurnstile(turnstileToken, ip);
    if (!human) {
      return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 400 });
    }

    const db  = adminFirestore();
    const ref = db.collection('otpVerifications').doc(phone);
    const doc = await ref.get();

    // Rate-limit: max MAX_PER_HOUR sends per phone per rolling hour
    if (doc.exists) {
      const data   = doc.data()!;
      const recent = (data.sentCount ?? 0);
      const window = data.windowStart ?? 0;
      const now    = Date.now();
      const inWindow = now - window < 60 * 60 * 1000;

      if (inWindow && recent >= MAX_PER_HOUR) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait before requesting another code.' },
          { status: 429 },
        );
      }
    }

    const otp = generateOtp();
    await sendSms(phone, otp);

    const prev = (doc.exists && (Date.now() - (doc.data()?.windowStart ?? 0)) < 60 * 60 * 1000)
      ? (doc.data()?.sentCount ?? 0)
      : 0;

    await ref.set({
      otp,
      expiresAt:   Date.now() + OTP_TTL_MS,
      attempts:    0,
      sentCount:   prev + 1,
      windowStart: doc.exists && prev > 0 ? (doc.data()?.windowStart ?? Date.now()) : Date.now(),
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[send-otp]', err);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
