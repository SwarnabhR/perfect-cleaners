import 'server-only';
import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { sendAndStoreSMS, type NotificationPayload } from '@/lib/notify-sms';
import { requireAdmin } from '@/lib/admin-server-auth';
import { adminFirestore } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  // Accept either a Firebase ID token belonging to an admin, or CRON_SECRET
  // (internal server calls). Every real caller of this route is an admin
  // page (live-cleaning, cleaning-schedule, customer-enrollments,
  // pending-approvals) — a bare verifyIdToken() would let ANY signed-in
  // customer or worker send an arbitrary SMS to an arbitrary phone number
  // with attacker-supplied template data, so this must check admin
  // membership the same way every other admin-only route does.
  // CRON_SECRET must actually be configured to count — otherwise a request
  // with no Authorization header at all would satisfy `bearer !== ''`.
  const bearer     = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/, '');
  const cronSecret = process.env.CRON_SECRET;
  const isCronCall = Boolean(cronSecret) && bearer === cronSecret;
  let adminUid: string | null = null;
  if (!isCronCall) {
    if (!bearer) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    try {
      const admin = await requireAdmin(bearer, ['operations', 'support']);
      adminUid = admin.uid;
    } catch (error) {
      const forbidden = error instanceof Error && error.message === 'FORBIDDEN';
      return NextResponse.json({ error: forbidden ? 'Forbidden.' : 'Unauthorized.' }, { status: forbidden ? 403 : 401 });
    }
  }

  try {
    const body: NotificationPayload = await req.json();

    const phone = typeof body.recipientPhone === 'string' ? body.recipientPhone.replace(/\D/g, '') : '';
    if (!['approval', 'car_cleaned', 'weekly_reminder', 'payment_reminder', 'cleaning_missed'].includes(body.type)
      || !/^(91)?[6-9]\d{9}$/.test(phone)
      || typeof body.recipientName !== 'string'
      || body.recipientName.trim().length < 1
      || body.recipientName.length > 100
      || typeof body.data !== 'object' || body.data === null || Array.isArray(body.data)) {
      return NextResponse.json(
        { error: 'Invalid notification request.' },
        { status: 400 },
      );
    }

    const allowedDataKeys: Record<string, string[]> = {
      approval: ['customerId', 'societyName', 'tower', 'schedule', 'startDate'],
      car_cleaned: ['customerId', 'carPlate', 'societyName', 'tower'],
      weekly_reminder: ['customerId', 'schedule', 'societyName'],
      payment_reminder: ['customerId', 'amount', 'societyName'],
      cleaning_missed: ['customerId', 'societyName', 'tower', 'reason', 'nextDateLabel'],
    };
    if (Object.keys(body.data).some(key => !allowedDataKeys[body.type]?.includes(key))
      || Object.entries(body.data).some(([key, value]) => key === 'amount'
        ? typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1_000_000
        : typeof value !== 'string' || value.length > 160)) {
      return NextResponse.json({ error: 'Invalid notification data.' }, { status: 400 });
    }

    if (!isCronCall && adminUid) {
      const minute = Math.floor(Date.now() / 60_000);
      const limitRef = adminFirestore().collection('apiRateLimits').doc(`notification_${adminUid}`);
      const overLimit = await adminFirestore().runTransaction(async transaction => {
        const snap = await transaction.get(limitRef);
        const previous = snap.data();
        const count = previous?.minute === minute ? (previous.count as number | undefined) ?? 0 : 0;
        if (count >= 15) return true;
        transaction.set(limitRef, { minute, count: count + 1, expiresAt: new Date((minute + 10) * 60_000) });
        return false;
      });
      if (overLimit) return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
    }

    body.recipientPhone = phone.slice(-10);

    const result = await sendAndStoreSMS(body);

    return NextResponse.json(
      { success: result.success, notificationId: result.notificationId, message: result.message, messageId: result.messageId },
      { status: result.success ? 200 : 206 },
    );
  } catch (err: unknown) {
    console.error('[/api/notification/send] Error:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: toErrMsg(err, 'Failed to send notification') }, { status: 500 });
  }
}
