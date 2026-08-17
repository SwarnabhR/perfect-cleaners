import 'server-only';
import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminFirestore } from '@/lib/firebase/admin';
import { sendAndStoreSMS, type NotificationPayload } from '@/lib/notify-sms';

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
  if (!isCronCall) {
    if (!bearer) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    try {
      const decoded = await adminAuth().verifyIdToken(bearer);
      const adminSnap = await adminFirestore().collection('admins').doc(decoded.uid).get();
      if (!adminSnap.exists) {
        return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
  }

  try {
    const body: NotificationPayload = await req.json();

    if (!body.type || !body.recipientPhone || !body.recipientName) {
      return NextResponse.json(
        { error: 'Missing required fields: type, recipientPhone, recipientName' },
        { status: 400 },
      );
    }

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
