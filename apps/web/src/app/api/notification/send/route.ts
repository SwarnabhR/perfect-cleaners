import 'server-only';
import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { sendAndStoreSMS, type NotificationPayload } from '@/lib/notify-sms';

export async function POST(req: NextRequest) {
  // Accept either a Firebase ID token (admin dashboard) or CRON_SECRET (internal server calls).
  const bearer = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/, '');
  if (bearer !== (process.env.CRON_SECRET ?? '')) {
    try {
      await adminAuth().verifyIdToken(bearer);
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
