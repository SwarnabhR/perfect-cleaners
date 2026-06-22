import 'server-only';
import { toErrMsg } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore, adminAuth } from '@/lib/firebase/admin';
import { sendSMSViaTwilio, normalizePhoneNumber } from '@/lib/twilio';
import { sendSMSVia91msg, normalizePhoneFor91msg } from '@/lib/91msg';

type NotificationType = 'approval' | 'car_cleaned' | 'weekly_reminder' | 'payment_reminder';

interface NotificationPayload {
  type: NotificationType;
  recipientPhone: string;
  recipientName: string;
  data: Record<string, unknown>;
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

async function sendSMS(phone: string, message: string): Promise<SMSResponse> {
  try {
    const provider = process.env.SMS_PROVIDER ?? 'twilio';
    if (provider === '91msg') {
      return await sendSMSVia91msg(normalizePhoneFor91msg(phone), message);
    }
    return await sendSMSViaTwilio(normalizePhoneNumber(phone), message);
  } catch (err: unknown) {
    console.error('[Notification] SMS send failed:', err instanceof Error ? err.message : String(err));
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function buildMessage(type: NotificationType, data: Record<string, unknown>): string {
  switch (type) {
    case 'approval':
      return `✅ Approved! Your car will be cleaned every ${data.schedule} starting ${data.startDate}. -Perfect Cleaners`;
    case 'car_cleaned':
      return `✨ Your car is clean! Ready for pickup. -Perfect Cleaners`;
    case 'weekly_reminder':
      return `🧹 Cleaning reminder: Your car will be cleaned ${data.schedule}. -Perfect Cleaners`;
    case 'payment_reminder':
      return `💳 Payment reminder: ₹${data.amount} due for this month's cleanings. Call us to pay. -Perfect Cleaners`;
    default:
      return 'Message from Perfect Cleaners';
  }
}

async function storeNotification(payload: NotificationPayload, smsResponse: SMSResponse): Promise<string> {
  const db = adminFirestore();
  const notificationId = `${payload.type}_${String(payload.data.customerId)}_${Date.now()}`;
  await db.collection('notifications').doc(notificationId).set({
    type:          payload.type,
    recipientPhone: payload.recipientPhone,
    recipientName:  payload.recipientName,
    data:           payload.data,
    status:         smsResponse.success ? 'sent' : 'failed',
    messageId:      smsResponse.messageId,
    error:          smsResponse.error,
    sentAt:         FieldValue.serverTimestamp(),
  });
  return notificationId;
}

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

    const message      = buildMessage(body.type, body.data);
    const smsResponse  = await sendSMS(body.recipientPhone, message);
    const notificationId = await storeNotification(body, smsResponse);

    return NextResponse.json(
      { success: smsResponse.success, notificationId, message, messageId: smsResponse.messageId },
      { status: smsResponse.success ? 200 : 206 },
    );
  } catch (err: unknown) {
    console.error('[/api/notification/send] Error:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: toErrMsg(err, 'Failed to send notification') }, { status: 500 });
  }
}
